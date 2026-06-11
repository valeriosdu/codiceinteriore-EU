import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthReadyState = {
  isReady: boolean;
  session: Session | null;
  user: User | null;
};

export const useAuthReady = () => {
  const [state, setState] = useState<AuthReadyState>({
    isReady: false,
    session: null,
    user: null,
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({
        isReady: true,
        session: data.session,
        user: data.session?.user ?? null,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({
        isReady: true,
        session,
        user: session?.user ?? null,
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
};
