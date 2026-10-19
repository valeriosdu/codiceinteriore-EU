import { useEffect, useState } from "react";
import type { MarketId } from "@/markets/types";

// Record e non array: un mercato aggiunto a MarketId senza etichetta qui e' un
// errore di compilazione, non un mercato che l'admin non puo' selezionare.
// Etichette allineate a quelle della dashboard.
const ADMIN_MARKET_LABELS: Record<MarketId, string> = {
  it: "Italia",
  es: "Spagna",
  us: "Stati Uniti",
  nl: "Paesi Bassi",
  fi: "Finlandia",
};

export const ADMIN_MARKETS = (Object.keys(ADMIN_MARKET_LABELS) as MarketId[]).map((key) => ({
  key,
  label: ADMIN_MARKET_LABELS[key],
}));

export function toAdminMarket(value: string | null | undefined): MarketId | undefined {
  return ADMIN_MARKETS.find((m) => m.key === value)?.key;
}

// Senza un default noto il campo parte vuoto e va scelto: il backend ripiega
// su 'it', e un cliente olandese riceverebbe report, PDF ed email in italiano.
export function useMarketOnOpen(open: boolean, defaultMarket?: MarketId) {
  const [market, setMarket] = useState<MarketId | "">(defaultMarket ?? "");
  useEffect(() => {
    if (open) setMarket(defaultMarket ?? "");
  }, [open, defaultMarket]);
  return [market, setMarket] as const;
}
