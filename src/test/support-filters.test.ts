import { describe, it, expect } from "vitest";
// Pure helpers shared with the support edge functions (Deno). Imported here via
// a relative path because they live outside src/ but have no runtime deps.
import {
  isAutomatedSender,
  extractEmails,
  parseFromAddress,
  htmlToPlainText,
} from "../../supabase/functions/_shared/support-filters";

describe("isAutomatedSender", () => {
  it("flags no-reply / notification / bounce local parts", () => {
    expect(isAutomatedSender("no-reply@example.com").automated).toBe(true);
    expect(isAutomatedSender("noreply@example.com").automated).toBe(true);
    expect(isAutomatedSender("notifications@github.com").automated).toBe(true);
    expect(isAutomatedSender("bounces@news.example.com").automated).toBe(true);
    expect(isAutomatedSender("mailer-daemon@mx.google.com").automated).toBe(true);
  });

  it("flags payment-provider and infra domains", () => {
    expect(isAutomatedSender("receipts@stripe.com").automated).toBe(true);
    expect(isAutomatedSender("info@notify.stripe.com").automated).toBe(true);
    expect(isAutomatedSender("service@paypal.it").automated).toBe(true);
    expect(isAutomatedSender("noreply@e.paypal.com").automated).toBe(true);
  });

  it("flags our own brand domains", () => {
    expect(isAutomatedSender("info@codiceinteriore.it").automated).toBe(true);
    expect(isAutomatedSender("x@cartainterior.com").automated).toBe(true);
  });

  it("treats an empty/invalid sender as automated", () => {
    expect(isAutomatedSender("").automated).toBe(true);
    expect(isAutomatedSender("not-an-email").automated).toBe(true);
  });

  it("does NOT flag genuine customer addresses", () => {
    expect(isAutomatedSender("marco.rossi@gmail.com").automated).toBe(false);
    expect(isAutomatedSender("anna@outlook.it").automated).toBe(false);
    // "paypalish.com" must not match the paypal brand token
    expect(isAutomatedSender("hi@paypalish.com").automated).toBe(false);
  });
});

describe("extractEmails", () => {
  it("extracts and dedupes addresses, stripping trailing punctuation", () => {
    const out = extractEmails("Ho pagato con john@gmail.com e anche Anna@X.it. Grazie!");
    expect(out).toContain("john@gmail.com");
    expect(out).toContain("anna@x.it");
    expect(out.length).toBe(2);
  });
  it("returns [] for empty input", () => {
    expect(extractEmails("")).toEqual([]);
    expect(extractEmails(null)).toEqual([]);
  });
});

describe("parseFromAddress", () => {
  it("parses 'Name <email>'", () => {
    expect(parseFromAddress("Marco Rossi <Marco@Example.com>")).toEqual({
      name: "Marco Rossi",
      email: "marco@example.com",
    });
  });
  it("parses a bare address", () => {
    expect(parseFromAddress("bare@x.com")).toEqual({ name: null, email: "bare@x.com" });
  });
});

describe("htmlToPlainText", () => {
  it("converts block boundaries to newlines and strips tags", () => {
    expect(htmlToPlainText("<p>Ciao</p><p>come va?</p>")).toBe("Ciao\ncome va?");
  });
  it("drops style/script and decodes entities", () => {
    const html = "<style>.a{}</style><div>Tom &amp; Jerry &lt;3</div><script>x()</script>";
    expect(htmlToPlainText(html)).toBe("Tom & Jerry <3");
  });
});
