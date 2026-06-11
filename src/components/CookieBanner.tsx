import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "ci_cookie_consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = (choice: "accepted" | "rejected" | "dismissed") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Informativa sui cookie"
      className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="relative rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-lg p-4 pr-9">
        <button
          onClick={() => dismiss("dismissed")}
          aria-label="Chiudi"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm text-foreground/85 leading-relaxed">
          Usiamo cookie tecnici e di misurazione per migliorare la tua
          esperienza.{" "}
          <a
            href="/privacy"
            className="text-primary underline-offset-4 hover:underline"
          >
            Maggiori informazioni
          </a>
          .
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-8 px-2"
            onClick={() => dismiss("rejected")}
          >
            Rifiuta
          </Button>
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={() => dismiss("accepted")}
          >
            Accetta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
