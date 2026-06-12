import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAstrologyGuide } from "./AstrologyGuideContext";
import { useI18n } from "@/i18n/I18nProvider";

const AstrologyGuideComposer = () => {
  const { m } = useI18n();
  const g = m.astrologyGuide;
  const chipsForSection = (sectionId: string | null): string[] => {
    if (!sectionId) return g.composer.genericChips;
    return g.composer.sectionChips[sectionId] || g.composer.genericChips;
  };
  const {
    credits,
    questions,
    submitting,
    submitQuestion,
    pendingPrefill,
    pendingSectionId,
    consumePendingPrefill,
    consumePendingSection,
  } = useAstrologyGuide();

  const [text, setText] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const balance = credits?.balance ?? 0;
  const noCredits = balance <= 0;
  const hasMessages = questions.length > 0;

  // When a section button opens the widget, prefill if requested.
  useEffect(() => {
    if (pendingPrefill !== null && pendingPrefill !== undefined) {
      setText(pendingPrefill);
      consumePendingPrefill();
    }
    if (pendingSectionId !== null && pendingSectionId !== undefined) {
      setActiveSectionId(pendingSectionId);
      // Don't consume yet — we want it to influence chips.
      // It'll be consumed on submit.
    }
  }, [pendingPrefill, pendingSectionId, consumePendingPrefill]);

  // Autofocus rules:
  //   - Mobile (≤640px): never autofocus, so the on-screen keyboard never
  //     pops up unexpectedly and covers the panel content.
  //   - Desktop: autofocus when there's intent or an ongoing thread.
  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    if (isMobile) return;
    const cameFromSectionButton = pendingSectionId !== null;
    const shouldFocus = !noCredits && (hasMessages || cameFromSectionButton);
    if (shouldFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [noCredits, hasMessages, pendingSectionId]);

  const send = async () => {
    const value = text.trim();
    if (!value || submitting) return;
    const sectionId = activeSectionId ?? consumePendingSection();
    const result = await submitQuestion(value, sectionId);
    if (result.success) {
      setText("");
      setActiveSectionId(null);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const chips = chipsForSection(activeSectionId);

  if (noCredits) return null;

  return (
    <div className="border-t border-border/60 bg-background p-3 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setText(chip)}
            disabled={submitting}
            className="text-base border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary px-4 py-2 rounded-full transition disabled:opacity-50 leading-snug text-left"
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 250))}
          onKeyDown={handleKey}
          placeholder={g.composer.placeholder}
          rows={2}
          maxLength={250}
          disabled={submitting}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
        <Button
          type="button"
          onClick={send}
          disabled={!text.trim() || submitting}
          className="gap-1.5 shrink-0"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          {g.composer.send}
        </Button>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground/80">
        <span className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          {g.composer.remaining(balance)}
        </span>
        <span>{text.length}/250</span>
      </div>
    </div>
  );
};

export default AstrologyGuideComposer;
