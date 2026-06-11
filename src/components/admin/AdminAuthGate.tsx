import { useState, type FormEvent, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isLovablePreview } from "@/lib/preview-mode";

interface AdminAuthGateProps {
  isAuthed: boolean;
  onLogin: (secret: string) => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

export default function AdminAuthGate({
  isAuthed,
  onLogin,
  title = "Area Admin",
  description = "Inserisci la password admin per accedere.",
  children,
}: AdminAuthGateProps) {
  const [secretInput, setSecretInput] = useState("");

  if (isLovablePreview()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 space-y-5 text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Anteprima Lovable: l'area admin è accessibile solo nel sito pubblicato.
          </p>
          <Button onClick={() => (window.location.href = "/")} className="w-full">
            Torna alla home
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    const handleLogin = (e: FormEvent) => {
      e.preventDefault();
      if (!secretInput.trim()) return;
      onLogin(secretInput.trim());
      setSecretInput("");
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 space-y-5"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="Password admin"
            autoFocus
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={!secretInput.trim()}>
            Accedi
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
