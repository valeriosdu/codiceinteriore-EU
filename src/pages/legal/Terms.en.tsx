// TODO: This is a US-framed English draft of the Terms of Service. It must be
// reviewed by a US legal professional before launch (state-law compliance,
// arbitration/class-action waiver, governing law, consumer-protection and
// auto-renewal disclosure requirements vary by state).
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, MailLink, SiteLink, infoEmail } from "./LegalLayout";

const TermsEn = () => (
  <LegalPage
    seoTitle={`Terms of Service — ${MARKET.siteName}`}
    seoDescription={`Terms of Service governing the use of ${MARKET.siteName} and the digital services offered.`}
    path="/termini"
    backAria="Back"
    heading="Terms of Service"
    lastUpdated="Last updated: April 24, 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-4">
      These Terms of Service govern your access to and use of the website <SiteLink /> and your purchase of the digital
      services offered under the {MARKET.siteName} brand.
    </p>
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      By accessing the website or purchasing any service, you represent that you have read, understood, and agree to be
      bound by these Terms of Service.
    </p>

    <Section title="1. Service provider">
      <p>The service is provided by:</p>
      <LegalEntityBox />
      <p>
        Commercial brand used on the website: <strong>{MARKET.siteName}</strong>
      </p>
      <p>
        Contact: <MailLink email={infoEmail} />
      </p>
    </Section>

    <Section title="2. Description of the service">
      <p>
        {MARKET.siteName} offers paid digital services based on personalized processing, interpretive astrological
        content, and related accessory features.
      </p>
      <p>Depending on the offer purchased, the services may include:</p>
      <ul>
        <li>personalized astrological reports</li>
        <li>weekly or periodic content</li>
        <li>access to a user area</li>
        <li>any bonus content</li>
        <li>any additional digital features connected to the purchased service</li>
      </ul>
      <p>
        Unless otherwise stated, the services are provided exclusively in digital format and do not involve the delivery
        of physical goods.
      </p>
    </Section>

    <Section title="3. Nature of the service">
      <p>
        The service provided by {MARKET.siteName} is for informational, introspective, and entertainment purposes.
      </p>
      <p>The content provided:</p>
      <ul>
        <li>does not constitute psychological, psychiatric, or medical advice</li>
        <li>does not constitute legal, tax, or financial advice</li>
        <li>does not guarantee personal, relational, professional, or financial outcomes</li>
        <li>does not replace your own judgment or the support of qualified professionals</li>
      </ul>
      <p>You remain solely responsible for how you choose to use the content you receive.</p>
    </Section>

    <Section title="4. User requirements">
      <p>To use the website or purchase the services, you represent that you:</p>
      <ul>
        <li>are at least 18 years old, or otherwise legally able to enter into a binding contract</li>
        <li>provide truthful, accurate, and complete information</li>
        <li>use the website lawfully and in accordance with these Terms</li>
      </ul>
      <p>The service is not intended for minors.</p>
    </Section>

    <Section title="5. Information you provide">
      <p>
        To deliver the service, you may be required to provide personal information necessary to personalize the
        content, including, by way of example:
      </p>
      <ul>
        <li>name</li>
        <li>email</li>
        <li>date of birth</li>
        <li>time of birth</li>
        <li>place of birth</li>
        <li>quiz or other form responses</li>
      </ul>
      <p>You are responsible for the accuracy of the information you enter.</p>
      <p>
        {MARKET.siteName} is not liable for errors, delays, inaccurate content, or inconsistent results arising from
        incomplete, incorrect, or outdated information you provide.
      </p>
    </Section>

    <Section title="6. How to purchase">
      <p>Purchases are made through the website, following the checkout flow available at the time of the order.</p>
      <p>Before completing a purchase, you can review at least:</p>
      <ul>
        <li>the main characteristics of the purchased service</li>
        <li>the total price</li>
        <li>any items included in the offer</li>
        <li>the available payment methods</li>
        <li>the essential information regarding cancellation and digital delivery, where applicable</li>
      </ul>
      <p>
        The contract is deemed concluded when payment has been duly authorized and the order has been confirmed by the
        system or by the provider.
      </p>
    </Section>

    <Section title="7. Prices and payments">
      <p>All prices published on the website are expressed in the currency indicated on the purchase page.</p>
      <p>Payments may be processed by third-party providers, including:</p>
      <ul>
        <li>Stripe</li>
        <li>PayPal</li>
      </ul>
      <p>
        {MARKET.siteName} does not directly process full payment card details. Such data is handled by the payment
        providers in accordance with their respective terms and privacy policies.
      </p>
      <p>
        The provider reserves the right to modify prices, offers, bundles, or commercial conditions at any time. Changes
        do not apply to orders already completed.
      </p>
    </Section>

    <Section title="8. Delivery of digital content">
      <p>The purchased services are delivered in digital format, through one or more of the following methods:</p>
      <ul>
        <li>on-page display</li>
        <li>delivery by email</li>
        <li>access through a user area</li>
        <li>activation of periodic content linked to your profile</li>
      </ul>
      <p>
        Delivery times may vary depending on the nature of the service, technical load, the accuracy of the information
        provided, and any need for automated processing or integrations with third-party services.
      </p>
      <p>
        Unless otherwise stated, the provider does not guarantee immediate real-time delivery but undertakes to provide
        the service within a reasonable timeframe consistent with the technical structure of the product.
      </p>
    </Section>

    <Section title="9. User account">
      <p>
        If the service involves creating an account, you are responsible for keeping your login credentials confidential
        and for all activity carried out through your account.
      </p>
      <p>You agree to:</p>
      <ul>
        <li>not share your credentials with third parties</li>
        <li>not use another person's account</li>
        <li>promptly report any unauthorized access or security breach</li>
      </ul>
      <p>
        The provider reserves the right to suspend or restrict access in the event of misuse, suspected fraud, breach of
        these Terms, or conduct that may compromise the proper functioning of the service.
      </p>
    </Section>

    <Section title="10. Cancellation and refund policy">
      <p>
        Because the services consist of personalized digital content that is generated and made available immediately
        upon purchase, all sales are generally final once delivery has begun, except as required by applicable law.
      </p>
      <p>
        By requesting or accepting the immediate activation of the personalized digital service, the generation of the
        report, or the immediate availability of digital content, you acknowledge and agree that performance begins right
        away and that, to the extent permitted by applicable law, your ability to cancel for a refund may be limited once
        performance has started.
      </p>
      <p>
        <strong>Commercial "satisfaction guarantee" (14 days).</strong> In addition to any rights granted by applicable
        law, the provider offers a voluntary commercial guarantee: if within 14 days of delivery of the report you
        believe the reading is generic or does not correspond to the birth data you provided, you may request a full
        refund of the amount paid by writing to <MailLink email={infoEmail} /> from the email address used for the
        purchase.
      </p>
      <p>
        Once approved, the refund is issued to the same payment method used for the purchase, at no cost to you. This
        guarantee is available once per customer and applies exclusively to the initial purchase of the Birth Chart
        Reading (including the variant that bundles the first month of Transits). Subsequent renewals of the Transits
        subscription are not covered by this guarantee and are governed by Section 11 below.
      </p>
      <p>
        Any further support requests or disputes may be sent to the same address or to the contact details indicated on
        the website. The provider will review in good faith any technical anomalies, duplicate charges, or failure to
        actually deliver the service.
      </p>
    </Section>

    <Section title="11. Subscriptions and recurring content">
      <p>If the purchased service includes periodic content, recurring access, or any form of subscription:</p>
      <ul>
        <li>the frequency, price, and essential characteristics will be indicated on the relevant offer page</li>
        <li>you are responsible for verifying the recurring nature of the purchase before confirming the order</li>
        <li>
          the provider may suspend or discontinue the service in the event of non-payment or supervening technical
          impossibility
        </li>
      </ul>
      <p>
        Where a recurring plan automatically renews, this will be clearly disclosed at checkout or on the offer page
        before purchase, including the renewal price, billing frequency, and how to cancel. You may cancel an automatically
        renewing subscription at any time, effective at the end of the then-current billing period, by following the
        instructions provided or by contacting <MailLink email={infoEmail} />.
      </p>
    </Section>

    <Section title="12. Permitted use of the service">
      <p>
        You may use the purchased content only for personal, non-commercial purposes, unless otherwise agreed in writing.
      </p>
      <p>You may not:</p>
      <ul>
        <li>copy, reproduce, distribute, or resell the content</li>
        <li>publicly share reports, materials, outputs, flows, or restricted areas in a systematic manner</li>
        <li>use the service for unlawful, fraudulent, or rights-infringing purposes</li>
        <li>attempt to circumvent technical, security, or access restrictions</li>
      </ul>
    </Section>

    <Section title="13. Intellectual property">
      <p>
        All content on the website and provided through the service — including text, product structure, materials,
        interfaces, graphics, logos, trade names, organized outputs, layouts, and editorial content — is reserved to the
        provider or its respective rights holders.
      </p>
      <p>
        Purchasing the service does not transfer to you any intellectual property rights in the website or content,
        except for the limited personal right to use the purchased service.
      </p>
    </Section>

    <Section title="14. Service availability">
      <p>
        The provider undertakes to keep the website and services reasonably available but does not guarantee that they
        will always be accessible without interruptions, errors, delays, or malfunctions.
      </p>
      <p>The service may be suspended, restricted, or interrupted due to:</p>
      <ul>
        <li>maintenance</li>
        <li>technical updates</li>
        <li>network or infrastructure issues</li>
        <li>events beyond the provider's reasonable control</li>
        <li>unavailability of essential third-party providers</li>
      </ul>
    </Section>

    <Section title="15. Disclaimers and limitation of liability">
      <p>
        To the maximum extent permitted by applicable law, the service is provided "as is" and "as available," without
        warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for
        a particular purpose, and non-infringement.
      </p>
      <p>To the maximum extent permitted by applicable law, the provider will not be liable for:</p>
      <ul>
        <li>personal, relational, or professional decisions you make based on the content received</li>
        <li>indirect, incidental, consequential, special, or punitive damages, lost profits, or lost opportunities</li>
        <li>errors arising from inaccurate information you provide</li>
        <li>
          interruptions or malfunctions attributable to third-party providers, external tools, AI services, payment
          gateways, or telecommunications networks
        </li>
        <li>temporary incompatibilities with your devices, browsers, or technical configurations</li>
      </ul>
      <p>
        Some jurisdictions do not allow the exclusion of certain warranties or the limitation of certain damages, so some
        of the above limitations may not apply to you.
      </p>
    </Section>

    <Section title="16. Privacy and personal information">
      <p>
        The processing of your personal information is governed by the{" "}
        <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
          Privacy Policy and Cookie Policy
        </a>{" "}
        published on the website, which forms an integral part of the contractual relationship insofar as compatible.
      </p>
    </Section>

    <Section title="17. Changes to these Terms">
      <p>The provider may update or modify these Terms of Service at any time.</p>
      <p>
        Changes take effect from the date of publication on the website, unless otherwise stated. For orders already
        completed, the terms in effect at the time of purchase generally continue to apply.
      </p>
    </Section>

    <Section title="18. Governing law and dispute resolution">
      <p>
        These Terms of Service are governed by the laws of the United States and of the applicable state, without regard
        to conflict-of-laws principles, except where mandatory consumer-protection laws of your state of residence
        provide otherwise.
      </p>
      <p>
        Any dispute relating to the interpretation, validity, or performance of these Terms will be resolved in
        accordance with the dispute-resolution mechanism set out here. Nothing in these Terms limits any non-waivable
        rights granted to you as a consumer under applicable law.
      </p>
    </Section>

    <Section title="19. Contact">
      <p>
        For information, support, or communications regarding these Terms: <MailLink email={infoEmail} />
      </p>
    </Section>
  </LegalPage>
);

export default TermsEn;
