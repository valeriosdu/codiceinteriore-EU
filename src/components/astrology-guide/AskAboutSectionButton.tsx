import { MessageCircle } from "lucide-react";
import { useAstrologyGuide } from "./AstrologyGuideContext";
import { INCLUDED_FREE_CREDITS } from "./constants";
import { useI18n } from "@/i18n/I18nProvider";

interface AskAboutSectionButtonProps {
  sectionId: string;
  sectionLabel?: string;
}

const AskAboutSectionButton = ({ sectionId, sectionLabel }: AskAboutSectionButtonProps) => {
  const { open, credits } = useAstrologyGuide();
  const { m } = useI18n();
  const g = m.astrologyGuide.askButton;
  const totalGranted = credits?.total_granted ?? 0;
  const totalUsed = credits?.total_used ?? 0;
  const freeRemaining = Math.max(0, INCLUDED_FREE_CREDITS - totalUsed);
  const showFreeBadge = totalGranted > 0 && freeRemaining > 0;

  return (
    <button
      type="button"
      onClick={() => open({ sectionId, prefill: "" })}
      className="mt-3 inline-flex items-center gap-2 text-xs lg:text-sm text-muted-foreground hover:text-foreground border border-border/70 hover:border-border rounded-full px-3 lg:px-4 py-1.5 lg:py-2 transition"
    >
      <MessageCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
      <span>
        {sectionLabel ? g.deepen(sectionLabel) : g.deepenGeneric}
      </span>
      {showFreeBadge && (
        <span className="text-[10px] lg:text-xs uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
          {g.free}
        </span>
      )}
    </button>
  );
};

export default AskAboutSectionButton;
