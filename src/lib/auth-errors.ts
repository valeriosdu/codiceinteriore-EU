// Supabase Auth restituisce i suoi errori in inglese e non localizzabili
// ("Invalid login credentials", "User already registered", …). Mostrarli così
// com'è significa dare a un cliente olandese o spagnolo un messaggio in una
// lingua che non ha scelto, proprio nel momento in cui è bloccato fuori dal
// suo report — cioè quando è più probabile che scriva al supporto.
//
// Qui i messaggi noti vengono classificati su una chiave stabile e tradotti
// dai cataloghi. Tutto ciò che non è riconosciuto ricade sul generico
// `authError`: mai il testo grezzo del server.

export type AuthErrorKey =
  | "wrongCredentials"
  | "alreadyRegistered"
  | "passwordTooShort"
  | "passwordSameAsOld"
  | "tooManyAttempts"
  | "generic";

/** Le stringhe servite dal catalogo `activate.toasts`. */
export interface AuthErrorStrings {
  wrongCredentials: string;
  alreadyRegistered: string;
  passwordTooShort: string;
  passwordSameAsOld: string;
  tooManyAttempts: string;
  authError: string;
}

// Sottostringhe (minuscole) dei messaggi GoTrue. Volutamente larghe: Supabase
// riformula i testi fra le versioni, quindi si aggancia al nucleo semantico e
// non alla frase intera.
const PATTERNS: ReadonlyArray<readonly [AuthErrorKey, readonly string[]]> = [
  ["wrongCredentials", ["invalid login credentials", "invalid credentials", "invalid email or password"]],
  ["alreadyRegistered", ["already registered", "already been registered", "already exists"]],
  ["passwordSameAsOld", ["different from the old password", "should be different from"]],
  ["passwordTooShort", ["password should be at least", "password is too short"]],
  ["tooManyAttempts", ["rate limit", "you can only request this after", "too many requests"]],
];

export function classifyAuthError(raw: string | null | undefined): AuthErrorKey {
  const text = (raw || "").toLowerCase();
  if (!text) return "generic";
  for (const [key, needles] of PATTERNS) {
    if (needles.some((needle) => text.includes(needle))) return key;
  }
  return "generic";
}

export function authErrorMessage(
  raw: string | null | undefined,
  t: AuthErrorStrings,
): string {
  const key = classifyAuthError(raw);
  return key === "generic" ? t.authError : t[key];
}
