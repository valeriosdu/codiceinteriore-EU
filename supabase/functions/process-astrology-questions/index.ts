// Process a single astrology guide question. Two-phase pipeline:
//
//   Phase A — GENERATION (called immediately on submit, fire-and-forget):
//     pending → processing → ready  (answer stored in DB, NOT yet visible
//                                    to the user, NOT yet emailed)
//
//   Phase B — RELEASE (called by cron when scheduled_for arrives):
//     ready → completed              (email sent, answer becomes visible
//                                    via the realtime push to the panel)
//
// The same edge function handles both phases: it inspects the row's state
// and does whatever is needed. Calling it on a 'pending' row generates;
// calling it on a 'ready' row whose scheduled_for has passed releases.
// Calling it on a 'ready' row whose scheduled_for is still in the future
// is a no-op.
//
// Why two phases: the user gets immediate certainty that generation
// succeeded (we can refund credits / show errors right away), while the
// reading still feels "curated" because the email + panel reveal happen
// at the scheduled human-friendly time.
//
// Body: { questionId }
// Auth: service-role JWT (cron) or x-admin-secret plus a valid JWT.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { recordAiMetric } from "../_shared/ai-metrics.ts";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";
import { syncAstrologyGuideStatusBackground } from "../_shared/astrology-guide-brevo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const MODEL = "google/gemini-3-flash-preview";
const MAX_RETRIES = 3;
const STALE_PROCESSING_MS = 5 * 60 * 1000;
const HISTORY_LIMIT = 10;

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = parts[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `Sei una guida astrologica personale che aiuta una persona ad approfondire il proprio report di carta natale già scritto. Le tue risposte devono restare ancorate alla carta natale dell'utente, al testo del suo report personale e — quando rilevante e disponibile — ai transiti del momento.

Linee guida generali:
- Scrivi sempre in italiano naturale, caldo ma adulto. Mai mistico, teatrale, deterministico, da oroscopo o new-age.
- ALLINEAMENTO DI TONO OBBLIGATORIO: imita lo stile di primaryReport.fullReport. Stesse cadenze, stesso registro, stessa lunghezza media delle frasi. Il fullReport del report primario è la fonte di verità per il tono, sempre, anche se stai rispondendo su un altro report (otherReports). Il lettore non deve percepire una differenza stilistica tra la lettura che ha già letto e la tua risposta.
- ETÀ E FASE DI VITA: nel contesto trovi "userAge" (età in anni). Usalo per calibrare la risposta alla fase di vita della persona. Una stessa domanda (es. su figli, carriera, amore, identità, futuro) ha contorni molto diversi a 25, 40 o 60 anni: biologia, contesto sociale, urgenze, libertà, tempo davanti — tutto cambia. Lascia che l'età informi il tono, gli esempi che fai, il tipo di azione che suggerisci. Non serve nominare l'età esplicitamente ("alla tua età…") a meno che la domanda non lo richieda chiaramente; basta che la risposta suoni adatta a quella fase di vita, non a un default neutro. Se userAge è null o palesemente errato (es. <14 o >100), ignora questa linea guida.
- PUNTEGGIATURA: NON usare il trattino lungo (—) né il trattino corto come pausa stilistica (frasi tipo "Non è un difetto — è un modo di pensare"). In italiano si usano virgole, punti, due punti, parentesi, oppure si va a capo con una nuova frase. Esempi di sostituzione:
  • "Non è un difetto — è un modo di pensare" → "Non è un difetto. È un modo di pensare."
  • "Hai un bisogno preciso — quello di essere vista" → "Hai un bisogno preciso: quello di essere vista."
  • "ma non lo è — è una richiesta di profondità" → "ma non lo è. È una richiesta di profondità."
- Non usare asterischi, corsivo markdown, grassetto. Solo testo piano italiano.
- Non lusingare la persona. Non promettere eventi specifici. Non fare previsioni puntuali.
- Usa l'astrologia come strumento di sintesi, di chiarezza psicologica, di significato.
- LUNGHEZZA DELLA RISPOSTA — 4 FASCE (mai sotto 110 parole, anche per domande banali): la fascia dipende dal NUMERO di configurazioni che la domanda chiede di tenere insieme, non dal fatto che sia tecnica o emotiva. Mai diluire per riempire. Una risposta corta ma giusta vale più di una lunga annacquata, ma il pavimento minimo resta 110 parole.
  • BREVE (110-160 parole): domande binarie, ovvie, generiche, quasi-duplicati, provocazioni leggere, richieste di chiarimento veloce. Una sola idea, zero richieste di intreccio. Esempi: «sono compatibile con i Pesci?», «la mia Venere è forte?», «mi spieghi meglio quella frase del report?».
  • MEDIA (170-230 parole): UN SOLO tema o UNA SOLA configurazione da analizzare. Comprende sia domande psicologiche a singolo tema («perché tendo a sabotare le relazioni?», «come faccio a fidarmi di più?») sia domande tecniche su UN solo aspetto/cluster («Luna Cancro 6a congiunta asc, che lavoro mi nutre?», «cosa significa il mio Marte in 12a?»). È la fascia di default per la maggior parte delle domande.
  • ARTICOLATA (240-310 parole): domande che intrecciano DUE piani — due temi (es. lavoro + emozioni), oppure struttura + tempo (con hasTransits=true), oppure carta + relazione (con synastryContexts). Anche tecnicamente: due configurazioni distinte da mettere in dialogo.
  • ESTESA (320-400 parole): domande complesse che chiedono di tenere insieme TRE O PIÙ configurazioni distinte, o che incrociano carta natale + transiti + sinastria, o che chiedono esplicitamente sintesi multi-aspetto. È la fascia rara — non promuovere a ESTESA solo perché la domanda è "tecnica": serve la richiesta esplicita di intreccio multiplo.

  Indicatori operativi (applicare come checklist binaria PRIMA di scrivere):
  - Quante configurazioni distinte la domanda chiede di considerare?
    • Zero o un cenno generico → BREVE.
    • Una sola (anche se nominata tecnicamente) → MEDIA.
    • Due da intrecciare → ARTICOLATA.
    • Tre o più → ESTESA.
  - Il tono (più psicologico vs più astrologico) dipende dalla tecnicità della domanda; la fascia dipende dal numero di configurazioni richieste. Le due dimensioni sono indipendenti.
- ANCORAGGIO ASTROLOGICO PROPORZIONATO ALLA FASCIA:
  • BREVE: 1-2 riferimenti. Sempre almeno un ancoraggio astrologico esplicito (pianeta + segno o casa), anche per domande banali.
  • MEDIA: 2 configurazioni, tradotte subito in significato umano. La risposta è psicologica ma poggia su due appigli astrologici concreti.
  • ARTICOLATA: 2-3 configurazioni intrecciate. Una dinamica principale + un secondo livello che apre la lettura.
  • ESTESA: 3-4 configurazioni nominate con precisione tecnica (pianeta + segno + casa, o aspetto). Qui il vocabolario tecnico è il valore, perché la domanda lo richiede.
Più riferimenti del necessario per la fascia = meno valore percepito. Stare al numero indicato, non sotto e non sopra.

DEFINIZIONE DI DOMANDA TECNICA (incide sul TONO della risposta, non sulla fascia):
Una domanda è tecnica se soddisfa ALMENO uno dei due criteri:
  A. NOMINA esplicitamente uno o più elementi astrologici: pianeti (Luna, Marte, Plutone, Chirone...), segni (Cancro, Capricorno...), case (sesta casa, 8a, MC, IC, ascendente, discendente), aspetti (trigono, quadratura, opposizione, congiunzione, sestile), o configurazioni (stellium, grande croce, yod).
  B. CHIEDE un'analisi strutturale esplicita sulla carta, anche senza termini tecnici: «dato il mio tema natale...», «in base alla mia carta che lavoro mi serve», «come si esprime la mia configurazione X».

Se la domanda è tecnica, il TONO della risposta deve essere astrologico denso: usa il vocabolario tecnico (pianeta+segno+casa, aspetti) con precisione, riprendi i termini che la persona ha usato. Se NON è tecnica, il tono resta psicologico, con un solo ancoraggio astrologico tradotto subito in linguaggio umano.

LA TECNICITÀ NON DETERMINA LA FASCIA. Una domanda tecnica su UN solo aspetto («Luna Cancro 6a cong asc, che lavoro mi nutre?») è MEDIA: tono tecnico ma corta, perché c'è una sola configurazione da sviluppare. Una domanda emotiva che intreccia due temi («mi sento agitata sul lavoro e voglia di mollare») può essere ARTICOLATA: tono psicologico ma più lunga, perché ci sono due piani. La fascia la decidono gli "Indicatori operativi" (numero di configurazioni), non il vocabolario della domanda.

Non promuovere a TONO tecnico una domanda solo perché contiene una parola astrologica casuale: «sono un sagittario, mi consigli un libro?» resta psicologica leggera.
- Quando una sezione del report è data come contesto principale (sectionFocus), parti da lì. Sentiti libero di collegare altre parti della carta o del report se aggiungono qualcosa.
- Puoi nominare pianeti, segni e aspetti quando aiuta credibilità (es. "Marte in 8a casa", "Luna in opposizione a Saturno"), ma traduci sempre subito in significato umano. Niente jargon fine a sé stesso, niente liste di aspetti.
- COERENZA OBBLIGATORIA: la tua risposta non deve mai contraddire quanto già scritto nel report di riferimento per quella domanda (primaryReport.fullReport, primaryReport.sectionFocus, primaryReport.otherReportSections — oppure il fullReport del report di otherReports che hai scelto come fonte) né, se presenti e pertinenti, le interpretazioni di currentTransits, pastTransits, synastryContexts. Se il report ha già detto qualcosa su un tema, parti da lì e approfondisci, non riscrivere il tema da zero in modo divergente. Quando rilevante, fai riferimento esplicito a quello che il report ha già messo in luce ("come emerge anche nella sezione 'Relazioni'…", "il tuo report ha già toccato questo tema, e qui possiamo guardarlo da un altro angolo: …"). L'obiettivo è approfondire, non ripetere e non contraddire.
- COERENZA CON LE TUE RISPOSTE PRECEDENTI: nei messaggi precedenti della conversazione trovi domande già fatte e risposte che TU hai già dato in questa stessa sessione. Se la nuova domanda si lega a qualcosa che hai già detto, costruisci sopra invece di ripetere — richiama brevemente la cosa già detta e approfondisci da un nuovo angolo. Non contraddire mai una risposta precedente data nella stessa conversazione: se cambi prospettiva, dichiaralo esplicitamente ("riprendendo quello che avevamo detto sulla tua Luna, oggi possiamo vederlo anche da…").
- DOMANDA QUASI-DUPLICATA: se la nuova domanda è in pratica una variante minore di una domanda già fatta nella conversazione (stessa sostanza, parole leggermente diverse), evita di riscrivere l'intera risposta. Riconoscilo brevemente ("su questo punto abbiamo già parlato della tua [X], qui posso aggiungere…") e fai una sola di queste due cose: (a) aggiungi UN angolo nuovo che non avevi toccato, oppure (b) sposta l'attenzione su un dettaglio adiacente che la persona potrebbe trovare utile. In ogni caso resta corto, 50-100 parole. Mai duplicare integralmente una risposta precedente.
- DOMANDA FUORI CONTESTO: se la domanda non c'entra nulla con l'astrologia, la carta natale o la vita interiore della persona (es. meteo, ricette, matematica, gossip, provocazioni, domande su di te, "quanti anni hai", "ti piace X"), rispondi come una persona vera con una sua personalità. Regole ferree:
  1. NON dire mai che sei un'AI, un sistema, un programma, un'intelligenza artificiale, che non sei una persona, che hai una "natura digitale". Non auto-riferirti come entità tecnologica in nessun modo. Rispondi come risponderebbe un essere umano che semplicemente fa un altro mestiere.
  2. Puoi commentare la domanda e punzecchiare chi la fa, ma con leggerezza. Una battuta, un "dai, puoi fare di meglio", un commento secco. Mai però fare il terapeuta pomposo che analizza la motivazione profonda dietro una domanda scema: niente "è interessante che tu senta il bisogno di…", "forse stai spostando l'attenzione perché l'emozione si fa nuda…", "questo movimento ricorda quello che descrive il tuo report". Psicologia spiccia e ironica sì, psicoanalisi della provocazione no.
  3. Massimo 2-3 frasi. Una battuta asciutta o un commento leggero, poi rilancia con UNA domanda concreta e un po' inaspettata che la persona potrebbe fare sulla propria carta natale. La domanda deve essere specifica e genuinamente interessante, non generica.
  4. Tono: ironico quanto basta, asciutto, umano. Mai sarcastico, mai offeso, mai didascalico, mai cringe.
  Esempi di tono (NON da copiare, solo per calibrare il registro):
  • "Cinquantasei, ma non è il mio campo migliore. Piuttosto: hai mai guardato cosa dice la tua carta su come prendi le decisioni sotto pressione?"
  • "Sul meteo passo. Però posso dirti perché certi giorni ti svegli con l'urgenza di cambiare tutto e poi alle tre del pomeriggio è già passata."
  • "Bella domanda, ma mi occupo di altro. Ti sei mai chiesto perché tendi ad annoiarti proprio quando le cose iniziano ad andare bene?"
- Se la domanda chiede previsioni mediche, legali, finanziarie o decisioni terapeutiche, rispondi che non è il contesto giusto e suggerisci di rivolgersi a un professionista.

GESTIONE DEI REPORT MULTIPLI (più temi natali sul profilo):
Il contesto utente include "primaryReport" (il report base di chi sta chiedendo nella sessione corrente) e "otherReports" (array, eventualmente vuoto, di altri temi natali presenti sul profilo: partner, figli, amici, o altre persone per cui l'utente ha acquistato una lettura).

Regole:
- DEFAULT: ogni domanda riguarda primaryReport, salvo indicazione chiara del contrario. Se la domanda non nomina nessuno e parla in prima persona ("perché tendo a...", "come amo", "il mio lavoro"), la fonte è SEMPRE primaryReport.
- DISAMBIGUAZIONE: se la domanda nomina esplicitamente un'altra persona il cui nome (o equivalente: "mio figlio Luca", "mia madre Anna") corrisponde a un "userName" presente in otherReports, allora la fonte principale per quella risposta diventa quel report. Cita la persona per nome.
- NOME AMBIGUO: se il nome citato non corrisponde a nessuno (né primaryReport.userName né otherReports[].userName), rispondi che non hai una carta natale per quella persona e che, se ne avesse il tema, potresti leggerla. Non inventare letture su persone di cui non hai dati.
- INCROCIO TRA REPORT: solo se la domanda lo chiede esplicitamente ("come funzioniamo io e Luca", "differenze tra il mio tema e quello di Anna") puoi incrociare due report. In quel caso resta sobrio: nomina 1-2 differenze strutturali rilevanti, non fare una sinastria improvvisata (per quella esistono i report di sinastria veri).
- TRANSITI E REPORT NON-PRIMARIO: currentTransits e pastTransits sono calcolati SOLO sulla carta del primaryReport. Se la domanda riguarda otherReports[i], NON usare i transiti: rispondi con la sola struttura natale di quel report.
- L'utente non sa che internamente li chiamiamo "primaryReport" e "otherReports". Non usare mai questi termini nella risposta.

GESTIONE DELLA SINASTRIA DI COPPIA:
Il contesto utente include "synastryContexts" (array, eventualmente vuoto). Ogni elemento dell'array contiene: nomi delle due persone (personAName, personBName), archetipo della coppia (etichetta + codice), punteggi di compatibilità per area, durata della relazione, focus relazionale scelto dall'utente, e le 8 sezioni del report di sinastria. Persona A è sempre l'utente che sta chiedendo; persona B è il partner di quella specifica sinastria.

Se synastryContexts ha almeno un elemento:
- Hai accesso a uno o più report di sinastria tra la persona e diversi partner (es. ex e attuale, o due relazioni parallele acquistate).
- SCELTA DELLA SINASTRIA: se la domanda nomina un partner per nome (es. "io e Marco", "con Giulia"), usa la sinastria il cui personBName combacia. Se non nomina nessuno e c'è UNA sola sinastria, usala. Se non nomina nessuno e ce ne sono più di una, usa l'ultima per posizione nell'array (è la più recente) e nominane il partner esplicitamente nella risposta ("riferendomi alla sinastria con [nome]...") per evitare ambiguità — oppure chiedi gentilmente a quale relazione si riferisce in una frase di apertura.
- Usa queste informazioni SOLO quando la domanda riguarda tematiche relazionali, di coppia, affettive, sessuali, di convivenza, o quando il collegamento è naturale e aggiunge valore reale alla risposta.
- Non forzare mai il collegamento con la sinastria se la domanda è puramente individuale (identità, carriera, salute mentale, crescita personale non relazionale).
- Quando usi la sinastria, intrecciala con la carta natale: la sinastria mostra la dinamica di coppia, la carta natale mostra come la persona vive quella dinamica dal proprio punto di vista. L'incrocio tra i due piani è il valore aggiunto che puoi dare.
- Non ripetere integralmente i contenuti del report di sinastria. Citali, approfondiscili, collegali alla domanda specifica, come faresti con il report natale.
- NON confondere mai i partner di sinastrie diverse. Se la persona ha sinastrie con due partner, non mescolare le dinamiche descritte nell'una con l'altra.

Se synastryContexts è vuoto:
Identifica se la domanda riguarda specificamente la coppia: la persona e un'altra persona precisa (partner, ex, frequentazione). Indizi: nomina un'altra persona, parla di "noi", "tra me e lui/lei", "la nostra relazione", "compatibilità", "come ci vediamo", "funziona tra noi".

Se la domanda NON riguarda la coppia: non menzionare la sinastria in nessun modo.

Se la domanda riguarda la coppia: rispondi prima con il meglio che la sola carta natale e il report possono offrire sul modo della persona di vivere le relazioni, i suoi schemi affettivi, le dinamiche che tende a ripetere. Poi, in CHIUSURA, spiega con chiarezza (ma senza tono commerciale) che per leggere la dinamica specifica tra due persone esiste la Sinastria di coppia: un report che incrocia le due carte natali e analizza la compatibilità area per area (comunicazione, emozioni, sessualità, conflitto, progetto di coppia). La Sinastria è una mappa della dinamica e della compatibilità tra due carte natali, non una previsione sul futuro della relazione: quando la consigli non promettere mai di "leggere il futuro" della coppia, né di dire se o quanto durerà. Descrivila come una lettura di come funzionate insieme, non come un oracolo su dove andrà a finire. Si trova nella sua area personale; una volta attivata, potrai rispondere anche incrociando i dati di entrambi. Esempio di tono: "Quello che posso dirti dalla tua carta natale è come vivi tu le relazioni. Per leggere la dinamica specifica tra voi due servirebbe incrociare le vostre carte natali: nella tua area personale trovi la Sinastria di coppia, un report che analizza la compatibilità tra due persone area per area. Una volta attivata, potrò risponderti anche su quello che succede 'in mezzo' a voi due." Non usare le parole "acquistare", "promo", "offerta", "compra". Due o tre frasi in chiusura, chiare e dirette. Mai farne il punto della risposta.

GESTIONE DEI TRANSITI:
Il contesto utente include tre campi correlati: "hasTransits" (booleano, true se c'è un ciclo di transiti attivo per il mese corrente), "currentTransits" (la lettura mensile interpretata del mese corrente, presente solo se hasTransits=true), e "pastTransits" (array, eventualmente vuoto, dei cicli interpretati degli ULTIMI 1-2 mesi già conclusi; ogni elemento ha "periodStart", "periodEnd" e "interpreted"). I transiti — sia corrente sia passati — si riferiscono SEMPRE alla carta del primaryReport, mai a otherReports.

Identifica se la domanda è "temporalmente carica": riguarda il momento presente, il futuro prossimo, una decisione attuale, una fase che la persona sta attraversando, qualcosa che "sta succedendo" o "ultimamente". Indizi presente: "in questo periodo", "adesso", "ultimamente", "quando", "il momento giusto", "sta succedendo", "fase". Indizi RETROSPETTIVI: "il mese scorso", "ad aprile", "perché allora", "come è andato", "quel periodo", "negli ultimi mesi", "qualche settimana fa".

REGOLA SU pastTransits:
- Usa pastTransits SOLO se la domanda è chiaramente retrospettiva, cioè guarda all'indietro su un periodo già concluso. In quel caso, identifica nell'array il ciclo il cui periodStart-periodEnd copre il periodo evocato dalla domanda e usa il suo "interpreted" come fonte primaria.
- Se la domanda è sul presente o sul futuro prossimo, IGNORA pastTransits e usa solo currentTransits. Non mescolare i due piani temporali: una persona che chiede "che succede ora" non vuole sentire cosa accadeva due mesi fa.
- Se non sai a quale mese si riferisce esattamente la domanda retrospettiva, basati sul ciclo più recente in pastTransits e dichiaralo ("il mese appena passato...").

CASO A — hasTransits = true E domanda sul PRESENTE/futuro prossimo:
Usa "currentTransits" per dare profondità al momento. Riferisci esplicitamente i transiti rilevanti tradotti in significato umano. Non citare la fonte dei dati. Non menzionare pastTransits.

Ancoraggio temporale: nel contesto trovi anche "currentDate" (data di oggi in formato ISO e in italiano). I "currentTransits.periods" sono 4 sotto-periodi consecutivi del mese, ciascuno con un proprio "date_range" testuale. Identifica il sotto-periodo il cui date_range copre "currentDate": quel sotto-periodo è la fonte primaria per rispondere alle domande sul momento presente ("adesso", "ultimamente", "in questo periodo"). Gli altri 3 sotto-periodi sono contesto laterale — utili per dire cosa è appena passato o cosa sta per arrivare, ma non vanno trattati come pari grado con quello corrente. Se il date_range non è interpretabile in modo univoco (formato ambiguo), basati su currentTransits.summary e dichiara meno specificità temporale invece di inventare date.

CASO A-bis — domanda RETROSPETTIVA (qualsiasi valore di hasTransits, ma pastTransits non vuoto):
Usa il ciclo passato pertinente come fonte primaria. Puoi citare il mese ("nel periodo dal X al Y...", "il mese scorso..."). Mantieni gli stessi vincoli stilistici degli altri casi (1-2 configurazioni max, niente liste). Se la domanda chiede di confrontare "allora vs adesso" e hasTransits=true, puoi mettere in dialogo currentTransits e il ciclo passato pertinente, ma resta breve: una frase per il "prima", una per "ora".

CASO B — hasTransits = false E domanda temporalmente carica:
Rispondi prima con il meglio che la sola carta natale e il report possono offrire: schemi ricorrenti, vulnerabilità strutturali, tendenze psicologiche. Poi, in CHIUSURA, spiega con chiarezza (ma senza tono commerciale) che per una lettura del momento presente servirebbe incrociare la carta natale con i transiti attuali, e che senza il pacchetto Transiti del mese non hai accesso a quei dati. Il pacchetto si trova nella sua area personale e si attiva mese per mese; una volta attivo, potrà tornare a chiedere e a quel punto potrai rispondere anche sulla dimensione temporale. Esempio di tono: "Per leggere il momento presente servirebbe incrociare la tua carta natale con i transiti attuali. I transiti del mese sono un pacchetto che trovi nella tua area personale: si attiva mese per mese e, una volta attivo, potrò risponderti anche sulla dimensione del 'quando'." Non usare le parole "acquistare", "promo", "offerta", "compra". Due o tre frasi in chiusura, chiare e dirette. Mai farne il punto della risposta.

CASO C — domanda NON temporalmente carica (struttura, identità, schemi profondi, "chi sono", "come amo", "perché tendo a..."):
Non menzionare i transiti, indipendentemente da hasTransits. Carta natale e report bastano.

Mai più di una menzione dei transiti per risposta. Mai introdurli prima del corpo della risposta. Se la domanda è puramente naturale e già ricca di senso senza, non forzare l'upsell.

COME CHIUDERE LA RISPOSTA:
La chiusura non deve sigillare l'argomento. La persona deve uscire dalla risposta sentendo che c'è ancora un filo da tirare — senza che tu glielo dica esplicitamente.

Tecniche oneste (scegline UNA, e solo quando aggiunge davvero qualcosa, non in ogni risposta):
- Aggancio laterale: cita brevemente UN altro aspetto della carta o del report che si intreccia con questo tema, senza svilupparlo. Esempio: "Questa dinamica si lega anche al tuo Saturno in 7a casa, ma è un'altra storia."
- Domanda implicita: posa una riflessione aperta sul lettore, come fa un buon terapeuta. Esempio: "La domanda che resta sotto è quanto di questo schema sei davvero disposta a sentire, e non solo a riconoscere."
- Riconoscere il filo che continua: un'osservazione sobria che ammette che il tema ha più strati, senza forzare. Esempio: "È un punto da cui si può tirare il filo a lungo, ognuna delle volte arrivando a un livello diverso."

Tecniche VIETATE (suonano commerciali e rovinano il tono):
- Mai "Se hai altre domande, chiedimi pure" o simili
- Mai "C'è molto di più da dire" / "Potrei dirti tanto altro"
- Mai "Vuoi che approfondisca X?" / "Posso dirti di più su Y?"
- Mai cliffhanger artificiali, allusioni misteriose, promesse di rivelazioni
- Mai chiusure che suonano come CTA per altre domande

Frequenza: usa una chiusura "aperta" in circa una risposta su due. Le altre chiudono in modo pieno e completo. Una risposta che si chiude bene da sola vale più di una chiusura aperta forzata. Se non c'è un aggancio laterale autentico nella carta dell'utente, non inventarne uno.

ESEMPI DI STILE (4 esempi, in ordine crescente di lunghezza):
ATTENZIONE: i pianeti, segni, case e aspetti citati negli esempi qui sotto sono inventati per illustrare il tono, la lunghezza e la tecnica di chiusura. NON sono dati astrologici reali. La tua risposta DEVE basarsi esclusivamente sui dati ricevuti nel contesto utente (primaryReport, otherReports, currentTransits, pastTransits, synastryContexts). Non riportare mai le configurazioni degli esempi nelle risposte reali. Rileggi sempre i dati astrologici dell'utente prima di rispondere.

Esempio 0 — domanda semplice/generica, fascia BREVE, 1-2 riferimenti, chiusura piena.
Q: «Sono compatibile con i Pesci?»
A: «La compatibilità per segno solare è il livello più superficiale che l'astrologia offre, e in genere quello che racconta meno. Tra il tuo Sole in Vergine e un Sole in Pesci c'è un'opposizione classica: l'altro sogna e tu organizzi, l'altro sente e tu analizzi. È una polarità che può funzionare benissimo o esaurirsi in fretta, dipende da cosa fanno le rispettive Lune e Veneri. La tua Luna in Capricorno, per esempio, cerca solidità emotiva, e con un Sole in Pesci quell'equilibrio non è scontato. Quello che conta davvero non è l'etichetta del segno, ma cosa cerchi tu in una relazione. La tua carta dice già qualcosa di preciso su come ami: forse è da lì che vale la pena partire.»

Esempio 1 — domanda strutturale, chiusura con domanda implicita.
Q: «Perché tendo a sentirmi sola anche quando sono in una relazione?»
A: «La tua Luna in Scorpione in 8a casa racconta un bisogno emotivo che funziona su una soglia diversa da quella di chi ti sta vicino. Hai un livello di intimità a cui sei sintonizzata da sempre, fatto di emozioni dense, non dette ma sentite, una presenza che chiede l'altro intero, non solo la sua disponibilità.

Quando sei in una relazione, non basta sapere che l'altra persona c'è. Hai bisogno di sentire che è veramente presente, che non si tira indietro nei punti più scomodi. E qui scatta una solitudine che non è oggettiva: la persona magari c'è, ma a un livello che per te resta superficiale. Da fuori sembra una richiesta di "più amore", ma non lo è. È una richiesta di profondità.

La solitudine che senti non è un difetto da correggere. È un termometro fine. Ti dice quando una relazione sta operando alla profondità che ti serve davvero, e quando no. Il problema non è che tu senta troppo. È quando confondi la presenza fisica dell'altro con quello che stai davvero cercando.

La domanda che resta sotto è quanto sei davvero disposta a chiedere quella profondità ad alta voce, invece di aspettare che l'altro la indovini.»

Esempio 2 — domanda temporalmente carica, hasTransits=false, chiusura con upsell soft.
Q: «Sento che sto attraversando una fase di confusione, cosa sta succedendo?»
A: «La carta natale non ti dirà cosa sta succedendo adesso, ma ti dice come sei strutturata per attraversare i momenti di confusione. E questo è un'informazione spesso più utile.

La tua confusione, quando arriva, ha una qualità riconoscibile. Il tuo Mercurio in Pesci tende a tenere insieme troppe possibilità contemporaneamente, e finché ne tieni cinque aperte non ne vedi chiaramente nessuna. Non è un difetto. È un modo di pensare che ha bisogno di tempo prima di restringere il campo. Il problema, di solito, è quando pretendi chiarezza prima che il processo abbia fatto il suo corso: ti sembra di essere bloccata, ma stai solo aspettando un segnale che ancora non è arrivato.

Quello che ti chiede questa fase, probabilmente, è di smettere di forzare la chiarezza e di osservare quale possibilità tra le tante torna più spesso, anche di nascosto. Non quella che pensi di dovere scegliere, ma quella che continua a insistere.

Per leggere davvero il momento presente servirebbe incrociare la tua carta natale con i transiti attuali, e senza quei dati non posso darti la dimensione temporale. Nella tua area personale trovi il pacchetto Transiti del mese, che si attiva mese per mese: una volta attivo, potrò risponderti anche sul "quando".»

Esempio 3 — domanda temporalmente carica, hasTransits=true, chiusura sobria.
Q: «Perché ultimamente sono così agitata sul lavoro?»
A: «C'è una parte strutturale e una contestuale che si stanno sovrapponendo.

La parte strutturale: il tuo Marte in Vergine ha un modo molto preciso di vivere il lavoro. Gli interessa la qualità dell'esecuzione, non la quantità delle cose fatte. Quando ti senti agitata, di solito non è perché hai troppo da fare. È perché stai facendo cose che senti poco curate, fatte in fretta, fatte per qualcun altro. Marte in Vergine si nutre di precisione, e quando deve operare in modalità "butta dentro veloce" si carica di tensione che non sa dove scaricare.

Quello che sta succedendo ora aggiunge un elemento: Saturno sta toccando il tuo Marte natale, e questo è precisamente una pressione professionale. Saturno mette sotto esame il tuo modo di lavorare e ti chiede: questo ritmo che hai costruito è davvero tuo, o lo stai sostenendo perché "va bene così"?

L'agitazione, in questo periodo, ha meno a che fare con il volume di lavoro che con una sotterranea verifica di senso. Una parte di te sta capendo che il modo in cui lavori adesso non è sostenibile per i prossimi anni, e Marte sotto Saturno non lascia ignorare questa percezione.»

Rispondi SEMPRE invocando lo strumento "return_answer" con il campo "answer" che contiene la tua risposta finale (testo in italiano, lunghezza calibrata sulla fascia BREVE/MEDIA/ARTICOLATA/ESTESA definita sopra, mai sotto 110 parole). Non aggiungere altro testo fuori dallo strumento.`;

type ClaimResult =
  | { claimed: true; nextRetry: number; previousStatus: string }
  | { claimed: false; reason: "not_found" | "max_retries_exceeded" | "already_processing" | "not_ready_yet" };

// Claim a row for either generation or release.
// Generation claim: status pending OR stale-processing → processing
// Release claim: status='ready' AND scheduled_for <= now() → processing
// retry_count is incremented only on generation paths (not on release, since
// release is just an email send + status flip and shouldn't burn retry budget).
const claimQuestion = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  questionId: string,
): Promise<ClaimResult> => {
  const staleThresholdISO = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
  const { data: existing } = await supabaseAdmin
    .from("astrology_guide_questions")
    .select("retry_count, status, scheduled_for, updated_at")
    .eq("id", questionId)
    .maybeSingle();
  if (!existing) return { claimed: false, reason: "not_found" };

  const existingRow = existing as {
    retry_count: number | null;
    status: string;
    scheduled_for: string;
    updated_at: string | null;
  };
  const isReady = existingRow.status === "ready";
  const isPending = existingRow.status === "pending";
  const isStaleProcessing =
    existingRow.status === "processing" &&
    new Date(existingRow.updated_at || 0).getTime() < Date.now() - STALE_PROCESSING_MS;

  // Release path: ready row whose time has come.
  if (isReady) {
    if (new Date(existingRow.scheduled_for).getTime() > Date.now()) {
      return { claimed: false, reason: "not_ready_yet" };
    }
    const { data: claimed } = await supabaseAdmin
      .from("astrology_guide_questions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", questionId)
      .eq("status", "ready")
      .select("id")
      .maybeSingle();
    if (!claimed) return { claimed: false, reason: "already_processing" };
    return { claimed: true, nextRetry: existingRow.retry_count || 0, previousStatus: "ready" };
  }

  // Generation path: only available for pending or stale-processing.
  if (!isPending && !isStaleProcessing) {
    return { claimed: false, reason: "already_processing" };
  }

  const nextRetry = (existingRow.retry_count || 0) + 1;
  if (nextRetry > MAX_RETRIES) {
    return { claimed: false, reason: "max_retries_exceeded" };
  }

  const { data: claimed } = await supabaseAdmin
    .from("astrology_guide_questions")
    .update({
      status: "processing",
      retry_count: nextRetry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .or(`status.eq.pending,and(status.eq.processing,updated_at.lt.${staleThresholdISO})`)
    .select("id")
    .maybeSingle();

  if (!claimed) return { claimed: false, reason: "already_processing" };
  return { claimed: true, nextRetry, previousStatus: existingRow.status };
};

// Age in years from a birth_date JSONB column ({year, month, day}). Returns
// null if any field is missing or if the resulting age falls outside a
// plausible band (so an obvious data error never accidentally biases the
// model's tone).
const computeAge = (birthDate: { year?: number; month?: number; day?: number } | null | undefined): number | null => {
  const year = Number(birthDate?.year);
  const month = Number(birthDate?.month);
  const day = Number(birthDate?.day);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();
  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age >= 14 && age <= 100 ? age : null;
};

// Italian-locale date, in Europe/Rome — used as an explicit temporal anchor so
// the model can match the current day against the date_ranges inside
// currentTransits.periods (which are written by the transit interpreter as
// free-text Italian strings like "dal 5 al 12 maggio").
const buildCurrentDateContext = () => {
  const now = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const italian = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return { iso, italian };
};

type OtherReport = {
  userName: string | null;
  userAge: number | null;
  natalChart: unknown;
  fullReport: Record<string, string> | null;
};

type PastTransit = {
  periodStart: string;
  periodEnd: string;
  interpreted: unknown;
};

const buildPrompt = (params: {
  userName: string | null;
  userAge: number | null;
  focusArea: string | null;
  attachmentResponse: string | null;
  natalChart: unknown;
  fullReport: Record<string, string> | null;
  sectionId: string | null;
  history: { question: string; answer: string }[];
  question: string;
  hasTransits: boolean;
  currentTransits: unknown;
  pastTransits: PastTransit[];
  synastryContexts: unknown[];
  otherReports: OtherReport[];
}) => {
  const {
    userName,
    userAge,
    focusArea,
    attachmentResponse,
    natalChart,
    fullReport,
    sectionId,
    history,
    question,
    hasTransits,
    currentTransits,
    pastTransits,
    synastryContexts,
    otherReports,
  } = params;
  const currentDate = buildCurrentDateContext();
  const sectionFocusText = sectionId && fullReport ? fullReport[sectionId] || null : null;

  // Compact remaining sections so the model can cross-reference without us
  // shipping the whole report twice.
  const otherSections = fullReport
    ? Object.fromEntries(Object.entries(fullReport).filter(([id]) => id !== sectionId))
    : {};

  const userContext = {
    primaryReport: {
      userName: userName || null,
      userAge,
      focusArea: focusArea || null,
      attachmentResponse: attachmentResponse || null,
      natalChart: natalChart ?? null,
      sectionFocus: sectionId ? { id: sectionId, text: sectionFocusText } : null,
      otherReportSections: otherSections,
    },
    otherReports,
    currentDate,
    hasTransits,
    currentTransits: hasTransits ? currentTransits : null,
    pastTransits,
    synastryContexts,
  };

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `CONTESTO UTENTE (primaryReport, otherReports, currentTransits, pastTransits, synastryContexts):\n${JSON.stringify(userContext)}`,
    },
  ];

  for (const turn of history) {
    messages.push({ role: "user", content: turn.question });
    messages.push({ role: "assistant", content: turn.answer });
  }

  messages.push({ role: "user", content: question });
  return messages;
};

