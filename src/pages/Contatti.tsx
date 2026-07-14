import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { contactPageJsonLd } from "@/lib/seo-jsonld";
import { ROUTES } from "@/lib/routes";
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
import { useI18n } from "@/i18n/I18nProvider";
import type { Messages } from "@/i18n";
import { useMemo } from "react";

const makeContactSchema = (v: Messages["legal"]["contact"]["validation"]) =>
  z.object({
    name: z.string().trim().min(1, v.name).max(100),
    email: z.string().trim().email(v.email).max(255),
    message: z.string().trim().min(1, v.message).max(5000),
    reason: z.string().optional(),
  });

type ContactFormData = z.infer<ReturnType<typeof makeContactSchema>>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const Contatti = () => {
  const { m, market } = useI18n();
  const c = m.legal.contact;
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const contactSchema = useMemo(() => makeContactSchema(c.validation), [c.validation]);

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
          market: market.id,
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
            market: market.id,
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
        title={c.seoTitle(market.siteName)}
        description={c.seoDescription(market.contactEmail)}
        path={ROUTES.contact}
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
            {c.kicker}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
            {c.title}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
            {c.subtitle}
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
          {c.intro}
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
              <p className="text-foreground font-medium text-lg">{c.sent}</p>
              <p className="text-muted-foreground text-sm">{c.sentSub}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setStatus("idle")}
              >
                {c.sendAnother}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                  {c.nameLabel}
                </Label>
                <Input
                  id="name"
                  placeholder={c.namePlaceholder}
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
                  {c.emailLabel}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={c.emailPlaceholder}
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
                  {c.reasonLabel}
                </Label>
                <Select onValueChange={(val) => setValue("reason", val)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={c.reasonPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={c.reasons.purchase}>{c.reasons.purchase}</SelectItem>
                    <SelectItem value={c.reasons.report}>{c.reasons.report}</SelectItem>
                    <SelectItem value={c.reasons.general}>{c.reasons.general}</SelectItem>
                    <SelectItem value={c.reasons.collab}>{c.reasons.collab}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messaggio */}
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                  {c.messageLabel}
                </Label>
                <Textarea
                  id="message"
                  placeholder={c.messagePlaceholder}
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
                  <span>{c.error}</span>
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
                    {c.sending}
                  </>
                ) : (
                  c.send
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
            {c.otherTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-1">
            {c.otherSub}
          </p>
          <a
            href={`mailto:${market.contactEmail}`}
            className="text-sm text-primary hover:underline underline-offset-4 transition-colors"
          >
            {market.contactEmail}
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
          {c.privacyNote}
        </motion.p>
      </main>

      <Footer />
    </div>
  );
};

export default Contatti;
