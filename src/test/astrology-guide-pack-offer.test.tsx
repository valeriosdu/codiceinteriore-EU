import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getMessages } from "@/i18n";
import { MARKETS, type MarketConfig } from "@/markets";
import {
  AstrologyGuideContext,
  AstrologyGuideProvider,
  useAstrologyGuide,
  type AstrologyGuideContextValue,
} from "@/components/astrology-guide/AstrologyGuideContext";
import AstrologyGuideWidget from "@/components/astrology-guide/AstrologyGuideWidget";
import BuyMoreCreditsCard from "@/components/astrology-guide/BuyMoreCreditsCard";
import BuyPackMenuItem from "@/components/astrology-guide/BuyPackMenuItem";
import { PACK_CREDITS } from "@/components/astrology-guide/constants";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";

// Il riquadro d'acquisto del pacchetto compariva solo a crediti esauriti o
// quasi: chi ne voleva altri in anticipo non aveva niente da cliccare e al
// supporto mancava un URL da mandare. Le due porte (voce di menu e
// /report?openGuide=pack) passano da open({ packOffer: true }) -> showPackOffer.
// Il titolo, che diceva sempre "stai per finire", e' stato reso vero per ogni
// saldo. I testi si leggono dal catalogo: il test vale per ogni mercato.

const noop = async () => {};

const ctxValue = (
  balance: number,
  overrides: Partial<AstrologyGuideContextValue> = {},
): AstrologyGuideContextValue => ({
  loading: false,
  credits: { balance, total_granted: 10, total_used: 10 - balance },
  questions: [],
  isOpen: true,
  showPackOffer: false,
  pendingSectionId: null,
  pendingPrefill: null,
  submitting: false,
  buyingPack: false,
  quizSessionId: "session-1",
  open: () => {},
  close: () => {},
  toggle: () => {},
  consumePendingPrefill: () => {},
  consumePendingSection: () => null,
  submitQuestion: async () => ({ success: false }),
  buyPack: noop,
  submitFeedback: noop,
  ...overrides,
});

const inMarket = (market: MarketConfig, value: AstrologyGuideContextValue, ui: ReactNode) =>
  render(
    <I18nProvider market={market}>
      <AstrologyGuideContext.Provider value={value}>{ui}</AstrologyGuideContext.Provider>
    </I18nProvider>,
  );

describe.each(Object.values(MARKETS))("pacchetto domande, mercato $id", (market) => {
  const g = getMessages(market.language).astrologyGuide;

  it("a crediti esauriti dice che sono finiti", () => {
    inMarket(market, ctxValue(0), <BuyMoreCreditsCard />);
    expect(screen.getByText(g.buyMore.exhaustedHeadline)).toBeInTheDocument();
    expect(screen.queryByText(g.buyMore.balance(0))).not.toBeInTheDocument();
  });

  it("con 1-2 crediti dice che stanno per finire", () => {
    inMarket(market, ctxValue(2), <BuyMoreCreditsCard />);
    expect(screen.getByText(g.buyMore.nearEndHeadline)).toBeInTheDocument();
    expect(screen.getByText(g.buyMore.nearEndSub(PACK_CREDITS))).toBeInTheDocument();
  });

  it("con un saldo comodo non dice che stanno per finire", () => {
    inMarket(market, ctxValue(9), <BuyMoreCreditsCard />);
    expect(screen.queryByText(g.buyMore.nearEndHeadline)).not.toBeInTheDocument();
    expect(screen.getByText(g.buyMore.addHeadline)).toBeInTheDocument();
    expect(screen.getByText(g.buyMore.addSub(PACK_CREDITS))).toBeInTheDocument();
    expect(screen.getByText(g.buyMore.balance(9))).toBeInTheDocument();
  });

  it("il widget mostra l'offerta con saldo comodo solo se richiesta", () => {
    const { unmount } = inMarket(market, ctxValue(9), <AstrologyGuideWidget />);
    expect(screen.queryByText(g.buyMore.addHeadline)).not.toBeInTheDocument();
    unmount();

    inMarket(market, ctxValue(9, { showPackOffer: true }), <AstrologyGuideWidget />);
    expect(screen.getByText(g.buyMore.addHeadline)).toBeInTheDocument();
  });

  it("a crediti esauriti la card compare una volta sola anche con l'offerta richiesta", () => {
    inMarket(market, ctxValue(0, { showPackOffer: true }), <AstrologyGuideWidget />);
    expect(screen.getAllByText(g.buyMore.exhaustedHeadline)).toHaveLength(1);
  });

  it("la voce di menu apre la Guida con l'offerta e riporta il numero di domande", () => {
    const open = vi.fn();
    inMarket(
      market,
      ctxValue(9, { open }),
      <DropdownMenu open>
        <DropdownMenuContent>
          <BuyPackMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByText(g.buyMore.menuItem(PACK_CREDITS)));
    expect(open).toHaveBeenCalledWith({ packOffer: true });
  });
});

describe("link ?openGuide", () => {
  const Probe = () => {
    const { isOpen, showPackOffer } = useAstrologyGuide();
    return <p data-testid="state">{`open=${isOpen} pack=${showPackOffer}`}</p>;
  };

  const visit = (search: string) => {
    window.history.replaceState({}, "", `/report${search}`);
    render(
      <MemoryRouter>
        <I18nProvider>
          <AstrologyGuideProvider quizSessionId={null}>
            <Probe />
          </AstrologyGuideProvider>
        </I18nProvider>
      </MemoryRouter>,
    );
  };

  afterEach(() => window.history.replaceState({}, "", "/"));

  it("?openGuide=pack apre la Guida con l'offerta e toglie il parametro", () => {
    visit("?openGuide=pack&source=transit-pdf");
    expect(screen.getByTestId("state")).toHaveTextContent("open=true pack=true");
    expect(window.location.search).toBe("?source=transit-pdf");
  });

  it("?openGuide=1 resta identico: apre senza l'offerta", () => {
    visit("?openGuide=1");
    expect(screen.getByTestId("state")).toHaveTextContent("open=true pack=false");
    expect(window.location.search).toBe("");
  });

  it("un valore sconosciuto non apre niente", () => {
    visit("?openGuide=boh");
    expect(screen.getByTestId("state")).toHaveTextContent("open=false pack=false");
  });
});
