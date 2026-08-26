// Smoke di rendering del mercato olandese.
//
// Verifica che le pagine si montino davvero con VITE_MARKET=nl e che il testo a
// schermo sia olandese — non che le chiavi esistano (quello lo fa gia' il
// compilatore), ma che il catalogo giusto arrivi fino al DOM.
//
// Si esegue con: VITE_MARKET=nl npx vitest run src/test/nl-render.smoke.test.tsx
// (di default VITE_MARKET non e' nl e il test si salta da solo).
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { MARKET } from "@/markets";
import { I18nProvider } from "@/i18n/I18nProvider";
import IndexClassica from "@/pages/IndexClassica";
import IndexAttivazione from "@/pages/IndexAttivazione";
import Terms from "@/pages/Terms";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CoppiaLanding from "@/pages/coppia/CoppiaLanding";
import { ROUTES } from "@/lib/routes";
import { getMessages } from "@/i18n";

const isNl = MARKET.id === "nl";
const suite = isNl ? describe : describe.skip;

const mount = (ui: React.ReactElement, path = "/") =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>{ui}</I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

suite("rendering mercato nl", () => {
  it("il mercato risolto e' nl con la lingua e la valuta giuste", () => {
    expect(MARKET.id).toBe("nl");
    expect(MARKET.language).toBe("nl");
    expect(MARKET.currency).toBe("EUR");
    expect(MARKET.locale).toBe("nl-NL");
    expect(MARKET.cookieBanner).toBe(true);
  });

  it("gli slug sono olandesi", () => {
    expect(ROUTES.couple).toBe("/koppel");
    expect(ROUTES.terms).toBe("/voorwaarden");
    expect(ROUTES.gift).toBe("/cadeau");
  });

  it("le due landing a pagamento rendono copy olandese", () => {
    // Non la homepage: Index resta in stato "checking" finche' non risponde
    // l'auth di Supabase, che nei test non e' raggiungibile. Le landing del
    // traffico a pagamento sono comunque quelle che contano.
    mount(<IndexClassica />, ROUTES.lpClassica);
    // Il testo puo' essere spezzato su piu' nodi: si interroga il body.
    expect(document.body.textContent).toMatch(/Start de vragenlijst/i);
    expect(document.body.textContent).toMatch(/Wat je kunt ontdekken/i);
    expect(document.body.textContent).toMatch(/geboortehoroscoop/i);
    // Nessun residuo italiano o spagnolo nel corpo della pagina.
    expect(document.body.textContent).not.toMatch(/\b(Inizia il quiz|Empezar el cuestionario)\b/);
  });

  it("la landing coppia rende copy olandese", () => {
    mount(<CoppiaLanding />, ROUTES.couple);
    expect(document.body.textContent).toMatch(/gelezen door de sterren/i);
  });

  it("le pagine legali rendono la versione olandese", () => {
    mount(<Terms />, ROUTES.terms);
    expect(document.body.textContent).toMatch(/Algemene Voorwaarden/i);
    expect(document.body.textContent).toMatch(/Herroepingsrecht/i);
    expect(document.body.textContent).toMatch(/Verenigd Koninkrijk/);

    mount(<PrivacyPolicy />, "/privacy");
    expect(document.body.textContent).toMatch(/Privacy- en Cookieverklaring/i);
    expect(document.body.textContent).toMatch(/Autoriteit Persoonsgegevens/i);
  });

  it("i prezzi sono formattati alla olandese: simbolo davanti, virgola decimale", () => {
    const { priceLabel } = getMessages("nl").common;
    expect(priceLabel(19)).toBe("€ 19");
    expect(priceLabel(14.9)).toBe("€ 14,90");
    expect(priceLabel(9.9)).toBe("€ 9,90");
  });
});
