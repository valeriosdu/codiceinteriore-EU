import { useI18n } from "@/i18n/I18nProvider";

const Footer = () => {
  const { m, market } = useI18n();
  const f = m.common.footer;
  return (
    <footer className="border-t border-border py-8 mt-16">
      <div className="container text-center space-y-3">
        <p className="text-xs lg:text-sm text-muted-foreground">
          {f.rights(new Date().getFullYear(), market.siteName)}
        </p>
        <p className="text-xs lg:text-sm text-muted-foreground">
          {market.editorialContent && (
            <>
              <a href="/guide" className="hover:text-foreground transition-colors">
                {f.guides}
              </a>
              {" · "}
              <a href="/glossario" className="hover:text-foreground transition-colors">
                {f.glossary}
              </a>
              {" · "}
            </>
          )}
          <a href="/privacy" className="hover:text-foreground transition-colors">
            {f.privacy}
          </a>
          {" · "}
          <a href="/termini" className="hover:text-foreground transition-colors">
            {f.terms}
          </a>
          {" · "}
          <a href="/contatti" className="hover:text-foreground transition-colors">
            {f.contact}
          </a>
        </p>
        <p className="text-[10px] lg:text-xs text-muted-foreground/60 leading-relaxed">
          {f.brandLine(market.siteName)} <strong>{market.legal.companyName}</strong>
          {market.legal.address && (
            <>
              <br />
              {f.addressLabel} {market.legal.address}.
            </>
          )}
          {market.legal.regNumber && (
            <>
              <br />
              {f.regLabel} {market.legal.regNumber}.
            </>
          )}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
