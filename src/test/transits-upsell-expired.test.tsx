import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getMessages } from "@/i18n";
import { MARKET } from "@/markets";
import TransitsUpsellCard from "@/components/TransitsUpsellCard";

// La card viene mostrata anche a chi ha solo cicli vecchi da consultare, e la
// finestra pagata puo' essere chiusa da mesi. Finche' la data non veniva
// confrontata con oggi, a quel cliente diceva "Attivi / Hai i transiti di
// questo mese" sopra una scadenza passata: quattro affermazioni false in un
// colpo solo, su una pagina che gli sta chiedendo di pagare (set. 2026).
//
// I testi si leggono dal catalogo invece di scriverli a mano: cosi' il test
// vale per qualunque mercato e fallisce anche se una lingua perde una chiave.

const t = getMessages(MARKET.language).transits.upsell;
const giorniDaOggi = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

const monta = (accessEndsAt: string | null, conStorico = true) =>
  render(
    <I18nProvider>
      <TransitsUpsellCard subscriptionOnly={conStorico} accessEndsAt={accessEndsAt} />
    </I18nProvider>,
  );

describe("TransitsUpsellCard, finestra transiti", () => {
  it("con la finestra ancora aperta dice che sono attivi", () => {
    monta(giorniDaOggi(10));
    expect(screen.getByText(t.activeBadge)).toBeInTheDocument();
    expect(screen.getByText(t.activeTitle)).toBeInTheDocument();
    expect(screen.getByText(t.validUntil)).toBeInTheDocument();
  });

  it("con la finestra scaduta non dice piu' che sono di questo mese", () => {
    monta(giorniDaOggi(-76));
    expect(screen.queryByText(t.activeTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(t.activeBadge)).not.toBeInTheDocument();
    expect(screen.getByText(t.expiredTitle)).toBeInTheDocument();
    expect(screen.getByText(t.validUntilExpired)).toBeInTheDocument();
  });

  it("a chi non ne ha mai avuti mostra la card di vendita", () => {
    monta(null, false);
    expect(screen.getByText(t.kicker)).toBeInTheDocument();
    expect(screen.queryByText(t.activeBadge)).not.toBeInTheDocument();
    expect(screen.queryByText(t.expiredBadge)).not.toBeInTheDocument();
  });
});
