import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Privacy Policy e Cookie Policy — Codice Interiore"
        description="Informativa sul trattamento dei dati personali degli utenti del sito Codice Interiore."
        path="/privacy"
      />
      <Header
        backButton={
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <main className="container max-w-3xl py-10 flex-1">
        <article className="prose prose-neutral max-w-none">
          <header className="mb-10 border-b border-border pb-6">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-3">
              Privacy Policy e Cookie Policy
            </h1>
            <p className="text-sm text-muted-foreground">Ultimo aggiornamento: 24 aprile 2026</p>
          </header>

          <p className="text-base leading-relaxed text-foreground/90 mb-10">
            La presente informativa descrive le modalità con cui vengono trattati i dati personali degli utenti che
            visitano il sito{" "}
            <a href="https://www.codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
              www.codiceinteriore.it
            </a>{" "}
            e utilizzano i servizi collegati al brand Codice Interiore.
          </p>

          <Section title="1. Titolare del trattamento">
            <p>Il Titolare del trattamento è:</p>
            <div className="my-4 p-4 rounded-md bg-muted/50 border border-border text-sm leading-relaxed">
              <p className="font-medium">ECOLIFE COMMERCE LTD.</p>
              <p>71-75, Shelton Street, Covent Garden, Londra, Regno Unito</p>
              <p>Numero di registrazione: 16364511</p>
            </div>
            <p>
              Per qualsiasi richiesta relativa al trattamento dei dati personali è possibile scrivere a:{" "}
              <a href="mailto:privacy@codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
                privacy@codiceinteriore.it
              </a>
            </p>
          </Section>

          <Section title="2. Ambito di applicazione">
            <p>Questa informativa si applica al trattamento dei dati personali effettuato tramite:</p>
            <ul>
              <li>il sito www.codiceinteriore.it</li>
              <li>il quiz e le pagine di raccolta dati</li>
              <li>il checkout e le pagine di acquisto</li>
              <li>eventuali moduli di contatto</li>
              <li>l'invio di email operative, contenuti settimanali e comunicazioni marketing</li>
              <li>l'eventuale area utente collegata al servizio</li>
            </ul>
          </Section>

          <Section title="3. Tipologie di dati trattati">
            <p>Possiamo trattare le seguenti categorie di dati personali:</p>

            <SubSection title="a) Dati identificativi e di contatto">
              <ul>
                <li>nome</li>
                <li>indirizzo email</li>
              </ul>
            </SubSection>

            <SubSection title="b) Dati forniti per l'erogazione del servizio">
              <ul>
                <li>data di nascita</li>
                <li>ora di nascita</li>
                <li>luogo di nascita</li>
                <li>risposte fornite nel quiz</li>
                <li>eventuali contenuti trasmessi tramite richieste di assistenza o moduli di contatto</li>
              </ul>
            </SubSection>

            <SubSection title="c) Dati relativi agli acquisti">
              <ul>
                <li>cronologia degli acquisti</li>
                <li>informazioni sullo stato del pagamento</li>
                <li>identificativi transazione forniti dai prestatori di pagamento</li>
              </ul>
              <p className="text-sm text-muted-foreground italic mt-2">
                Nota: i dati completi della carta di pagamento non vengono trattati direttamente dal Titolare, ma dai
                fornitori di pagamento utilizzati.
              </p>
            </SubSection>

            <SubSection title="d) Dati tecnici e di navigazione">
              <ul>
                <li>indirizzo IP</li>
                <li>log tecnici</li>
                <li>informazioni su browser, dispositivo e sistema operativo</li>
                <li>dati raccolti tramite cookie o tecnologie similari</li>
              </ul>
            </SubSection>

            <SubSection title="e) Dati relativi a marketing e tracciamento">
              <ul>
                <li>dati raccolti tramite strumenti analytics</li>
                <li>dati raccolti tramite cookie e pixel marketing, inclusi strumenti di remarketing</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="4. Finalità del trattamento">
            <p>I dati personali possono essere trattati per le seguenti finalità:</p>
            <ul>
              <li>erogazione del report astrologico personalizzato</li>
              <li>erogazione di contenuti settimanali, servizi ricorrenti o abbonamenti</li>
              <li>gestione dell'account utente, ove disponibile</li>
              <li>gestione del checkout, dei pagamenti e della cronologia ordini</li>
              <li>
                invio di comunicazioni operative, ad esempio conferme d'ordine, accesso ai contenuti, assistenza e
                notifiche di servizio
              </li>
              <li>gestione delle richieste inviate tramite email o form di contatto</li>
              <li>invio di newsletter e comunicazioni promozionali</li>
              <li>analisi statistiche sull'uso del sito</li>
              <li>remarketing, retargeting e misurazione delle campagne pubblicitarie</li>
              <li>tutela della sicurezza del sito, prevenzione di abusi e gestione tecnica dei sistemi</li>
            </ul>
          </Section>

          <Section title="5. Base giuridica del trattamento">
            <p>Il trattamento dei dati personali avviene, a seconda dei casi, sulle seguenti basi giuridiche:</p>
            <ul>
              <li>
                <strong>esecuzione di un contratto</strong> o di misure precontrattuali: per l'erogazione del report, la
                gestione del quiz in quanto funzionale al servizio richiesto, la gestione dell'account, gli acquisti, i
                pagamenti, l'invio di email operative e l'assistenza
              </li>
              <li>
                <strong>consenso dell'interessato</strong>: per l'invio di newsletter e comunicazioni marketing, nonché
                per l'uso di cookie e strumenti di tracciamento non tecnici ove richiesto dalla normativa applicabile
              </li>
              <li>
                <strong>interesse legittimo del Titolare</strong>: per esigenze di sicurezza informatica, difesa dei
                propri diritti, prevenzione di frodi, gestione tecnica del sito e analisi aggregate del funzionamento
                dei servizi, nei limiti consentiti dalla legge
              </li>
            </ul>
          </Section>

          <Section title="6. Natura del conferimento">
            <p>Il conferimento dei dati contrassegnati come necessari è obbligatorio quando tali dati servono per:</p>
            <ul>
              <li>generare il report richiesto</li>
              <li>gestire un acquisto</li>
              <li>creare o amministrare l'account</li>
              <li>fornire assistenza</li>
              <li>inviare comunicazioni operative</li>
            </ul>
            <p>Il mancato conferimento di tali dati può rendere impossibile l'erogazione del servizio.</p>
            <p>
              Il conferimento dei dati per finalità marketing o per cookie non necessari è invece facoltativo.
              L'eventuale rifiuto non impedisce la navigazione del sito o l'acquisto del servizio base, salvo i limiti
              tecnici strettamente necessari.
            </p>
          </Section>

          <Section title="7. Modalità del trattamento">
            <p>
              Il trattamento avviene con strumenti digitali e organizzativi adeguati alla natura dei dati, secondo
              principi di liceità, correttezza, trasparenza, minimizzazione e limitazione della conservazione.
            </p>
          </Section>

          <Section title="8. Destinatari dei dati">
            <p>
              I dati possono essere comunicati o resi accessibili a soggetti che operano, a seconda dei casi, come
              responsabili del trattamento, autonomi titolari o persone autorizzate.
            </p>
            <p>In particolare, i dati possono essere trattati tramite i seguenti fornitori o categorie di fornitori:</p>
            <ul>
              <li>fornitori di hosting e infrastruttura/frontend</li>
              <li>Supabase per database e infrastruttura applicativa</li>
              <li>Stripe e PayPal per la gestione dei pagamenti</li>
              <li>Google per servizi tecnologici e, ove applicabile, elaborazione tramite modelli AI esterni</li>
              <li>FreeAstroAPI per l'elaborazione dei dati astrologici necessari al servizio</li>
              <li>Meta per strumenti pubblicitari, pixel e remarketing</li>
              <li>Google Analytics per analisi statistiche del traffico sul sito</li>
              <li>eventuali fornitori di email delivery, supporto tecnico e gestione operativa collegati ai servizi</li>
            </ul>
            <p>I dati sono trattati da tali soggetti nei limiti necessari a fornire i rispettivi servizi.</p>
          </Section>

          <Section title="9. Trattamento tramite fornitori AI e servizi esterni">
            <p>
              Per erogare alcune funzioni del servizio, i dati inseriti nel quiz e le informazioni necessarie alla
              generazione dei contenuti possono essere inviati a fornitori tecnologici esterni, inclusi servizi AI di
              Google e servizi astrologici esterni.
            </p>
            <p>
              Il Titolare adotta un criterio di minimizzazione: vengono trasmessi ai fornitori esterni solo i dati
              necessari a generare il contenuto richiesto o a eseguire la funzione tecnica prevista.
            </p>
          </Section>

          <Section title="10. Trasferimento di dati verso Paesi extra SEE">
            <p>
              Il Titolare ha sede negli Emirati Arabi Uniti e alcuni fornitori tecnologici utilizzati possono trovarsi o
              trattare dati in Paesi al di fuori dello Spazio Economico Europeo, inclusi gli Stati Uniti o altri Paesi
              terzi.
            </p>
            <p>
              Quando applicabile, tali trasferimenti avvengono nel rispetto degli strumenti previsti dalla normativa
              vigente, inclusi eventuali meccanismi contrattuali o altre garanzie richieste dalla legge.
            </p>
            <p>
              Per ulteriori informazioni sui trasferimenti eventualmente effettuati e sulle relative garanzie, l'utente
              può scrivere a{" "}
              <a href="mailto:privacy@codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
                privacy@codiceinteriore.it
              </a>
              .
            </p>
          </Section>

          <Section title="11. Periodo di conservazione dei dati">
            <p>
              Salvo obblighi di legge diversi, i dati personali vengono conservati per un periodo non superiore a quello
              necessario alle finalità per cui sono stati raccolti.
            </p>
            <p>In via generale:</p>
            <ul>
              <li>
                i dati relativi a richieste di contatto possono essere conservati per il tempo necessario a gestire la
                richiesta e per un periodo amministrativo successivo ragionevole
              </li>
              <li>
                i dati relativi agli acquisti e al rapporto contrattuale possono essere conservati per la durata del
                rapporto e successivamente per il tempo necessario ad adempiere obblighi fiscali, amministrativi o
                difensivi
              </li>
              <li>
                i dati utilizzati per comunicazioni marketing vengono conservati fino a revoca del consenso o
                opposizione dell'interessato
              </li>
              <li>
                i dati tecnici e di log vengono conservati per il periodo strettamente necessario a garantire il
                funzionamento, la sicurezza e l'analisi dei sistemi
              </li>
              <li>
                i dati collegati ad analytics e cookie dipendono dalle impostazioni del relativo strumento e dalle
                preferenze espresse dall'utente
              </li>
            </ul>
          </Section>

          <Section title="12. Cookie Policy">
            <p>
              Il presente sito utilizza cookie e tecnologie simili per garantire il corretto funzionamento delle pagine,
              analizzare il traffico, migliorare l'esperienza utente e, previo consenso quando necessario, misurare le
              campagne pubblicitarie e svolgere attività di remarketing.
            </p>

            <SubSection title="12.1 Cosa sono i cookie">
              <p>
                I cookie sono piccoli file di testo che i siti web inviano al dispositivo dell'utente durante la
                navigazione. Possono essere memorizzati e poi ritrasmessi agli stessi siti alla visita successiva.
              </p>
              <p>
                Tecnologie simili, come pixel, tag, script o identificatori, possono svolgere funzioni analoghe di
                raccolta o trasmissione di informazioni.
              </p>
            </SubSection>

            <SubSection title="12.2 Tipologie di cookie utilizzate">
              <p>Il sito può utilizzare le seguenti categorie di cookie:</p>

              <h4 className="font-serif text-lg font-medium mt-5 mb-2">a) Cookie tecnici o strettamente necessari</h4>
              <p>
                Servono a permettere il funzionamento del sito e l'erogazione delle funzioni essenziali, ad esempio:
              </p>
              <ul>
                <li>navigazione tra le pagine</li>
                <li>gestione della sessione</li>
                <li>sicurezza del sito</li>
                <li>memorizzazione delle preferenze tecniche</li>
                <li>corretto funzionamento del checkout o di componenti essenziali</li>
              </ul>
              <p>Questi cookie non richiedono normalmente il consenso dell'utente.</p>

              <h4 className="font-serif text-lg font-medium mt-5 mb-2">b) Cookie analytics</h4>
              <p>Servono a raccogliere informazioni statistiche sull'uso del sito, ad esempio:</p>
              <ul>
                <li>numero di visitatori</li>
                <li>pagine visitate</li>
                <li>provenienza del traffico</li>
                <li>comportamento di navigazione</li>
                <li>performance delle pagine</li>
              </ul>
              <p>
                Il sito può utilizzare strumenti analytics come Google Analytics. Quando tali strumenti non sono
                configurati in modo strettamente aggregato o anonimizzato secondo gli standard richiesti dalla normativa
                applicabile, il loro utilizzo può richiedere il consenso dell'utente.
              </p>

              <h4 className="font-serif text-lg font-medium mt-5 mb-2">
                c) Cookie di marketing, profilazione e remarketing
              </h4>
              <p>Servono a:</p>
              <ul>
                <li>misurare l'efficacia delle campagne pubblicitarie</li>
                <li>creare pubblici personalizzati</li>
                <li>mostrare annunci coerenti con il comportamento di navigazione</li>
                <li>effettuare remarketing e retargeting</li>
              </ul>
              <p>
                Questa categoria può includere strumenti come Meta Pixel e altri script o tag pubblicitari. Tali cookie
                non sono necessari al funzionamento del sito e vengono utilizzati solo sulla base del consenso, quando
                richiesto dalla normativa applicabile.
              </p>
            </SubSection>

            <SubSection title="12.3 Cookie di prima parte e di terza parte">
              <p>Il sito può utilizzare:</p>
              <ul>
                <li>cookie di prima parte, installati direttamente dal sito</li>
                <li>
                  cookie di terza parte, installati tramite servizi forniti da soggetti esterni come Google, Meta,
                  Stripe, PayPal o altri fornitori tecnici
                </li>
              </ul>
              <p>
                Le informazioni raccolte da cookie di terza parte sono disciplinate anche dalle informative dei
                rispettivi fornitori.
              </p>
            </SubSection>

            <SubSection title="12.4 Base giuridica per l'uso dei cookie">
              <p>L'uso dei cookie tecnici si basa sulla necessità di fornire il sito e i servizi richiesti.</p>
              <p>
                L'uso di cookie analytics non strettamente tecnici, cookie di marketing, pixel, tag o altri strumenti di
                tracciamento si basa sul consenso dell'utente, ove richiesto dalla normativa applicabile.
              </p>
            </SubSection>

            <SubSection title="12.5 Gestione del consenso">
              <p>Quando richiesto, al primo accesso al sito l'utente può:</p>
              <ul>
                <li>accettare tutti i cookie non necessari</li>
                <li>rifiutare i cookie non necessari</li>
                <li>selezionare le proprie preferenze</li>
              </ul>
              <p>
                L'utente può in ogni momento modificare o revocare le proprie preferenze tramite gli strumenti messi a
                disposizione sul sito, se presenti, oppure tramite le impostazioni del browser, fermo restando che il
                blocco di alcuni cookie può incidere sul funzionamento di alcune funzioni non essenziali.
              </p>
            </SubSection>

            <SubSection title="12.6 Disattivazione tramite browser">
              <p>
                L'utente può gestire o disabilitare i cookie anche attraverso le impostazioni del proprio browser. La
                disattivazione dei cookie tecnici potrebbe tuttavia compromettere il corretto funzionamento del sito o
                di alcune sue parti.
              </p>
            </SubSection>

            <SubSection title="12.7 Conservazione dei cookie">
              <p>La durata dei cookie può variare:</p>
              <ul>
                <li>alcuni vengono cancellati automaticamente alla chiusura del browser</li>
                <li>
                  altri restano memorizzati per un periodo più lungo, definito dal singolo fornitore o dalla
                  configurazione tecnica del sito
                </li>
              </ul>
              <p>
                La durata effettiva può dipendere anche dalle politiche del browser, dalle preferenze dell'utente e dai
                fornitori terzi utilizzati.
              </p>
            </SubSection>
          </Section>

          <Section title="13. Diritti dell'interessato">
            <p>Nei casi previsti dalla normativa applicabile, l'interessato può esercitare i diritti di:</p>
            <ul>
              <li>accesso ai dati personali</li>
              <li>rettifica dei dati inesatti</li>
              <li>cancellazione dei dati</li>
              <li>limitazione del trattamento</li>
              <li>opposizione al trattamento, nei casi previsti</li>
              <li>portabilità dei dati, ove applicabile</li>
              <li>
                revoca del consenso in qualsiasi momento, senza pregiudicare la liceità del trattamento basata sul
                consenso prestato prima della revoca
              </li>
              <li>proporre reclamo all'autorità di controllo competente</li>
            </ul>
            <p>
              Per esercitare i propri diritti, l'utente può scrivere a:{" "}
              <a href="mailto:privacy@codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
                privacy@codiceinteriore.it
              </a>
            </p>
          </Section>

          <Section title="14. Minori">
            <p>
              Il servizio non è destinato a soggetti minori di età. Il Titolare invita a non utilizzare il sito e a non
              trasmettere dati personali se non si è maggiorenni o comunque se non si ha la capacità di prestare
              validamente il consenso secondo la normativa applicabile.
            </p>
          </Section>

          <Section title="15. Modifiche alla presente informativa">
            <p>
              Il Titolare si riserva il diritto di aggiornare o modificare la presente informativa in qualunque momento.
              La versione aggiornata sarà pubblicata su questa pagina con indicazione della data di ultimo
              aggiornamento.
            </p>
          </Section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-foreground">{title}</h2>
    <div className="space-y-3 text-foreground/85 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_a]:text-primary">
      {children}
    </div>
  </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <h3 className="font-serif text-xl font-medium mb-2 text-foreground">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

export default PrivacyPolicy;
