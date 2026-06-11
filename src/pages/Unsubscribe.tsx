import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "valid" | "already" | "confirming" | "done" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("confirming");
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (data?.success) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Verifica in corso…</p>
          </>
        )}

        {status === "valid" && (
          <>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Cancellazione iscrizione
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Confermi di voler annullare l'iscrizione alle email di Codice Interiore?
            </p>
            <Button variant="premium" size="hero" className="w-full" onClick={handleConfirm}>
              Conferma cancellazione
            </Button>
          </>
        )}

        {status === "confirming" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Elaborazione…</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Iscrizione annullata
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Non riceverai più email da Codice Interiore.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Già cancellato
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La tua iscrizione è già stata annullata in precedenza.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Link non valido
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Questo link di cancellazione non è valido o è scaduto.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Unsubscribe;
