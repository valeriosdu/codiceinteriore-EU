import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Termini e Condizioni — Codice Interiore"
        description="Termini e Condizioni d'uso del sito Codice Interiore e dei servizi digitali offerti."
        path="/termini"
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
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-3">Termini e Condizioni</h1>
            <p className="text-sm text-muted-foreground">Ultimo aggiornamento: 24 aprile 2026</p>
          </header>

          <p className="text-base leading-relaxed text-foreground/90 mb-4">
            I presenti Termini e Condizioni disciplinano l'accesso e l'utilizzo del sito{" "}
            <a href="https://www.codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
              www.codiceinteriore.it
            </a>{" "}
            e l'acquisto dei servizi digitali offerti tramite il brand Codice Interiore.
          </p>
          <p className="text-base leading-relaxed text-foreground/90 mb-10">
            Accedendo al sito o acquistando uno o più servizi, l'utente dichiara di aver letto, compreso e accettato i
            presenti Termini e Condizioni.
          </p>

          <Section title="1. Titolare del servizio">
            <p>Il servizio è offerto da:</p>
            <div className="my-4 p-4 rounded-md bg-muted/50 border border-border text-sm leading-relaxed">
              <p className="font-medium">ECOLIFE COMMERCE LTD.</p>
              <p>71-75, Shelton Street, Covent Garden, Londra, Regno Unito</p>
              <p>Numero di registrazione: 16364511</p>
            </div>
            <p>
              Brand commerciale utilizzato sul sito: <strong>Codice Interiore</strong>
            </p>
            <p>
              Contatto:{" "}
              <a href="mailto:info@codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
                info@codiceinteriore.it
              </a>
            </p>
          </Section>

          <Section title="2. Oggetto del servizio">
            <p>
              Codice Interiore offre servizi digitali a pagamento basati su elaborazioni personalizzate, contenuti
              astrologici interpretativi e funzionalità accessorie connesse.
            </p>
            <p>I servizi possono includere, a seconda dell'offerta acquistata:</p>
            <ul>
              <li>report astrologici personalizzati</li>
              <li>contenuti settimanali o periodici</li>
              <li>accesso a un'area utente</li>
              <li>eventuali contenuti bonus</li>
              <li>eventuali funzionalità digitali aggiuntive collegate al servizio acquistato</li>
            </ul>
            <p>
              Salvo diversa indicazione, i servizi sono forniti esclusivamente in formato digitale e non prevedono la
              consegna di beni materiali.
            </p>
          </Section>

          <Section title="3. Natura del servizio">
            <p>
              Il servizio fornito da Codice Interiore ha finalità informative, introspettive e di intrattenimento
              evoluto.
            </p>
            <p>Il contenuto fornito:</p>
            <ul>
              <li>non costituisce consulenza psicologica, psichiatrica o medica</li>
              <li>non costituisce consulenza legale, fiscale o finanziaria</li>
              <li>non garantisce risultati personali, relazionali, professionali o economici</li>
              <li>non sostituisce il giudizio personale dell'utente né il supporto di professionisti qualificati</li>
            </ul>
            <p>L'utente resta l'unico responsabile dell'uso che decide di fare dei contenuti ricevuti.</p>
          </Section>

          <Section title="4. Requisiti dell'utente">
            <p>Per utilizzare il sito o acquistare i servizi, l'utente dichiara:</p>
            <ul>
              <li>di essere maggiorenne o comunque legalmente capace di concludere un contratto vincolante</li>
              <li>di fornire dati veritieri, accurati e completi</li>
              <li>di utilizzare il sito in modo lecito e conforme ai presenti Termini</li>
            </ul>
            <p>Il servizio non è destinato a minori.</p>
          </Section>

          <Section title="5. Dati forniti dall'utente">
            <p>
              Per l'erogazione del servizio, l'utente può essere tenuto a fornire dati personali e informazioni
              necessarie alla personalizzazione del contenuto, inclusi, a titolo esemplificativo:
            </p>
            <ul>
              <li>nome</li>
              <li>email</li>
              <li>data di nascita</li>
              <li>ora di nascita</li>
              <li>luogo di nascita</li>
              <li>risposte al quiz o ad altri moduli</li>
            </ul>
            <p>L'utente è responsabile dell'esattezza dei dati inseriti.</p>
            <p>
              Codice Interiore non risponde di errori, ritardi, contenuti inesatti o risultati non coerenti derivanti da
              dati incompleti, errati o non aggiornati forniti dall'utente.
            </p>
          </Section>

          <Section title="6. Modalità di acquisto">
            <p>L'acquisto avviene tramite il sito, secondo il flusso di checkout disponibile al momento dell'ordine.</p>
            <p>Prima della conclusione dell'acquisto, l'utente può visualizzare almeno:</p>
            <ul>
              <li>le caratteristiche principali del servizio acquistato</li>
              <li>il prezzo totale</li>
              <li>eventuali elementi inclusi nell'offerta</li>
              <li>le modalità di pagamento</li>
              <li>le informazioni essenziali su recesso e consegna digitale, ove applicabili</li>
            </ul>
            <p>
              Il contratto si considera concluso quando il pagamento è stato correttamente autorizzato e l'ordine è
              stato confermato dal sistema o dal Titolare.
            </p>
          </Section>

          <Section title="7. Prezzi e pagamenti">
            <p>Tutti i prezzi pubblicati sul sito sono espressi nella valuta indicata nella pagina di acquisto.</p>
            <p>I pagamenti possono essere gestiti tramite fornitori terzi, inclusi:</p>
            <ul>
              <li>Stripe</li>
              <li>PayPal</li>
            </ul>
            <p>
              Codice Interiore non tratta direttamente i dati completi della carta di pagamento. Tali dati sono trattati
              dai fornitori di pagamento secondo le rispettive condizioni e informative privacy.
            </p>
            <p>
              Il Titolare si riserva il diritto di modificare prezzi, offerte, bundle o condizioni commerciali in
              qualsiasi momento. Le modifiche non si applicano agli ordini già conclusi.
            </p>
          </Section>

          <Section title="8. Consegna dei contenuti digitali">
            <p>I servizi acquistati vengono forniti in formato digitale, tramite una o più delle seguenti modalità:</p>
            <ul>
              <li>visualizzazione on-page</li>
              <li>invio tramite email</li>
              <li>accesso tramite area utente</li>
              <li>attivazione di contenuti periodici collegati al profilo dell'utente</li>
            </ul>
            <p>
              I tempi di erogazione possono variare in base alla natura del servizio, al carico tecnico, alla
              correttezza dei dati forniti e all'eventuale necessità di elaborazioni automatizzate o integrazioni con
              servizi terzi.
            </p>
            <p>
              Salvo diversa indicazione, il Titolare non garantisce l'erogazione immediata in tempo reale, ma si impegna
              a fornire il servizio entro un termine ragionevole compatibile con la struttura tecnica del prodotto.
            </p>
          </Section>

          <Section title="9. Account utente">
            <p>
              Se il servizio prevede la creazione di un account, l'utente è responsabile della riservatezza delle
              credenziali di accesso e di ogni attività svolta tramite il proprio account.
            </p>
            <p>L'utente si impegna a:</p>
            <ul>
              <li>non condividere le credenziali con terzi</li>
              <li>non usare account altrui</li>
              <li>comunicare tempestivamente eventuali accessi non autorizzati o violazioni di sicurezza</li>
            </ul>
            <p>
              Il Titolare si riserva il diritto di sospendere o limitare l'accesso in caso di uso improprio, sospetta
              frode, violazione dei presenti Termini o condotte che possano compromettere il corretto funzionamento del
              servizio.
            </p>
          </Section>

          <Section title="10. Diritto di recesso">
            <p>
              Se l'utente acquista in qualità di consumatore, può beneficiare del diritto di recesso nei casi previsti
              dalla legge.
            </p>
            <p>
              In via generale, per i contratti conclusi a distanza il diritto di recesso è di 14 giorni. Tuttavia, per i
              contenuti digitali forniti su supporto non materiale, il diritto di recesso può essere escluso quando:
            </p>
            <ul>
              <li>l'esecuzione è iniziata durante il periodo di recesso</li>
              <li>l'utente ha prestato il proprio consenso espresso preventivo</li>
              <li>l'utente ha riconosciuto di perdere il diritto di recesso</li>
              <li>il professionista ha fornito la conferma del contratto secondo le modalità richieste dalla legge</li>
            </ul>
            <p>
              Di conseguenza, nel caso in cui l'utente chieda o accetti l'attivazione immediata del servizio digitale
              personalizzato, della generazione del report o della messa a disposizione immediata del contenuto
              digitale, l'utente accetta che l'esecuzione abbia inizio prima della scadenza del termine di recesso e,
              nei limiti di legge, riconosce di poter perdere il relativo diritto una volta iniziata l'esecuzione del
              servizio.
            </p>
          </Section>

          <Section title="11. Rimborso">
            <p>
              Per le ipotesi di recesso legale si rinvia alla precedente Sezione 10. Al di fuori di tali ipotesi e
              salvo quanto previsto dalla legge, i servizi digitali già erogati, attivati, personalizzati o resi
              disponibili all'utente non sono di norma rimborsabili.
            </p>
            <p>
              <strong>Garanzia commerciale "soddisfatti o rimborsati" (14 giorni).</strong> In aggiunta ai diritti
              riconosciuti dalla legge, il Titolare offre una garanzia commerciale volontaria: se entro 14 giorni dalla
              consegna del report l'utente ritiene che la lettura sia generica o non corrispondente ai dati di nascita
              forniti, può richiedere il rimborso integrale dell'importo pagato scrivendo a{" "}
              <a href="mailto:info@codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
                info@codiceinteriore.it
              </a>{" "}
              dall'indirizzo email utilizzato per l'acquisto.
            </p>
            <p>
              Il rimborso, una volta riconosciuto, viene effettuato sullo stesso metodo di pagamento utilizzato per
              l'acquisto, senza costi a carico dell'utente. La garanzia è prevista una sola volta per cliente e si
              riferisce esclusivamente all'acquisto iniziale della Lettura del Tema Natale (anche nella variante
              comprensiva del primo mese di Transiti). I rinnovi successivi dell'abbonamento Transiti non rientrano
              nella garanzia e restano disciplinati dalla successiva Sezione 12.
            </p>
            <p>
              Eventuali ulteriori richieste di assistenza o contestazioni possono essere inviate al medesimo indirizzo
              o ai recapiti indicati sul sito. Il Titolare valuterà in buona fede eventuali anomalie tecniche,
              duplicazioni di pagamento o mancata erogazione effettiva del servizio.
            </p>
          </Section>

          <Section title="12. Abbonamenti e contenuti ricorrenti">
            <p>Se il servizio acquistato include contenuti periodici, accessi ricorrenti o forme di abbonamento:</p>
            <ul>
              <li>
                la periodicità, il prezzo e le caratteristiche essenziali saranno indicate nella relativa pagina
                d'offerta
              </li>
              <li>
                l'utente è responsabile di verificare la natura ricorrente dell'acquisto prima della conferma
                dell'ordine
              </li>
              <li>
                il Titolare può sospendere o interrompere il servizio in caso di mancato pagamento o impossibilità
                tecnica sopravvenuta
              </li>
            </ul>
            <p>
              Se un piano ricorrente è previsto come rinnovo automatico, ciò deve essere chiaramente indicato nel
              checkout o nella pagina d'offerta prima dell'acquisto.
            </p>
          </Section>

          <Section title="13. Uso consentito del servizio">
            <p>
              L'utente può utilizzare i contenuti acquistati solo per fini personali e non commerciali, salvo diverso
              accordo scritto.
            </p>
            <p>È vietato:</p>
            <ul>
              <li>copiare, riprodurre, distribuire o rivendere i contenuti</li>
              <li>condividere pubblicamente report, materiali, output, flussi o aree riservate in modo sistematico</li>
              <li>utilizzare il servizio per finalità illecite, fraudolente o lesive di diritti altrui</li>
              <li>tentare di aggirare limitazioni tecniche, di sicurezza o di accesso</li>
            </ul>
          </Section>

          <Section title="14. Proprietà intellettuale">
            <p>
              Tutti i contenuti presenti sul sito e forniti tramite il servizio, inclusi testi, struttura del prodotto,
              materiali, interfacce, elementi grafici, loghi, nomi commerciali, output organizzati, layout e contenuti
              editoriali, sono riservati al Titolare o ai rispettivi aventi diritto.
            </p>
            <p>
              L'acquisto del servizio non trasferisce all'utente alcun diritto di proprietà intellettuale sul sito o sui
              contenuti, salvo il diritto personale e limitato di fruizione del servizio acquistato.
            </p>
          </Section>

          <Section title="15. Disponibilità del servizio">
            <p>
              Il Titolare si impegna a mantenere il sito e i servizi ragionevolmente disponibili, ma non garantisce che
              siano sempre accessibili senza interruzioni, errori, ritardi o malfunzionamenti.
            </p>
            <p>Il servizio può essere sospeso, limitato o interrotto per:</p>
            <ul>
              <li>manutenzione</li>
              <li>aggiornamenti tecnici</li>
              <li>problemi di rete o infrastruttura</li>
              <li>eventi fuori dal controllo ragionevole del Titolare</li>
              <li>indisponibilità di fornitori terzi essenziali</li>
            </ul>
          </Section>

          <Section title="16. Limitazione di responsabilità">
            <p>Nei limiti consentiti dalla legge, il Titolare non sarà responsabile per:</p>
            <ul>
              <li>
                decisioni personali, relazionali o professionali assunte dall'utente sulla base dei contenuti ricevuti
              </li>
              <li>perdite indirette, mancate opportunità o danni non prevedibili</li>
              <li>errori derivanti da dati inesatti forniti dall'utente</li>
              <li>
                interruzioni o malfunzionamenti imputabili a fornitori terzi, strumenti esterni, servizi AI, gateway di
                pagamento o reti di telecomunicazione
              </li>
              <li>incompatibilità temporanee con dispositivi, browser o configurazioni tecniche dell'utente</li>
            </ul>
            <p>
              Resta ferma l'eventuale responsabilità inderogabile prevista dalla normativa applicabile a tutela del
              consumatore.
            </p>
          </Section>

          <Section title="17. Privacy e dati personali">
            <p>
              Il trattamento dei dati personali dell'utente è disciplinato dalla{" "}
              <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
                Privacy Policy e Cookie Policy
              </a>{" "}
              pubblicata sul sito, che costituisce parte integrante del rapporto contrattuale per quanto compatibile.
            </p>
          </Section>

          <Section title="18. Modifiche ai Termini">
            <p>Il Titolare può aggiornare o modificare i presenti Termini e Condizioni in qualsiasi momento.</p>
            <p>
              Le modifiche avranno effetto dalla data di pubblicazione sul sito, salvo che sia diversamente indicato.
              Per gli ordini già conclusi restano applicabili, di regola, i termini vigenti al momento dell'acquisto.
            </p>
          </Section>

          <Section title="19. Legge applicabile e foro">
            <p>
              I presenti Termini e Condizioni sono disciplinati dalla legge applicabile determinata secondo le norme di
              diritto internazionale privato e, ove applicabili, dalle norme inderogabili di tutela del consumatore.
            </p>
            <p>
              Se l'utente agisce in qualità di consumatore, resta fermo ogni diritto eventualmente riconosciuto dalle
              norme imperative del Paese di residenza abituale del consumatore.
            </p>
            <p>
              Per ogni controversia relativa all'interpretazione, validità o esecuzione dei presenti Termini, se
              l'utente è consumatore sarà competente il foro eventualmente previsto come inderogabile dalla normativa
              applicabile.
            </p>
          </Section>

          <Section title="20. Contatti">
            <p>
              Per informazioni, assistenza o comunicazioni relative ai presenti Termini:{" "}
              <a href="mailto:info@codiceinteriore.it" className="text-primary underline-offset-4 hover:underline">
                info@codiceinteriore.it
              </a>
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

export default Terms;
