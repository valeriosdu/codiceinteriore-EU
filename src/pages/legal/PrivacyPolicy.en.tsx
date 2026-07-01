// TODO: This is a US-framed English draft of the Privacy & Cookie Policy
// (CCPA/CPRA oriented, no GDPR articles). It must be reviewed by a US legal
// professional before launch — the categories of personal information, the list
// of consumer rights, "sale"/"sharing" disclosures, the right to opt out, and
// state-specific addenda (e.g. CPRA, VCDPA, CPA) all require verification.
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, SubSection, MailLink, SiteLink, privacyEmail } from "./LegalLayout";

const PrivacyPolicyEn = () => (
  <LegalPage
    seoTitle={`Privacy Policy & Cookie Policy — ${MARKET.siteName}`}
    seoDescription={`Notice describing how personal information of ${MARKET.siteName} website users is handled.`}
    path="/privacy"
    backAria="Back"
    heading="Privacy Policy & Cookie Policy"
    lastUpdated="Last updated: April 24, 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      This notice describes how personal information is handled for users who visit the website <SiteLink /> and use the
      services connected to the {MARKET.siteName} brand.
    </p>

    <Section title="1. Who is responsible">
      <p>The business responsible for this website and these services is:</p>
      <LegalEntityBox />
      <p>
        For any request relating to the handling of personal information, you can write to:{" "}
        <MailLink email={privacyEmail} />
      </p>
    </Section>

    <Section title="2. Scope">
      <p>This notice applies to the handling of personal information collected through:</p>
      <ul>
        <li>the {MARKET.siteName} website</li>
        <li>the quiz and data-collection pages</li>
        <li>the checkout and purchase pages</li>
        <li>any contact forms</li>
        <li>operational emails, weekly content, and marketing communications</li>
        <li>any user area connected to the service</li>
      </ul>
    </Section>

    <Section title="3. Categories of personal information we handle">
      <p>We may handle the following categories of personal information:</p>
      <SubSection title="a) Identifiers and contact information">
        <ul>
          <li>name</li>
          <li>email address</li>
        </ul>
      </SubSection>
      <SubSection title="b) Information you provide to deliver the service">
        <ul>
          <li>date of birth</li>
          <li>time of birth</li>
          <li>place of birth</li>
          <li>quiz responses</li>
          <li>any content submitted through support requests or contact forms</li>
        </ul>
      </SubSection>
      <SubSection title="c) Commercial / purchase information">
        <ul>
          <li>purchase history</li>
          <li>payment status information</li>
          <li>transaction identifiers provided by payment processors</li>
        </ul>
        <p className="text-sm text-muted-foreground italic mt-2">
          Note: full payment card details are not handled directly by the business but by the payment providers used.
        </p>
      </SubSection>
      <SubSection title="d) Internet / technical and usage information">
        <ul>
          <li>IP address</li>
          <li>technical logs</li>
          <li>browser, device, and operating-system information</li>
          <li>information collected through cookies or similar technologies</li>
        </ul>
      </SubSection>
      <SubSection title="e) Marketing and tracking information">
        <ul>
          <li>information collected through analytics tools</li>
          <li>information collected through cookies and marketing pixels, including remarketing tools</li>
        </ul>
      </SubSection>
    </Section>

    <Section title="4. How we use personal information">
      <p>Personal information may be used for the following business purposes:</p>
      <ul>
        <li>delivering the personalized astrological report</li>
        <li>delivering weekly content, recurring services, or subscriptions</li>
        <li>managing the user account, where available</li>
        <li>handling checkout, payments, and order history</li>
        <li>
          sending operational communications, such as order confirmations, content access, support, and service
          notifications
        </li>
        <li>handling requests sent by email or contact form</li>
        <li>sending newsletters and promotional communications</li>
        <li>statistical analysis of website usage</li>
        <li>remarketing, retargeting, and measuring advertising campaigns</li>
        <li>protecting the security of the website, preventing abuse, and technical systems management</li>
      </ul>
    </Section>

    <Section title="5. Whether providing information is required">
      <p>Providing information marked as necessary is required when such information is needed to:</p>
      <ul>
        <li>generate the requested report</li>
        <li>process a purchase</li>
        <li>create or administer the account</li>
        <li>provide support</li>
        <li>send operational communications</li>
      </ul>
      <p>Failing to provide such information may make it impossible to deliver the service.</p>
      <p>
        Providing information for marketing purposes or for non-essential cookies is optional. Declining does not prevent
        you from browsing the website or purchasing the base service, subject to strictly necessary technical limits.
      </p>
    </Section>

    <Section title="6. How information is handled">
      <p>
        Information is handled using digital and organizational tools appropriate to its nature, following principles of
        lawfulness, fairness, transparency, data minimization, and storage limitation.
      </p>
    </Section>

    <Section title="7. Recipients and service providers">
      <p>
        Information may be disclosed to or made accessible to parties acting, depending on the case, as service
        providers, independent businesses, or authorized personnel.
      </p>
      <p>In particular, information may be handled through the following providers or categories of providers:</p>
      <ul>
        <li>hosting and infrastructure/frontend providers</li>
        <li>Supabase for database and application infrastructure</li>
        <li>Stripe and PayPal for payment processing</li>
        <li>Google for technology services and, where applicable, processing through external AI models</li>
        <li>FreeAstroAPI for the astrological data processing required by the service</li>
        <li>Meta for advertising tools, pixels, and remarketing</li>
        <li>Google Analytics for statistical analysis of website traffic</li>
        <li>any email delivery, technical support, and operations providers connected to the services</li>
      </ul>
      <p>These parties handle the information only as necessary to provide their respective services.</p>
    </Section>

    <Section title="8. Handling through AI providers and external services">
      <p>
        To deliver certain features of the service, the information you enter in the quiz and the data needed to generate
        the content may be sent to external technology providers, including Google AI services and external astrological
        services.
      </p>
      <p>
        We apply a minimization approach: only the information necessary to generate the requested content or perform the
        intended technical function is transmitted to external providers.
      </p>
    </Section>

    <Section title="9. Sale and sharing of personal information">
      <p>
        We do not sell your personal information for money. Certain uses of advertising cookies, pixels, and similar
        tracking technologies (for example, for cross-context behavioral advertising or remarketing) may be considered a
        "sale" or "sharing" of personal information under certain US state privacy laws such as the California Consumer
        Privacy Act (CCPA), as amended by the CPRA.
      </p>
      <p>
        Where applicable, you have the right to opt out of such "sale" or "sharing." You can exercise this right by
        adjusting your cookie preferences on the website (where such controls are provided), by using browser-based
        opt-out signals (such as Global Privacy Control) where supported, or by contacting{" "}
        <MailLink email={privacyEmail} />.
      </p>
      <p>We do not knowingly sell or share the personal information of consumers we know to be under 16 years of age.</p>
    </Section>

    <Section title="10. Cross-border data transfers">
      <p>
        Some technology providers we use may be located in, or handle information in, countries other than your country
        of residence, including the United States or other jurisdictions.
      </p>
      <p>
        Where applicable, such transfers are carried out in accordance with the safeguards required by applicable law.
        For more information about any transfers and the related safeguards, you can write to{" "}
        <MailLink email={privacyEmail} />.
      </p>
    </Section>

    <Section title="11. Data retention">
      <p>
        Unless a longer retention period is required by law, personal information is retained for no longer than
        necessary for the purposes for which it was collected.
      </p>
      <p>In general:</p>
      <ul>
        <li>
          information related to contact requests may be retained for as long as necessary to handle the request and for
          a reasonable subsequent administrative period
        </li>
        <li>
          information related to purchases and the contractual relationship may be retained for the duration of the
          relationship and afterwards for as long as needed to meet tax, administrative, or legal-defense obligations
        </li>
        <li>information used for marketing communications is retained until you withdraw consent or opt out</li>
        <li>
          technical and log information is retained for the period strictly necessary to ensure the functioning,
          security, and analysis of the systems
        </li>
        <li>
          information related to analytics and cookies depends on the settings of the relevant tool and the preferences
          you express
        </li>
      </ul>
    </Section>

    <Section title="12. Cookie Policy">
      <p>
        This website uses cookies and similar technologies to ensure the proper functioning of the pages, analyze
        traffic, improve the user experience and, where consent is required, measure advertising campaigns and carry out
        remarketing.
      </p>
      <SubSection title="12.1 What cookies are">
        <p>
          Cookies are small text files that websites send to your device while browsing. They can be stored and then
          sent back to the same sites on your next visit.
        </p>
        <p>
          Similar technologies, such as pixels, tags, scripts, or identifiers, can perform analogous functions of
          collecting or transmitting information.
        </p>
      </SubSection>
      <SubSection title="12.2 Types of cookies used">
        <p>The website may use the following categories of cookies:</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">a) Strictly necessary cookies</h4>
        <p>These enable the website to function and deliver essential features, for example:</p>
        <ul>
          <li>navigation between pages</li>
          <li>session management</li>
          <li>website security</li>
          <li>storage of technical preferences</li>
          <li>proper functioning of checkout or essential components</li>
        </ul>
        <p>These cookies do not normally require your consent.</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">b) Analytics cookies</h4>
        <p>These collect statistical information about website usage, for example:</p>
        <ul>
          <li>number of visitors</li>
          <li>pages visited</li>
          <li>traffic source</li>
          <li>browsing behavior</li>
          <li>page performance</li>
        </ul>
        <p>
          The website may use analytics tools such as Google Analytics. You can manage these through your cookie
          preferences where such controls are provided.
        </p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">c) Marketing, profiling, and remarketing cookies</h4>
        <p>These are used to:</p>
        <ul>
          <li>measure the effectiveness of advertising campaigns</li>
          <li>build custom audiences</li>
          <li>show ads consistent with browsing behavior</li>
          <li>carry out remarketing and retargeting</li>
        </ul>
        <p>
          This category may include tools such as the Meta Pixel and other advertising scripts or tags. These cookies
          are not necessary for the website to function, and certain uses may constitute a "sale" or "sharing" of
          personal information under applicable US state privacy laws (see Section 9).
        </p>
      </SubSection>
      <SubSection title="12.3 First-party and third-party cookies">
        <p>The website may use:</p>
        <ul>
          <li>first-party cookies, installed directly by the website</li>
          <li>
            third-party cookies, installed through services provided by external parties such as Google, Meta, Stripe,
            PayPal, or other technical providers
          </li>
        </ul>
        <p>
          Information collected by third-party cookies is also governed by the privacy notices of the respective
          providers.
        </p>
      </SubSection>
      <SubSection title="12.4 Managing your cookie preferences">
        <p>Where provided, on your first visit to the website you can:</p>
        <ul>
          <li>accept all non-essential cookies</li>
          <li>reject non-essential cookies</li>
          <li>select your preferences</li>
        </ul>
        <p>
          You can change or withdraw your preferences at any time through the tools provided on the website, if any, or
          through your browser settings, noting that blocking some cookies may affect the functioning of certain
          non-essential features.
        </p>
      </SubSection>
      <SubSection title="12.5 Browser controls">
        <p>
          You can also manage or disable cookies through your browser settings. Disabling strictly necessary cookies may,
          however, impair the proper functioning of the website or parts of it.
        </p>
      </SubSection>
      <SubSection title="12.6 Cookie retention">
        <p>The duration of cookies may vary:</p>
        <ul>
          <li>some are automatically deleted when the browser is closed</li>
          <li>others remain stored for a longer period, defined by the individual provider or the website configuration</li>
        </ul>
        <p>
          The actual duration may also depend on browser policies, your preferences, and the third-party providers used.
        </p>
      </SubSection>
    </Section>

    <Section title="13. Your privacy rights">
      <p>
        Depending on your state of residence and applicable law (for example, the CCPA/CPRA in California), you may have
        the right to:
      </p>
      <ul>
        <li>know and access the personal information we have collected about you</li>
        <li>request correction of inaccurate personal information</li>
        <li>request deletion of your personal information</li>
        <li>request a portable copy of your personal information, where applicable</li>
        <li>opt out of the "sale" or "sharing" of your personal information and of certain targeted advertising</li>
        <li>limit the use of sensitive personal information, where applicable</li>
        <li>not be subjected to unlawful discrimination for exercising your privacy rights</li>
      </ul>
      <p>
        To exercise your rights, you can write to: <MailLink email={privacyEmail} />. We will verify your request as
        required by applicable law before responding. You may also use an authorized agent to submit a request on your
        behalf where permitted by law.
      </p>
    </Section>

    <Section title="14. Minors">
      <p>
        The service is not intended for individuals under the age of 18. The business asks that you not use the website
        or submit personal information if you are not of legal age or otherwise lack the capacity to validly provide
        consent under applicable law. We do not knowingly collect personal information from children.
      </p>
    </Section>

    <Section title="15. Changes to this notice">
      <p>
        The business reserves the right to update or modify this notice at any time. The updated version will be
        published on this page with the date of the last update indicated.
      </p>
    </Section>
  </LegalPage>
);

export default PrivacyPolicyEn;