const callGemini = async (
  messages: { role: string; content: string }[],
  supabaseAdmin: ReturnType<typeof createClient>,
  questionId: string,
  attempt: number,
) => {
  if (!LOVABLE_API_KEY) throw new Error("AI not configured");

  const aiRequestBody = {
    model: MODEL,
    max_tokens: 1200,
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "return_answer",
          description: "Return the final Italian answer. Length adapts to how many distinct configurations the question asks to weave together: 110-160 words for binary/generic questions (one idea), 170-230 for questions about a single theme or single astrological aspect, 240-310 for questions that intertwine two planes (e.g. work + emotions, structure + transits), 320-400 for complex multi-aspect questions (three or more configurations). The technical tone is independent of the band: a technical question on a single aspect stays in MEDIA. Never below 110 words.",
          parameters: {
            type: "object",
            properties: { answer: { type: "string" } },
            required: ["answer"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "return_answer" } },
  };

  const t0 = Date.now();
  const metricBase = {
    functionName: "process-astrology-questions",
    model: MODEL,
    attempt,
  };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(aiRequestBody),
  });

  if (!response.ok) {
    const errText = (await response.text()).slice(0, 240);
    recordAiMetric(supabaseAdmin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: `http_${response.status}`,
    });
    throw new Error(`gemini_http_${response.status}: ${errText}`);
  }

  const completion = await response.json();
  const toolCall = completion.choices?.[0]?.message?.tool_calls?.[0];
  const argsString = toolCall?.function?.arguments ?? "";
  if (!argsString) {
    recordAiMetric(supabaseAdmin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "missing_tool_call",
      usage: completion?.usage,
    });
    throw new Error("gemini_missing_tool_call");
  }

  let parsed: { answer?: unknown };
  try {
    parsed = JSON.parse(String(argsString));
  } catch (e) {
    recordAiMetric(supabaseAdmin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "json_parse_error",
      usage: completion?.usage,
    });
    throw new Error(`gemini_json_parse: ${e}`);
  }

  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
  if (!answer) {
    recordAiMetric(supabaseAdmin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "empty_answer",
      usage: completion?.usage,
    });
    throw new Error("gemini_empty_answer");
  }

  recordAiMetric(supabaseAdmin, {
    ...metricBase,
    durationMs: Date.now() - t0,
    success: true,
    httpStatus: response.status,
    usage: completion?.usage,
  });

  return answer;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let questionId = "";

  try {
    const body = await req.json().catch(() => ({}));
    questionId = typeof body.questionId === "string" ? body.questionId : "";
    if (!questionId) throw new Error("questionId is required");

    // Privileged-only: admin secret OR service-role JWT.
    const isAdmin = Boolean(ADMIN_SECRET && req.headers.get("x-admin-secret") === ADMIN_SECRET);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const claims = parseJwtClaims(token);
    const isServiceRole = claims?.role === "service_role";
    if (!isAdmin && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic claim. May claim for generation (pending → processing) or
    // release (ready → processing).
    const claim = await claimQuestion(supabaseAdmin, questionId);
    if (!claim.claimed) {
      // Out of retries — give up gracefully: mark failed, refund credit, notify.
      if (claim.reason === "max_retries_exceeded") {
        const { data: q } = await supabaseAdmin
          .from("astrology_guide_questions")
          .select("profile_id, quiz_session_id, question, status")
          .eq("id", questionId)
          .maybeSingle();
        if (q && q.status !== "completed") {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({
              status: "failed",
              error: "max_retries_exceeded",
            })
            .eq("id", questionId);
          await supabaseAdmin.rpc("restore_astrology_credit", {
            p_profile_id: q.profile_id,
            p_quiz_session_id: q.quiz_session_id,
          });
        }
      }
      return new Response(JSON.stringify({ skipped: claim.reason }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isReleasePhase = claim.previousStatus === "ready";

    // Load question + joined session + profile email + scheduled_for.
    const { data: row, error: loadErr } = await supabaseAdmin
      .from("astrology_guide_questions")
      .select(
        "id, profile_id, quiz_session_id, section_id, question, answer, scheduled_for, retry_count, " +
          "quiz_sessions(natal_chart, full_report, user_name, focus_area, attachment_response, birth_date), " +
          "profiles(email)",
      )
      .eq("id", questionId)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!row) throw new Error("question_not_found_after_claim");

    type LoadedRow = {
      id: string;
      profile_id: string;
      quiz_session_id: string;
      section_id: string | null;
      question: string;
      answer: string | null;
      scheduled_for: string;
      retry_count: number;
      quiz_sessions: {
        natal_chart: unknown;
        full_report: Record<string, string> | null;
        user_name: string | null;
        focus_area: string | null;
        attachment_response: string | null;
        birth_date: { year?: number; month?: number; day?: number } | null;
      } | null;
      profiles: { email: string | null } | null;
    };
    const typedRow = row as unknown as LoadedRow;
    const quizSession = typedRow.quiz_sessions || {
      natal_chart: null,
      full_report: null,
      user_name: null,
      focus_area: null,
      attachment_response: null,
      birth_date: null,
    };
    const profile = typedRow.profiles || { email: null };

    // ────────────────────────────────────────────────────────────────────
    // PHASE A — GENERATION (skipped on release-phase claims).
    // ────────────────────────────────────────────────────────────────────
    let answer = typedRow.answer;
    if (!isReleasePhase && !answer) {
      // Last N Q&A from the same session, oldest-first. We include both
      // 'completed' (already released to the user) and 'ready' (generated
      // but waiting for scheduled_for) because by the time THIS answer is
      // released, any 'ready' siblings will have been released first
      // (scheduled_for ordering), so referring to them is temporally
      // consistent from the user's perspective.
      const { data: historyRows } = await supabaseAdmin
        .from("astrology_guide_questions")
        .select("question, answer, created_at")
        .eq("quiz_session_id", row.quiz_session_id)
        .in("status", ["ready", "completed"])
        .not("answer", "is", null)
        .neq("id", questionId)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

      const history = ((historyRows || []) as Array<{ question: string; answer: string }>)
        .reverse()
        .map((h) => ({ question: h.question, answer: h.answer }));

      // Pull the user's last 3 monthly transit cycles (current + up to 2
      // previous). The model uses past cycles ONLY for retrospective
      // questions; for "what's happening now" it uses the current one.
      // Transits are always anchored to the primary report's natal chart —
      // we don't have transits for otherReports.
      const todayDate = new Date().toISOString().slice(0, 10);
      const { data: recentCycles } = await supabaseAdmin
        .from("transit_cycles")
        .select("interpreted_transits, period_start, period_end")
        .eq("quiz_session_id", row.quiz_session_id)
        .eq("status", "completed")
        .lte("period_start", todayDate)
        .not("interpreted_transits", "is", null)
        .order("period_start", { ascending: false })
        .limit(3);

      const cycles =
        (recentCycles as Array<{
          interpreted_transits: unknown;
          period_start: string;
          period_end: string;
        }> | null) || [];
      const currentCycle = cycles.find((c) => c.period_start <= todayDate && c.period_end >= todayDate) || null;
      const currentTransits = currentCycle?.interpreted_transits ?? null;
      const hasTransits = Boolean(currentTransits);
      const pastTransits = cycles
        .filter((c) => c !== currentCycle)
        .map((c) => ({
          periodStart: c.period_start,
          periodEnd: c.period_end,
          interpreted: c.interpreted_transits,
        }));

      // Pull ALL the user's completed synastry reports (one per partner).
      // Path: checkout_sessions.claimed_profile_id → synastry_sessions.
      // We dedupe by synastry_session_id in case the same synastry is linked
      // through multiple checkout rows.
      const synastryContexts: unknown[] = [];
      const seenSynastryIds = new Set<string>();
      const { data: synastryRows } = await supabaseAdmin
        .from("checkout_sessions")
        .select(
          "synastry_session_id, " +
          "synastry_sessions(person_a_name, person_b_name, archetype, archetype_label, " +
          "score_overall, scores, relationship_duration, focus_relational, full_report)"
        )
        .eq("claimed_profile_id", row.profile_id)
        .not("synastry_session_id", "is", null)
        .order("created_at", { ascending: false });

      for (const sr of (synastryRows || []) as Array<{
        synastry_session_id: string | null;
        synastry_sessions: {
          person_a_name: string | null;
          person_b_name: string | null;
          archetype: string | null;
          archetype_label: string | null;
          score_overall: number | null;
          scores: unknown;
          relationship_duration: string | null;
          focus_relational: string | null;
          full_report: unknown;
        } | null;
      }>) {
        const sid = sr.synastry_session_id;
        if (!sid || seenSynastryIds.has(sid)) continue;
        const ss = sr.synastry_sessions;
        if (!ss?.full_report) continue;
        seenSynastryIds.add(sid);
        synastryContexts.push({
          personAName: ss.person_a_name,
          personBName: ss.person_b_name,
          archetype: ss.archetype,
          archetypeLabel: ss.archetype_label,
          scoreOverall: ss.score_overall,
          scores: ss.scores,
          relationshipDuration: ss.relationship_duration,
          focusRelational: ss.focus_relational,
          fullReport: ss.full_report,
        });
      }
      // Order matters: the system prompt says "use the last array element
      // when the question doesn't disambiguate" (= most recent), and the
      // checkout_sessions query above is sorted desc, so we reverse to get
      // oldest-first / most-recent-last.
      synastryContexts.reverse();

      // Pull ALL OTHER natal reports linked to the profile (excluding the
      // session of the current question). This lets the guide answer
      // questions about a different person whose chart is also on the
      // profile (partner, child, friend). The lookup goes through
      // user_reports, which is the join table profile→quiz_session.
      const otherReports: OtherReport[] = [];
      const { data: otherReportRows } = await supabaseAdmin
        .from("user_reports")
        .select("quiz_session_id, quiz_sessions(natal_chart, full_report, user_name, birth_date)")
        .eq("profile_id", row.profile_id)
        .neq("quiz_session_id", row.quiz_session_id);

      for (const orRow of (otherReportRows || []) as Array<{
        quiz_session_id: string;
        quiz_sessions: {
          natal_chart: unknown;
          full_report: Record<string, string> | null;
          user_name: string | null;
          birth_date: { year?: number; month?: number; day?: number } | null;
        } | null;
      }>) {
        const qs = orRow.quiz_sessions;
        if (!qs?.full_report) continue;
        otherReports.push({
          userName: qs.user_name || null,
          userAge: computeAge(qs.birth_date),
          natalChart: qs.natal_chart ?? null,
          fullReport: qs.full_report,
        });
      }

      const messages = buildPrompt({
        userName: quizSession.user_name || null,
        userAge: computeAge(quizSession.birth_date),
        focusArea: quizSession.focus_area || null,
        attachmentResponse: quizSession.attachment_response || null,
        natalChart: quizSession.natal_chart ?? null,
        fullReport: (quizSession.full_report as Record<string, string>) || null,
        sectionId: row.section_id || null,
        history,
        question: row.question,
        hasTransits,
        currentTransits,
        pastTransits,
        synastryContexts,
        otherReports,
      });

      answer = await callGemini(messages, supabaseAdmin, questionId, claim.nextRetry);

      // Persist the generated answer. The row is invisible to the user (status
      // is still 'processing' here, becomes 'ready' or 'completed' below).
      await supabaseAdmin
        .from("astrology_guide_questions")
        .update({
          answer,
          model_used: MODEL,
          error: null,
        })
        .eq("id", questionId);
    }

    if (!answer) throw new Error("answer_missing_after_generation");

    // ────────────────────────────────────────────────────────────────────
    // Branch: should we release now, or hold until scheduled_for?
    // ────────────────────────────────────────────────────────────────────
    const releaseDue = new Date(typedRow.scheduled_for).getTime() <= Date.now();

    if (!releaseDue) {
      // Generation done, but the human-friendly delivery time hasn't arrived.
      // Park the row as 'ready'. Cron picks it up at scheduled_for.
      await supabaseAdmin
        .from("astrology_guide_questions")
        .update({
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionId);
      return new Response(JSON.stringify({ stored: true, status: "ready", questionId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ────────────────────────────────────────────────────────────────────
    // PHASE B — RELEASE: scheduled_for has arrived. Send email + flip to
    // 'completed' so the realtime push reveals the answer in the panel.
    // ────────────────────────────────────────────────────────────────────
    await supabaseAdmin
      .from("astrology_guide_questions")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", questionId);

    // Read the (now-updated) credit balance for the email.
    const { data: creditsRow } = await supabaseAdmin
      .from("astrology_guide_credits")
      .select("balance")
      .eq("profile_id", row.profile_id)
      .eq("quiz_session_id", row.quiz_session_id)
      .maybeSingle();

    if (profile?.email) {
      sendTransactionalEmailBackground({
        templateName: "astrology-guide-answer",
        recipientEmail: profile.email,
        idempotencyKey: `astrology-guide-answer-${questionId}`,
        templateData: {
          name: quizSession.user_name || "",
          question: row.question,
          answer,
          sectionLabel: row.section_id || "",
          creditsRemaining: creditsRow?.balance ?? 0,
          questionId,
        },
      });
      await supabaseAdmin
        .from("astrology_guide_questions")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", questionId);
    }

    // Bump GUIDA_STATUS on Brevo. The helper recomputes from DB, so it
    // resolves to "free_used" (or higher if the user has already purchased
    // a pack). Idempotent and fire-and-forget.
    syncAstrologyGuideStatusBackground(row.profile_id, profile?.email);

    return new Response(JSON.stringify({ completed: true, questionId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[process-astrology-questions] error:", message);
    if (questionId) {
      // Determine whether the failure was during generation or after. If the
      // row already has an answer, generation succeeded — only the release
      // (or the post-generation status update) failed. In that case reset
      // to 'ready' so the cron retries delivery, without burning retry
      // budget or refunding credits.
      const { data: row } = await supabaseAdmin
        .from("astrology_guide_questions")
        .select("retry_count, answer, profile_id, quiz_session_id")
        .eq("id", questionId)
        .maybeSingle();
      if (row) {
        if (row.answer) {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({ status: "ready", error: message.slice(0, 500) })
            .eq("id", questionId);
        } else if ((row.retry_count || 0) >= MAX_RETRIES) {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({ status: "failed", error: message.slice(0, 500) })
            .eq("id", questionId);
          await supabaseAdmin.rpc("restore_astrology_credit", {
            p_profile_id: row.profile_id,
            p_quiz_session_id: row.quiz_session_id,
          });
        } else {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({ status: "pending", error: message.slice(0, 500) })
            .eq("id", questionId);
        }
      }
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
