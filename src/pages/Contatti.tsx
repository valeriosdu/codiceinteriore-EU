import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { contactPageJsonLd } from "@/lib/seo-jsonld";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Inserisci il tuo nome").max(100),
  email: z.string().trim().email("Inserisci un'email valida").max(255),
  message: z.string().trim().min(1, "Scrivi un messaggio").max(5000),
  reason: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const Contatti = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus("loading");
    try {
      const id = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from("contact_submissions")
        .insert({
          id,
          name: data.name,
          email: data.email,
          message: data.message,
          reason: data.reason || null,
        });

      if (insertError) throw insertError;

      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-notification",
          recipientEmail: data.email,
          idempotencyKey: `contact-${id}`,
          templateData: {
            name: data.name,
            email: data.email,
            reason: data.reason,
            message: data.message,
          },
        },
      });

      setStatus("success");
      reset();
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Contatti — Codice Interiore"
        description="Hai una domanda sul tema natale, sul report o sull'accesso alla tua area personale? Scrivici dal modulo o invia un'email a info@codiceinteriore.it."
        path="/contatti"
        jsonLd={contactPageJsonLd()}
      />
      <Header />

      <main className="flex-1 container max-w-xl mx-auto px-5 pb-20">
        {/* Hero */}
        <motion.div
          className="pt-12 pb-10 text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3 font-medium">
            Contatti
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Scrivici
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
            Per domande, supporto o richieste, puoi contattarci qui. Ti risponderemo il prima possibile.
          </p>
        </motion.div>

        {/* Intro */}
        <motion.p
          className="text-sm text-muted-foreground leading-relaxed mb-10 text-center max-w-md mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          Se hai un dubbio sul report, sull'accesso alla tua area personale o sul funzionamento del servizio, puoi scriverci direttamente tramite il modulo qui sotto.
        </motion.p>

        {/* Form */}
        <motion.div
          className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          {status === "success" ? (
            <div className="flex flex-col items-center py-10 text-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-foreground font-medium text-lg">Messaggio inviato.</p>
              <p className="text-muted-foreground text-sm">Ti risponderemo appena possibile.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setStatus("idle")}
              >
                Invia un altro messaggio
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                  Nome *
                </Label>
                <Input
                  id="name"
                  placeholder="Il tuo nome"
                  {...register("name")}
                  className="bg-background"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="La tua email"
                  {...register("email")}
                  className="bg-background"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Motivo */}
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                  Motivo del contatto
                </Label>
                <Select onValueChange={(val) => setValue("reason", val)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleziona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Supporto acquisto">Supporto acquisto</SelectItem>
                    <SelectItem value="Accesso al report">Accesso al report</SelectItem>
                    <SelectItem value="Domanda generale">Domanda generale</SelectItem>
                    <SelectItem value="Collaborazioni">Collaborazioni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messaggio */}
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                  Messaggio *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Scrivi qui il tuo messaggio…"
                  rows={5}
                  {...register("message")}
                  className="bg-background resize-none"
                />
                {errors.message && (
                  <p className="text-xs text-destructive">{errors.message.message}</p>
                )}
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Si è verificato un problema. Riprova tra poco.</span>
                </div>
              )}

              <Button
                type="submit"
                variant="premium"
                size="quiz"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Invio in corso…
                  </>
                ) : (
                  "Invia messaggio"
                )}
              </Button>
            </form>
          )}
        </motion.div>

        {/* Secondary contact */}
        <motion.div
          className="mt-12 text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <h2 className="font-serif text-lg font-semibold text-foreground mb-2">
            Altri contatti
          </h2>
          <p className="text-sm text-muted-foreground mb-1">
            Se preferisci, puoi contattarci anche via email.
          </p>
          <a
            href="mailto:info@codiceinteriore.it"
            className="text-sm text-primary hover:underline underline-offset-4 transition-colors"
          >
            info@codiceinteriore.it
          </a>
        </motion.div>

        {/* Privacy note */}
        <motion.p
          className="text-[11px] text-muted-foreground text-center mt-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
        >
          I tuoi dati verranno usati solo per rispondere alla tua richiesta.
        </motion.p>
      </main>

      <Footer />
    </div>
  );
};

export default Contatti;
