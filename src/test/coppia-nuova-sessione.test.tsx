// Rientrando nel funnel coppia dalla landing si deve ripartire da zero.
//
// Il 2026-09-01 una cliente olandese ha pagato due volte 14,90 per la stessa
// sinastria: aveva inserito una coppia diversa, ma il funnelStage salvato era
// ancora 'teaser', CoppiaProcessing l'ha rimbalzata al teaser precedente e il
// secondo checkout si e' agganciato alla sessione vecchia. I dati della seconda
// coppia non sono mai arrivati al database.
//
// Questi test bloccano l'invariante: entrare nel quiz dalla landing azzera
// sessione e stage, esattamente come fa gia' il pulsante "dati sbagliati".
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import {
  SynastryProvider,
  getStoredSynastrySessionId,
  getSynastryFunnelStage,
} from "@/context/SynastryContext";
import CoppiaLanding from "@/pages/coppia/CoppiaLanding";
import { ROUTES } from "@/lib/routes";
import { MARKET } from "@/markets";
import { getMessages } from "@/i18n";

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const vero = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...vero, useNavigate: () => navigate };
});

// La CTA va cercata per testo: il primo <button> della pagina e' quello
// dell'header, non quella che avvia il quiz.
const testoCta = getMessages(MARKET.language).coppia.landing.cta;

const montaLanding = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[ROUTES.couple]}>
        <I18nProvider>
          <SynastryProvider>
            <CoppiaLanding />
          </SynastryProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("funnel coppia: rientro dalla landing", () => {
  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
    // Stato di chi ha gia' comprato una sinastria e torna per farne un'altra.
    localStorage.setItem("ci_synastry_session_id", "fd71306b-ae1e-429e-b736-87f90394ad0c");
    localStorage.setItem("ci_synastry_funnel_stage", "teaser");
    localStorage.setItem("ci_synastry_pricing_tier", "launch");
  });

  it("avviare il quiz dalla landing azzera sessione e stage", () => {
    montaLanding();
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(testoCta, "i") })[0]);

    expect(getStoredSynastrySessionId(), "la sessione vecchia sopravvive: il secondo acquisto si aggancerebbe a quella").toBeNull();
    expect(getSynastryFunnelStage(), "lo stage 'teaser' sopravvive: CoppiaProcessing rimbalza alla coppia precedente").toBeNull();
    expect(navigate).toHaveBeenCalledWith(ROUTES.coupleQuiz);
  });

  it("il prezzo di lancio sopravvive all'azzeramento", () => {
    // clearSynastryStorage tiene apposta il pricingTier: chi compra una seconda
    // sinastria non deve perdere lo sconto.
    montaLanding();
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(testoCta, "i") })[0]);
    expect(localStorage.getItem("ci_synastry_pricing_tier")).toBe("launch");
  });
});

// La barra CTA fissa su mobile e' un secondo ingresso nel funnel: se il suo
// bottone fosse un <Link> al quiz salterebbe resetForNewPurchase() e
// riaprirebbe il caso del doppio pagamento. Ogni CTA della pagina deve passare
// da startQuiz.
describe("landing coppia: barra CTA fissa mobile", () => {
  // Per testo e non per nome accessibile: dentro la barra nascosta il nome
  // calcolato e' vuoto, quindi getAllByRole({ name }) non la troverebbe.
  const bottoniCta = () =>
    screen
      .getAllByRole("button", { hidden: true })
      .filter((b) => new RegExp(testoCta, "i").test(b.textContent ?? ""));

  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tutti i bottoni CTA, barra fissa compresa, azzerano la sessione", () => {
    montaLanding();
    // hidden: la barra parte con visibility:hidden, quindi fuori dall'albero
    // di accessibilita' finche' l'hero non esce dallo schermo.
    const cta = bottoniCta();
    expect(cta, "hero, chiusa e barra fissa").toHaveLength(3);

    cta.forEach((bottone) => {
      localStorage.setItem("ci_synastry_session_id", "fd71306b-ae1e-429e-b736-87f90394ad0c");
      localStorage.setItem("ci_synastry_funnel_stage", "teaser");
      navigate.mockClear();

      fireEvent.click(bottone);

      expect(getStoredSynastrySessionId()).toBeNull();
      expect(getSynastryFunnelStage()).toBeNull();
      expect(navigate).toHaveBeenCalledWith(ROUTES.coupleQuiz);
    });
  });

  it("la barra compare quando il CTA dell'hero esce dallo schermo e sparisce alla chiusa", () => {
    // jsdom non ha IntersectionObserver: se ne simula uno che espone la callback.
    let notifica: IntersectionObserverCallback = () => {};
    const osservati: Element[] = [];
    class FinteOsservatore {
      constructor(callback: IntersectionObserverCallback) {
        notifica = callback;
      }
      observe(el: Element) {
        osservati.push(el);
      }
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", FinteOsservatore);

    montaLanding();
    const barra = bottoniCta().at(-1)!.parentElement!;
    const [hero, finale] = osservati;
    expect(barra.style.visibility).toBe("hidden");

    const voce = (target: Element, isIntersecting: boolean, top: number) =>
      ({ target, isIntersecting, boundingClientRect: { top } }) as unknown as IntersectionObserverEntry;
    const emetti = (...voci: IntersectionObserverEntry[]) =>
      act(() => notifica(voci, {} as IntersectionObserver));

    // Hero fuori schermo, chiusa ancora sotto la piega: la barra serve.
    emetti(voce(hero, false, -200), voce(finale, false, 1800));
    expect(barra.style.visibility).toBe("visible");

    // La chiusa entra nello schermo: ha gia' il suo bottone, la barra si ritira.
    emetti(voce(finale, true, 400));
    expect(barra.style.visibility).toBe("hidden");

    // Oltre la chiusa (siamo nel footer): resta nascosta.
    emetti(voce(finale, false, -300));
    expect(barra.style.visibility).toBe("hidden");

    // Si risale: hero ancora fuori, chiusa di nuovo sotto la piega.
    emetti(voce(finale, false, 900));
    expect(barra.style.visibility).toBe("visible");

    // Torna visibile l'hero: la barra sparisce.
    emetti(voce(hero, true, 300));
    expect(barra.style.visibility).toBe("hidden");
  });
});
