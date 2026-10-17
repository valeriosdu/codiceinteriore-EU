import { MessageCircle } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAstrologyGuide } from "./AstrologyGuideContext";
import { PACK_CREDITS } from "./constants";
import { useI18n } from "@/i18n/I18nProvider";

// Lives in its own file because Report.tsx renders AstrologyGuideProvider
// itself and so cannot call its hook: the consumer has to sit inside the
// provider tree.
//
// The pack offer otherwise appears only when credits run low, so without this
// entry a customer who wants more questions in advance has nothing to click.
// Same door as the ?openGuide=pack link. The label carries no price on purpose:
// the price is per market and the card it opens shows it.
const BuyPackMenuItem = () => {
  const { open } = useAstrologyGuide();
  const { m } = useI18n();

  return (
    <DropdownMenuItem onSelect={() => open({ packOffer: true })}>
      <MessageCircle className="mr-2 h-4 w-4" />
      {m.astrologyGuide.buyMore.menuItem(PACK_CREDITS)}
    </DropdownMenuItem>
  );
};

export default BuyPackMenuItem;
