// Il logo dell'header decide dove manda un visitatore anonimo.
//
// Ordine: prima chi ha pagato e non ha mai attivato l'account (marker
// d'acquisto, porta a /activate: gli manca l'account, non la lettura), poi chi
// ha una lettura ancora dentro i 7 giorni (porta a /teaser), altrimenti alla
// landing. Il client Supabase e' quello vero: senza sessione salvata
// getSession() legge solo localStorage e non esce in rete.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import Header from "@/components/Header";

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const vero = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...vero, useNavigate: () => navigate };
});

const DAY_MS = 24 * 60 * 60 * 1000;

const clickLogo = async () => {
  render(
    <MemoryRouter>
      <I18nProvider>
        <Header />
      </I18nProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getAllByRole("link")[0]);
  await waitFor(() => expect(navigate).toHaveBeenCalled());
};

const seedReading = (stage: "teaser" | "offer", ageMs: number) => {
  localStorage.setItem("ci_session_id", "11111111-1111-4111-8111-111111111111");
  localStorage.setItem("ci_funnel_stage", stage);
  localStorage.setItem("ci_funnel_started_at", String(Date.now() - ageMs));
};

describe("header: instradamento dal logo per un visitatore anonimo", () => {
  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
  });

  it("senza stato salvato va alla landing", async () => {
    await clickLogo();
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("con una lettura di 2 giorni va al teaser", async () => {
    seedReading("teaser", 2 * DAY_MS);
    await clickLogo();
    expect(navigate).toHaveBeenCalledWith("/teaser");
  });

  it("con una lettura di 8 giorni va alla landing e ripulisce lo storage", async () => {
    seedReading("offer", 8 * DAY_MS);
    await clickLogo();
    expect(navigate).toHaveBeenCalledWith("/");
    expect(localStorage.getItem("ci_session_id")).toBeNull();
  });

  it("chi ha pagato e non ha attivato va a /activate, anche con la lettura scaduta", async () => {
    seedReading("offer", 8 * DAY_MS);
    localStorage.setItem("ci_purchase_session_id", "cs_test_a1B2");
    await clickLogo();
    expect(navigate).toHaveBeenCalledWith("/activate?session_id=cs_test_a1B2");
  });

  it("il marker ha la precedenza sul teaser ancora valido", async () => {
    seedReading("teaser", DAY_MS);
    localStorage.setItem("ci_purchase_session_id", "pp_ORDER123");
    await clickLogo();
    expect(navigate).toHaveBeenCalledWith("/activate?session_id=pp_ORDER123");
  });
});
