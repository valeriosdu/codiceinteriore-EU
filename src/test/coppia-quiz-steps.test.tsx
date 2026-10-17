// Quiz coppia a 6 step: card che avanzano da sole, dati per persona, ore insieme.
//
// Erano 9 schermate con un campo ciascuna. Qui si blocca quello che la nuova
// struttura ha di delicato: il tap che avanza non deve mai saltare una domanda
// (un doppio tap lanciava due timer), 'prefer_not_to_say' resta il valore che
// process-synastry-insights legge, e una ruota lasciata intatta continua a
// valere il valore che mostra (stessa regola del quiz natale).
//
// PlaceAutocomplete e' sostituito da un input semplice: nella versione vera
// ogni luogo passa da una edge function di geocoding, che qui non c'e'.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { forwardRef, useImperativeHandle } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SynastryProvider, useSynastry } from "@/context/SynastryContext";
import CoppiaQuiz from "@/pages/coppia/CoppiaQuiz";
import { ROUTES } from "@/lib/routes";
import { MARKET } from "@/markets";
import { getMessages } from "@/i18n";

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const vero = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...vero, useNavigate: () => navigate };
});

vi.mock("@/components/PlaceAutocomplete", () => {
  type StubProps = {
    value: string;
    placeholder?: string;
    onTextChange: (t: string) => void;
    onClear?: () => void;
    onChange: (p: {
      name: string;
      lat: number;
      lng: number;
      timezone: number;
      timezoneIana: string;
    }) => void;
  };
  const Stub = forwardRef<{ resolve: () => Promise<string | null> }, StubProps>(
    ({ value, placeholder, onTextChange, onClear, onChange }, ref) => {
      useImperativeHandle(ref, () => ({
        resolve: async () => {
          const name = value.trim();
          if (name.length < 2) return null;
          onChange({ name, lat: 45.46, lng: 9.19, timezone: 1, timezoneIana: "Europe/Rome" });
          return name;
        },
      }));
      return (
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onTextChange(e.target.value);
            onClear?.();
          }}
        />
      );
    },
  );
  return { default: Stub };
});

const m = getMessages(MARKET.language);
const cq = m.coppia.quiz;

const Probe = () => {
  const { data } = useSynastry();
  return (
    <div data-testid="probe">
      {JSON.stringify({
        duration: data.relationshipDuration,
        firstMove: data.firstMove,
        focus: data.focusRelational,
        a: { date: data.personA.birthDate, time: data.personA.birthTime, known: data.personA.timeKnown },
        b: { date: data.personB.birthDate, time: data.personB.birthTime, known: data.personB.timeKnown },
      })}
    </div>
  );
};

const mount = () =>
  render(
    <MemoryRouter initialEntries={[ROUTES.coupleQuiz]}>
      <I18nProvider>
        <SynastryProvider>
          <Probe />
          <CoppiaQuiz />
        </SynastryProvider>
      </I18nProvider>
    </MemoryRouter>,
  );

const saved = () => JSON.parse(screen.getByTestId("probe").textContent!);
const next = () => screen.getByRole("button", { name: cq.next });
const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
};
const tap = (label: string) => fireEvent.click(screen.getByText(label));
const stepLabel = (n: number) => m.quiz.stepOf(n, 6);

// Le transizioni di AnimatePresence (mode="wait") durano ~300ms piu' i 180ms
// del tap: findBy* aspetta con un margine largo.
const arrivesAt = (text: string) => screen.findByText(text, undefined, { timeout: 3000 });

const goToPersonA = async () => {
  tap(cq.context.durations["1_to_3y"]);
  await arrivesAt(cq.firstMove.question);
  tap(cq.firstMove.options.partner);
  await arrivesAt(cq.people.titleA);
};

const fillPersonDesktop = (name: string, place: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: cq.people.nameLabel }), { target: { value: name } });
  const [day, month, year] = screen.getAllByRole("combobox");
  fireEvent.change(day, { target: { value: "20" } });
  fireEvent.change(month, { target: { value: "3" } });
  fireEvent.change(year, { target: { value: "1992" } });
  fireEvent.change(screen.getByPlaceholderText(cq.place.placeholder), { target: { value: place } });
};

beforeAll(() => {
  // jsdom non implementa Element.prototype.scrollTo, usata dal tap su riga.
  Element.prototype.scrollTo = vi.fn();
});

beforeEach(() => {
  localStorage.clear();
  navigate.mockClear();
  setViewport(1024);
});

afterEach(() => {
  setViewport(1024);
});

describe("quiz coppia: card che avanzano da sole", () => {
  it("il tap su una durata la salva col valore del database e passa alla domanda dopo", async () => {
    mount();
    expect(screen.getByText(stepLabel(1))).toBeInTheDocument();

    tap(cq.context.durations.skip);
    await arrivesAt(cq.firstMove.question);

    // 'skip' e' solo l'etichetta del catalogo: il database legge 'prefer_not_to_say'.
    expect(saved().duration).toBe("prefer_not_to_say");
    expect(screen.getByText(stepLabel(2))).toBeInTheDocument();
  });

  it("un doppio tap sulla stessa card non salta la domanda successiva", async () => {
    mount();

    tap(cq.context.durations.under_1y);
    tap(cq.context.durations.under_1y);
    await arrivesAt(cq.firstMove.question);
    // Il secondo timer scatta subito dopo il primo: se la guardia manca, qui si
    // sarebbe gia' passati alla schermata della persona A.
    await new Promise((r) => setTimeout(r, 450));

    expect(screen.getByText(cq.firstMove.question)).toBeInTheDocument();
    expect(screen.queryByText(cq.people.titleA)).toBeNull();
    expect(screen.getByText(stepLabel(2))).toBeInTheDocument();
  });

  it("chi ha fatto il primo passo si salva come id, non come testo", async () => {
    mount();
    await goToPersonA();

    expect(saved().firstMove).toBe("partner");
    expect(saved().duration).toBe("1_to_3y");
  });
});

