import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { MARKET, type Language, type MarketConfig } from '@/markets';
import { getMessages, type Messages } from './index';

export type I18n = {
  m: Messages;
  language: Language;
  market: MarketConfig;
  formatDate: (date: Date | string, opts?: Intl.DateTimeFormatOptions) => string;
};

function buildI18n(market: MarketConfig): I18n {
  return {
    m: getMessages(market.language),
    language: market.language,
    market,
    formatDate: (date, opts) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (Number.isNaN(d.getTime())) return String(date);
      return new Intl.DateTimeFormat(
        market.locale,
        opts ?? { day: 'numeric', month: 'long', year: 'numeric' },
      ).format(d);
    },
  };
}

// Default dal mercato attivo: useI18n funziona anche senza provider (utile
// nei test e per chiamate fuori dall'albero React).
const defaultI18n = buildI18n(MARKET);

const I18nContext = createContext<I18n>(defaultI18n);

export function I18nProvider({
  market,
  children,
}: {
  market?: MarketConfig;
  children: ReactNode;
}) {
  const value = useMemo(
    () => (market ? buildI18n(market) : defaultI18n),
    [market],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
