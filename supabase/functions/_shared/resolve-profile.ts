// Risolve un profilo a partire da un'email, con fallback.
// 1. Match diretto su profiles.email
// 2. Se non trovato, cerca in checkout_sessions un checkout gia
//    claimato con quella customer_email e usa il profilo collegato.

type SupabaseClient = { from: (table: string) => any };

export async function resolveProfileByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<{ id: string; email: string } | null> {
  const { data: direct } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();
  if (direct?.id) return direct;

  const { data: checkout } = await supabase
    .from("checkout_sessions")
    .select("claimed_profile_id")
    .ilike("customer_email", email)
    .not("claimed_profile_id", "is", null)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkout?.claimed_profile_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", checkout.claimed_profile_id)
      .single();
    if (profile?.id) return profile;
  }

  return null;
}
