// Step data e ora del quiz: cosa basta per andare avanti, e cosa finisce in
// QuizContext.
//
// Le ruote (mobile) non confermano piu' da sole il valore su cui si aprono, e
// per avanzare basta un gesto su una ruota qualsiasi: le altre valgono il valore
// che stanno gia' mostrando nella banda. Il <select> desktop invece mostra '—'
// per un campo non scelto, quindi li' servono tutti i campi: altrimenti
// Continua riempirebbe in silenzio un mese e un anno che l'utente non ha mai
// visto scelti.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import { QuizProvider, useQuiz } from "@/context/QuizContext";
import { MARKET } from "@/markets";
import { getMessages } from "@/i18n";
import Quiz from "@/pages/Quiz";

const q = getMessages(MARKET.language).quiz;
const wh = q.wheelHint;

const DATE_STEP = "/quiz?step=2";
const TIME_STEP = "/quiz?step=3";

const Probe = () => {
  const { data } = useQuiz();
  return (
    <div data-testid="probe">
      {JSON.stringify({
        date: data.birthDate,
        time: data.birthTime,
        unknown: data.birthTimeUnknown,
      })}
    </div>
  );
};

const mount = (entry: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <I18nProvider>
          <QuizProvider>
            <Probe />
            <Routes>
              <Route path="/quiz" element={<Quiz />} />
            </Routes>
          </QuizProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

const saved = () => JSON.parse(screen.getByTestId("probe").textContent!);
const continueButton = () => screen.getByRole("button", { name: q.cta.continue });

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
};

beforeAll(() => {
  // jsdom non implementa Element.prototype.scrollTo, usata dal tap su riga.
  Element.prototype.scrollTo = vi.fn();
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  setViewport(1024);
});

describe("quiz desktop: servono tutti i campi", () => {
  beforeEach(() => setViewport(1024));

  it("la data resta bloccata finche' manca un campo", () => {
    mount(DATE_STEP);
    const [day, month, year] = screen.getAllByRole("combobox");

    expect(continueButton()).toBeDisabled();
    fireEvent.change(day, { target: { value: "20" } });
    expect(continueButton()).toBeDisabled();
    fireEvent.change(month, { target: { value: "3" } });
    expect(continueButton()).toBeDisabled();
    fireEvent.change(year, { target: { value: "1992" } });
    expect(continueButton()).toBeEnabled();
  });

  it("non mostra le righe di aiuto delle ruote", () => {
    mount(DATE_STEP);

    expect(screen.queryByText(wh.date.all)).toBeNull();
  });

  it("l'ora resta bloccata con un solo campo scelto", () => {
    mount(TIME_STEP);
    const [hour, minute] = screen.getAllByRole("combobox");

    expect(continueButton()).toBeDisabled();
    fireEvent.change(hour, { target: { value: "8" } });
    expect(continueButton()).toBeDisabled();
    fireEvent.change(minute, { target: { value: "30" } });
    expect(continueButton()).toBeEnabled();
  });
});

describe("quiz mobile: basta un gesto su una ruota", () => {
  beforeEach(() => setViewport(375));

  it("senza toccare niente Continua e' bloccato e dice cosa fare", () => {
    mount(DATE_STEP);

    expect(continueButton()).toBeDisabled();
    expect(screen.getByText(wh.date.all)).toBeInTheDocument();
  });

  it("un tocco su una ruota sblocca e elenca i campi rimasti al default", () => {
    mount(DATE_STEP);
    const [dayWheel] = screen.getAllByRole("listbox");

    fireEvent.click(within(dayWheel).getAllByRole("option")[19]);

    expect(continueButton()).toBeEnabled();
    expect(screen.getByText(wh.date.some(wh.join([wh.fields.month, wh.fields.year])))).toBeInTheDocument();
  });

  it("le ruote non toccate entrano nel contesto col valore che mostrano", () => {
    mount(DATE_STEP);
    const [dayWheel] = screen.getAllByRole("listbox");

    fireEvent.click(within(dayWheel).getAllByRole("option")[19]);
    fireEvent.click(continueButton());

    expect(saved().date).toEqual({ day: 20, month: 6, year: 1980 });
  });

  it("l'ora si sblocca con un solo campo e completa l'altro con l'ancora", () => {
    mount(TIME_STEP);
    const [hourWheel] = screen.getAllByRole("listbox");

    expect(continueButton()).toBeDisabled();
    expect(screen.getByText(wh.time.all)).toBeInTheDocument();

    fireEvent.click(within(hourWheel).getAllByRole("option")[8]);
    expect(continueButton()).toBeEnabled();
    fireEvent.click(continueButton());

    expect(saved().time).toEqual({ hour: 8, minute: 0 });
    expect(saved().unknown).toBe(false);
  });
});

describe("quiz: non conosco la mia ora di nascita", () => {
  it.each([1024, 375])("sblocca Continua a %ipx e salva mezzogiorno col flag", (width) => {
    setViewport(width);
    mount(TIME_STEP);

    expect(continueButton()).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(continueButton()).toBeEnabled();
    expect(screen.getByText(q.steps.time.unknown.note)).toBeInTheDocument();

    fireEvent.click(continueButton());

    expect(saved().time).toEqual({ hour: 12, minute: 0 });
    expect(saved().unknown).toBe(true);
  });

  it("togliendo la spunta torna la regola normale", () => {
    setViewport(1024);
    mount(TIME_STEP);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("checkbox"));

    expect(continueButton()).toBeDisabled();
  });
});
