// Smoke di rendering del mercato finlandese, sul modello di nl-render.
//
// Si esegue con: VITE_MARKET=fi npx vitest run src/test/fi-render.smoke.test.tsx
// (di default VITE_MARKET non e' fi e il test si salta da solo).
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { MARKET } from "@/markets";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SynastryProvider } from "@/context/SynastryContext";
import IndexClassica from "@/pages/IndexClassica";
import Terms from "@/pages/Terms";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import CoppiaLanding from "@/pages/coppia/CoppiaLanding";
import ReportPreviewCarousel from "@/components/ReportPreviewCarousel";
import { ROUTES } from "@/lib/routes";
import { getMessages } from "@/i18n";

const suite = MARKET.id === "fi" ? describe : describe.skip;

const mount = (ui: React.ReactElement, path = "/") =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <SynastryProvider>{ui}</SynastryProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

suite("rendering mercato fi", () => {
  it("il mercato risolto e' fi con lingua, valuta e dominio giusti", () => {
    expect(MARKET.id).toBe("fi");
    expect(MARKET.language).toBe("fi");
    expect(MARKET.currency).toBe("EUR");
    expect(MARKET.locale).toBe("fi-FI");
    expect(MARKET.siteUrl).toBe("https://fi.cartainterior.com");
    expect(MARKET.cookieBanner).toBe(true);
  });

  it("gli slug sono finlandesi", () => {
    expect(ROUTES.couple).toBe("/pari");
    expect(ROUTES.terms).toBe("/kayttoehdot");
    expect(ROUTES.contact).toBe("/yhteystiedot");
    expect(ROUTES.gift).toBe("/lahja");
  });

  it("la landing a pagamento rende copy finlandese, senza residui", () => {
    mount(<IndexClassica />, ROUTES.lpClassica);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/syntymäkart/i);
    expect(text).not.toMatch(/\b(Inizia il quiz|Empezar el cuestionario|Start the quiz|Start de vragenlijst)\b/i);
  });

  it("la landing coppia rende copy finlandese", () => {
    mount(<CoppiaLanding />, ROUTES.couple);
    expect(document.body.textContent).toMatch(/synastri/i);
    expect(document.body.textContent).not.toMatch(/\b(the|your|jullie|vostra)\b/i);
  });

  it("le pagine legali rendono la versione finlandese", () => {
    mount(<Terms />, ROUTES.terms);
    expect(document.body.textContent).toMatch(/käyttöehdot/i);
    expect(document.body.textContent).toMatch(/Yhdistynyt kuningaskunta/);
    expect(document.body.textContent).not.toMatch(/Verenigd Koninkrijk|Autoriteit Persoonsgegevens/);

    mount(<PrivacyPolicy />, "/privacy");
    expect(document.body.textContent).toMatch(/tietosuoja/i);
  });

  it("il carosello mostra gli estratti FI, ognuno sotto la propria alt text", () => {
    const atteso: [string, RegExp][] = [
      ["hero-fi", /koko Carta Interior -raportista/i],
      ["1-identita-fi", /Syvä identiteetti/i],
      ["2-emozioni-fi", /Tunnedynamiikka/i],
      ["3-relazioni-fi", /Ihmissuhteet ja rakkaus/i],
      ["4-lavoro-fi", /Työ ja suunta/i],
      ["5-schemi-fi", /Toistuvat kuviot ja esteet/i],
      ["6-consigli-fi", /Käytännön neuvot/i],
      ["7-poesia-fi", /muutosrunosta/i],
    ];

    mount(<ReportPreviewCarousel />);
    const imgs = [...document.querySelectorAll("img")];
    expect(imgs).toHaveLength(atteso.length);
    imgs.forEach((img, i) => {
      const [file, alt] = atteso[i];
      expect(img.getAttribute("src"), `slide ${i + 1}: asset sbagliato`).toContain(file);
      expect(img.getAttribute("alt") ?? "", `slide ${i + 1}: alt text non corrisponde a ${file}`).toMatch(alt);
    });
  });

  it("i prezzi sono formattati alla finlandese: virgola decimale, simbolo dopo", () => {
    const { priceLabel } = getMessages("fi").common;
    expect(priceLabel(19).replace(/ /g, " ")).toBe("19 €");
    expect(priceLabel(14.9).replace(/ /g, " ")).toBe("14,90 €");
  });
});
