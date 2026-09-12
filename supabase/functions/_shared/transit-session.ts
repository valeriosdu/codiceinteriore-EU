// A quale lettura appartiene un abbonamento ai transiti.
//
// Un abbonamento copre UNA lettura: entitlement e cicli nascono con il suo
// quiz_session_id e i transiti sono calcolati sulla carta natale di quella
// sessione. Prima il checkout la sceglieva da solo — la piu' recente del
// profilo — quindi chi ne aveva due si ritrovava i transiti sulla lettura
// sbagliata e nessun modo di comprarli per l'altra.
//
// Ora il client manda la lettura che il cliente sta guardando. Non e' un dato
// fidato: viene accettato solo se e' davvero una delle letture pagate di quel
// profilo, altrimenti si ricade sul vecchio comportamento. Il market continua
// a leggersi dalla riga quiz_sessions, mai dal body.

type SupabaseAdminClient = { from: (table: string) => any };

export async function resolveTransitQuizSession(
  supabaseAdmin: SupabaseAdminClient,
  profileId: string,
  profileQuizSessionId: string | null,
  requestedQuizSessionId: unknown,
): Promise<string | null> {
  const { data: reports } = await supabaseAdmin
    .from("user_reports")
    .select("quiz_session_id, is_active, created_at")
    .eq("profile_id", profileId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (reports || []) as Array<{ quiz_session_id: string | null }>;
  const owned = new Set(rows.map((r) => r.quiz_session_id).filter(Boolean) as string[]);
  if (profileQuizSessionId) owned.add(profileQuizSessionId);

  const requested = typeof requestedQuizSessionId === "string" ? requestedQuizSessionId.trim() : "";
  if (requested && owned.has(requested)) return requested;
  if (requested) {
    console.warn(
      `[transit-session] quiz session ${requested} non appartiene al profilo ${profileId}; uso la piu' recente`,
    );
  }

  return rows[0]?.quiz_session_id || profileQuizSessionId || null;
}

// Un abbonamento attivo per lettura: un secondo sulla stessa addebiterebbe due
// volte lo stesso mese. Su un'altra lettura e' invece legittimo.
export async function findActiveTransitSubscription(
  supabaseAdmin: SupabaseAdminClient,
  profileId: string,
  quizSessionId: string,
): Promise<{ id: string; status: string } | null> {
  const { data } = await supabaseAdmin
    .from("transit_subscriptions")
    .select("id, status")
    .eq("profile_id", profileId)
    .eq("quiz_session_id", quizSessionId)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle();
  return (data as { id: string; status: string } | null) || null;
}
