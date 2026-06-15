import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFunnelStage, getStoredSessionId } from "@/context/QuizContext";
import { Button } from "@/components/ui/button";
import { LogIn, User } from "lucide-react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useI18n } from "@/i18n/I18nProvider";

interface HeaderProps {
  backButton?: React.ReactNode;
}

const Header = ({ backButton }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuthReady();
  const { m, market } = useI18n();

  const handleLogoClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("quiz_session_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile?.quiz_session_id) {
          const { data: qs } = await supabase
            .from("quiz_sessions")
            .select("full_report")
            .eq("id", profile.quiz_session_id)
            .maybeSingle();

          if (qs?.full_report) {
            navigate("/report");
            return;
          }
        }
      }

      const stage = getFunnelStage();
      const storedSessionId = getStoredSessionId();
      if (storedSessionId && (stage === "teaser" || stage === "offer")) {
        navigate("/teaser");
        return;
      }

      navigate("/");
    } catch {
      navigate("/");
    }
  };

  return (
    <header className="container py-6 flex items-center gap-3">
      {backButton}
      <a
        href="/"
        aria-label={m.common.header.homeAria(market.siteName)}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          handleLogoClick();
        }}
      >
        <img src={market.logo} alt={market.siteName} className="h-8 cursor-pointer" />
      </a>
      <div className="ml-auto">
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            className="max-w-[220px] text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/report")}
          >
            <User className="h-4 w-4 mr-1.5 shrink-0" />
            <span className="truncate">{user.email || m.common.header.myReport}</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/activate")}
          >
            <LogIn className="h-4 w-4 mr-1.5" />
            {m.common.header.signIn}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
