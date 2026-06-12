import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { MARKET } from "@/markets";

// Dati legali per-mercato, condivisi dalle pagine legali (Privacy/Termini).
export const legalDomain = new URL(MARKET.siteUrl).hostname.replace(/^www\./, "");
export const infoEmail = MARKET.contactEmail;
export const privacyEmail = `privacy@${legalDomain}`;
export const legalEntity = MARKET.legal;

interface LegalPageProps {
  seoTitle: string;
  seoDescription: string;
  path: string;
  backAria: string;
  heading: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalPage = ({
  seoTitle,
  seoDescription,
  path,
  backAria,
  heading,
  lastUpdated,
  children,
}: LegalPageProps) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <SEO title={seoTitle} description={seoDescription} path={path} />
      <Header
        backButton={
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={backAria}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />
      <main className="container max-w-3xl py-10 flex-1">
        <article className="prose prose-neutral max-w-none">
          <header className="mb-10 border-b border-border pb-6">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mb-3">{heading}</h1>
            <p className="text-sm text-muted-foreground">{lastUpdated}</p>
          </header>
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export const LegalEntityBox = () => (
  <div className="my-4 p-4 rounded-md bg-muted/50 border border-border text-sm leading-relaxed">
    <p className="font-medium">{legalEntity.companyName}</p>
    {legalEntity.address && <p>{legalEntity.address}</p>}
    {legalEntity.regNumber && <p>Reg. {legalEntity.regNumber}</p>}
  </div>
);

export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-foreground">{title}</h2>
    <div className="space-y-3 text-foreground/85 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_a]:text-primary">
      {children}
    </div>
  </section>
);

export const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <h3 className="font-serif text-xl font-medium mb-2 text-foreground">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

export const MailLink = ({ email }: { email: string }) => (
  <a href={`mailto:${email}`} className="text-primary underline-offset-4 hover:underline">
    {email}
  </a>
);

export const SiteLink = () => (
  <a href={MARKET.siteUrl} className="text-primary underline-offset-4 hover:underline">
    {legalDomain}
  </a>
);
