// Schermata "ponte" dopo la domanda 1 del funnel attivazione: ogni risposta
// porta alla sua variante (titolo, legenda, specchio), il ponte non conta come
// passo della barra e Continua porta alla data. Gira sul catalogo del mercato di
// build, quindi vale per ogni lingua: i testi attesi si leggono dal catalogo.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import { QuizProvider } from "@/context/QuizContext";
import { MARKET } from "@/markets";
import { getMessages } from "@/i18n";
import Quiz from "@/pages/Quiz";

const q = getMessages(MARKET.language).quiz;
const bridge = q.steps.bridge;
const answers = q.steps.symptom.options;

const mount = (entry: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <I18nProvider>
          <QuizProvider>
            <Routes>
              <Route path="/quiz" element={<Quiz />} />
            </Routes>
          </QuizProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

beforeEach(() => {
  localStorage.clear();
});

describe("ponte dopo la domanda 1 (funnel attivazione)", () => {
  it("il catalogo ha 4 varianti, una per risposta, con la legenda attesa dal disegno", () => {
    expect(answers).toHaveLength(4);
    expect(bridge.variants).toHaveLength(4);
    expect(bridge.variants.map(v => v.legend.length)).toEqual([3, 3, 2, 3]);
    for (const v of bridge.variants) {
      expect(v.headline.length).toBeGreaterThan(10);
      expect(v.body.length).toBeGreaterThan(20);
    }
  });

  answers.forEach((answer, i) => {
    it(`risposta ${i + 1}: mostra la sua variante e rispecchia la risposta`, () => {
      mount("/quiz?funnel=attivazione");
      fireEvent.click(screen.getByText(answer));
      return screen.findByRole("heading", { name: bridge.variants[i].headline }).then(() => {
        expect(screen.getByText(`“${answer}”`)).toBeTruthy();
        // In fi la prima voce e' "MC", scritta anche dentro il disegno: basta che ci sia.
        expect(screen.getAllByText(bridge.variants[i].legend[0]).length).toBeGreaterThan(0);
        expect(screen.getByText(bridge.next)).toBeTruthy();
      });
    });
  });

  it("il ponte non conta come passo: la barra resta sul 1 e poi la data e' il 2 di 6", async () => {
    mount("/quiz?funnel=attivazione");
    fireEvent.click(screen.getByText(answers[1]));
    await screen.findByRole("heading", { name: bridge.variants[1].headline });
    expect(screen.getByText(q.stepOf(1, 6))).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: q.cta.continue }));
    await screen.findByText(q.steps.date.title.self);
    expect(screen.getByText(q.stepOf(2, 6))).toBeTruthy();
  });

  it("senza risposta (step=2 diretto) mostra una variante senza lo specchio", async () => {
    mount("/quiz?funnel=attivazione&step=2");
    await screen.findByRole("heading", { name: bridge.variants[1].headline });
    expect(screen.queryByText(bridge.youAnswered)).toBeNull();
  });

  it("gli altri funnel non hanno il ponte", () => {
    mount("/quiz");
    expect(screen.queryByText(bridge.next)).toBeNull();
  });
});
