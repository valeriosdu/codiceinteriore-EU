import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

type Rating = "positive" | "mixed" | "negative";
type Source = "web" | "pdf";

interface ReportFeedbackProps {
  quizSessionId: string | null;
  source?: Source;
}

const RATING_EMOJI: Record<Rating, string> = {
  positive: "😍",
  mixed: "🤔",
  negative: "😐",
};

type Phase = "rating" | "details" | "done";

const describeError = (err: unknown, unknownLabel: string): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts: string[] = [];
    if (typeof e.message === "string" && e.message) parts.push(e.message);
    if (typeof e.details === "string" && e.details) parts.push(e.details);
    if (typeof e.hint === "string" && e.hint) parts.push(e.hint);
    if (typeof e.code === "string" && e.code) parts.push(`code ${e.code}`);
    if (parts.length > 0) return parts.join(" · ");
    try {
      return JSON.stringify(err);
    } catch {
      return unknownLabel;
    }
  }
  return unknownLabel;
};

const ReportFeedback = ({ quizSessionId, source = "web" }: ReportFeedbackProps) => {
  const { m } = useI18n();
  const fb = m.feedback;
  const RATING_OPTIONS: { value: Rating; emoji: string; label: string }[] = [
    { value: "positive", emoji: RATING_EMOJI.positive, label: fb.ratings.positive },
    { value: "mixed", emoji: RATING_EMOJI.mixed, label: fb.ratings.mixed },
    { value: "negative", emoji: RATING_EMOJI.negative, label: fb.ratings.negative },
  ];
  const REASONS_BY_RATING: Record<Rating, string[]> = fb.reasons;
  const [phase, setPhase] = useState<Phase>("rating");
  const [rating, setRating] = useState<Rating | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const profileIdRef = useRef<string | null>(null);

  const reasonChips = useMemo(() => (rating ? REASONS_BY_RATING[rating] : []), [rating]);

  const ensureProfileId = async (): Promise<string | null> => {
    if (profileIdRef.current) return profileIdRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
    profileIdRef.current = profile?.id || null;
    return profileIdRef.current;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await ensureProfileId();
        if (cancelled) return;
        profileIdRef.current = id;
      } catch (err) {
        console.error("[report-feedback] profile preload failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRatingClick = async (value: Rating) => {
    if (submitting || !quizSessionId) return;
    setRating(value);
    setSubmitting(true);
    try {
      const profileId = await ensureProfileId();
      if (!profileId) {
        toast.error(fb.errors.signInRequired);
        setRating(null);
        return;
      }
      const { data, error } = await (
        supabase as unknown as {
          from: (t: string) => {
            upsert: (
              v: Record<string, unknown>,
              o: { onConflict: string },
            ) => {
              select: (s: string) => {
                single: () => Promise<{
                  data: { id: string } | null;
                  error: { message: string; code?: string } | null;
                }>;
              };
            };
          };
        }
      )
        .from("report_feedback")
        .upsert(
          {
            profile_id: profileId,
            quiz_session_id: quizSessionId,
            rating: value,
            source,
          },
          { onConflict: "profile_id,quiz_session_id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      setFeedbackId(data?.id || null);
      setPhase("details");
    } catch (err) {
      console.error("[report-feedback] rating save failed", err);
      toast.error(fb.errors.saveRating(describeError(err, fb.errors.unknown)));
      setRating(null);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReason = (reason: string) => {
    setReasons((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
  };

  const handleSubmitDetails = async () => {
    if (submitting || !feedbackId) return;
    setSubmitting(true);
    try {
      const { error } = await (
        supabase as unknown as {
          from: (t: string) => {
            update: (v: Record<string, unknown>) => {
              eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
            };
          };
        }
      )
        .from("report_feedback")
        .update({ reasons, comment: comment.trim() || null })
        .eq("id", feedbackId);
      if (error) throw error;
      setPhase("done");
    } catch (err) {
      console.error("[report-feedback] details save failed", err);
      toast.error(fb.errors.saveDetails(describeError(err, fb.errors.unknown)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => setPhase("done");

  return (
    <div id="feedback" className="scroll-mt-28">
      <div className="rounded-2xl border border-border/60 bg-surface px-6 py-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{fb.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {fb.subtitle}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {phase === "rating" && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-2"
            >
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRatingClick(opt.value)}
                  disabled={submitting}
                  className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background px-3 py-3 transition-colors hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="text-2xl leading-none">{opt.emoji}</span>
                  <span className="text-xs font-medium text-foreground text-center">{opt.label}</span>
                </button>
              ))}
            </motion.div>
          )}

          {phase === "details" && rating && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {fb.thanksMore}
              </div>

              <div className="flex flex-wrap gap-2">
                {reasonChips.map((reason) => {
                  const active = reasons.includes(reason);
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => toggleReason(reason)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={fb.commentPlaceholder}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
              />

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={handleSkip} disabled={submitting}>
                  {fb.skip}
                </Button>
                <Button size="sm" onClick={handleSubmitDetails} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  {fb.send}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {fb.done}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportFeedback;