describe("quiz coppia: schermata della persona (desktop)", () => {
  it("e' il terzo passo di sei e blocca Avanti finche' mancano nome, data e luogo", async () => {
    mount();
    await goToPersonA();

    expect(screen.getByText(stepLabel(3))).toBeInTheDocument();
    expect(next()).toBeDisabled();
    expect(screen.getByText(cq.missing.date)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: cq.people.nameLabel }), { target: { value: "Anna" } });
    const [day, month, year] = screen.getAllByRole("combobox");
    fireEvent.change(day, { target: { value: "20" } });
    fireEvent.change(month, { target: { value: "3" } });
    expect(next()).toBeDisabled();
    fireEvent.change(year, { target: { value: "1992" } });
    expect(screen.queryByText(cq.missing.date)).toBeNull();
    expect(next()).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(cq.place.placeholder), { target: { value: "Milano" } });
    expect(next()).toBeEnabled();
  });
});

describe("quiz coppia: percorso completo (desktop)", () => {
  it("focus scelto, focus saltato, ore di entrambi e calcolo", async () => {
    mount();
    await goToPersonA();
    fillPersonDesktop("Anna", "Milano");
    fireEvent.click(next());

    await arrivesAt(cq.focus.question);
    expect(screen.getByText(stepLabel(4))).toBeInTheDocument();

    // Il testo della card e' quello che finisce in focus_relational.
    tap(cq.focus.options[1]);
    await arrivesAt(cq.people.titleB);
    expect(saved().focus).toBe(cq.focus.options[1]);
    expect(screen.getByText(cq.helper.almostDone)).toBeInTheDocument();

    fillPersonDesktop("Luca", "Roma");
    fireEvent.click(next());

    await arrivesAt(cq.times.title);
    expect(screen.getByText(stepLabel(6))).toBeInTheDocument();
    expect(screen.getByText(cq.helper.lastStep)).toBeInTheDocument();
    const finalCta = () => screen.getByRole("button", { name: cq.finalCta });
    expect(finalCta()).toBeDisabled();
    expect(screen.getByText(cq.missing.time)).toBeInTheDocument();

    // Le righe portano il nome inserito, non l'etichetta generica.
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("Luca")).toBeInTheDocument();

    const [hourA, minuteA] = screen.getAllByRole("combobox");
    fireEvent.change(hourA, { target: { value: "8" } });
    fireEvent.change(minuteA, { target: { value: "30" } });
    expect(finalCta()).toBeDisabled();

    // Per la seconda persona basta dichiarare che non la conosce.
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(finalCta()).toBeEnabled();
    expect(screen.getByText(cq.time.unknownNote)).toBeInTheDocument();

    fireEvent.click(finalCta());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith(ROUTES.coupleProcessing));
    expect(saved().a).toMatchObject({
      date: { day: 20, month: 3, year: 1992 },
      time: { hour: 8, minute: 30 },
      known: true,
    });
    expect(saved().b).toMatchObject({
      date: { day: 20, month: 3, year: 1992 },
      time: { hour: null, minute: null },
      known: false,
    });
  });

  it("saltare la domanda sul focus lascia focus_relational vuoto", async () => {
    mount();
    await goToPersonA();
    fillPersonDesktop("Anna", "Milano");
    fireEvent.click(next());

    await arrivesAt(cq.focus.question);
    tap(cq.focus.skip);
    await arrivesAt(cq.people.titleB);

    expect(saved().focus).toBe("");
  });

  it("il tasto indietro riporta al passo precedente e alla risposta data", async () => {
    mount();
    await goToPersonA();

    fireEvent.click(screen.getByRole("button", { name: cq.back }));
    await arrivesAt(cq.firstMove.question);

    expect(screen.getByText(stepLabel(2))).toBeInTheDocument();
    expect(saved().firstMove).toBe("partner");
  });
});

describe("quiz coppia: ruote su mobile", () => {
  beforeEach(() => setViewport(375));

  it("un tocco su una ruota basta, le altre valgono il valore che mostrano", async () => {
    mount();
    await goToPersonA();

    expect(next()).toBeDisabled();
    expect(screen.getByText(cq.date.confirmHint)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: cq.people.nameLabel }), { target: { value: "Anna" } });
    fireEvent.change(screen.getByPlaceholderText(cq.place.placeholder), { target: { value: "Milano" } });
    expect(next()).toBeDisabled();

    const [dayWheel] = screen.getAllByRole("listbox");
    fireEvent.click(within(dayWheel).getAllByRole("option")[19]);
    expect(next()).toBeEnabled();

    fireEvent.click(next());
    await arrivesAt(cq.focus.question);

    expect(saved().a.date).toEqual({ day: 20, month: 6, year: 1980 });
  });
});
