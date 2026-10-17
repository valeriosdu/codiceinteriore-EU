// Il tasto indietro dal teaser non riapre il quiz.
//
// La cronologia del funnel e' / -> /quiz -> /teaser, perche' /processing si
// auto-cancella con replace: un back dal teaser atterra su /quiz alla domanda 1.
// Rifacendo il quiz da li' con un dato di nascita diverso, la guard di
// Processing riusa la sessione esistente e il teaser mostra la data nuova con la
// carta della vecchia (CLAUDE.md, punto 8). La guard e' solo su POP: una CTA da
// una landing e' un PUSH e deve aprire il quiz.
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import { QuizProvider } from "@/context/QuizContext";
import Quiz from "@/pages/Quiz";
import { ROUTES } from "@/lib/routes";

const DAY_MS = 24 * 60 * 60 * 1000;

const seedReading = (ageMs = DAY_MS) => {
  localStorage.setItem("ci_session_id", "11111111-1111-4111-8111-111111111111");
  localStorage.setItem("ci_funnel_stage", "teaser");
  localStorage.setItem("ci_funnel_started_at", String(Date.now() - ageMs));
};

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const Landing = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate("/quiz")}>vai al quiz</button>;
};

const mount = (entry: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <I18nProvider>
          <QuizProvider>
            <Where />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path={ROUTES.gift} element={<Quiz />} />
              <Route path="/teaser" element={<div>teaser</div>} />
            </Routes>
          </QuizProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

const where = () => screen.getByTestId("where").textContent;

describe("quiz: tasto indietro dal teaser", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("su POP con una lettura pronta torna al teaser", () => {
    seedReading();
    mount("/quiz");
    expect(where()).toBe("/teaser");
  });

  it("su POP senza lettura il quiz si apre come prima", () => {
    mount("/quiz");
    expect(where()).toBe("/quiz");
  });

  it("su POP con una lettura scaduta il quiz si apre e lo storage viene ripulito", () => {
    seedReading(8 * DAY_MS);
    mount("/quiz");
    expect(where()).toBe("/quiz");
    expect(localStorage.getItem("ci_session_id")).toBeNull();
  });

  it("su PUSH da una landing il quiz si apre anche con una lettura pronta", () => {
    seedReading();
    mount("/");
    fireEvent.click(screen.getByText("vai al quiz"));
    expect(where()).toBe("/quiz");
  });

  it("la rotta regalo non viene rimbalzata al teaser", () => {
    seedReading();
    mount(ROUTES.gift);
    expect(where()).toBe(ROUTES.gift);
  });
});
