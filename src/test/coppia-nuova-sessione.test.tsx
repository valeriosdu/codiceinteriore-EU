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
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
