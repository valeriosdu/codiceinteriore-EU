import { useRef, useState } from "react";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import type { AstrologyGuideQuestion } from "./AstrologyGuideContext";
import { useAstrologyGuide } from "./AstrologyGuideContext";

interface AstrologyGuideMessageProps {
  question: AstrologyGuideQuestion;
}

const formatRomeTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const sameDay =
    new Date().toDateString() === date.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });
  }
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
};

const AstrologyGuideMessage = ({ question }: AstrologyGuideMessageProps) => {
  const { submitFeedback } = useAstrologyGuide();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState(question.feedback_comment ?? "");
  const [commentSaved, setCommentSaved] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const handleThumbDown = () => {
    submitFeedback(question.id, "down");
    if (!question.feedback_comment) {
      setShowCommentBox(true);
      setTimeout(() => commentRef.current?.focus(), 50);
    }
  };

  const handleCommentSubmit = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    submitFeedback(question.id, "down", trimmed);
    setShowCommentBox(false);
    setCommentSaved(true);
  };

  const isPending =
    question.status === "pending" ||
    question.status === "processing" ||
    question.status === "ready";
  const isFailed = question.status === "failed";
  const isCompleted = question.status === "completed";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-3 text-base text-foreground">
          {question.question}
        </div>
      </div>

      {isCompleted && question.answer ? (
        <div className="flex justify-start">
          <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-base text-foreground/90 leading-relaxed border border-border/40 space-y-2">
            {question.answer.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="flex items-center gap-1 pt-1.5">
              {question.processed_at && (
                <span className="text-xs text-muted-foreground/70 mr-auto">
                  {formatRomeTime(question.processed_at)}
                </span>
              )}
              <button
                type="button"
                onClick={() => submitFeedback(question.id, "up")}
                aria-label="Risposta utile"
                className={`p-1.5 rounded transition ${
                  question.feedback === "up"
                    ? "text-primary"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleThumbDown}
                aria-label="Risposta non utile"
                className={`p-1.5 rounded transition ${
                  question.feedback === "down"
                    ? "text-destructive"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
            {showCommentBox && (
              <div className="flex gap-1.5 pt-1">
                <textarea
                  ref={commentRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 200))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  placeholder="Cosa non ti è piaciuto?"
                  rows={2}
                  maxLength={200}
                  className="flex-1 resize-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim()}
                  className="self-end text-xs text-primary font-medium px-2 py-1.5 rounded hover:bg-primary/5 transition disabled:opacity-40"
                >
                  Invia
                </button>
              </div>
            )}
            {commentSaved && !showCommentBox && (
              <p className="text-[11px] text-muted-foreground/60 pt-0.5">
                Grazie per il feedback.
              </p>
            )}
          </div>
        </div>
      ) : isPending ? (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-base text-muted-foreground border border-dashed border-border/60">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary/70" />
              <span>
                Risposta in arrivo nelle prossime ore.
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Ti avviseremo anche via email.
            </p>
          </div>
        </div>
      ) : isFailed ? (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-destructive/5 px-4 py-3 text-base text-destructive border border-destructive/20">
            Non siamo riusciti a generare la risposta. La tua domanda è stata accreditata di
            nuovo, puoi riprovare.
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AstrologyGuideMessage;
