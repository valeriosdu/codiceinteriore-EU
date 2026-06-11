const Footer = () => {
  return (
    <footer className="border-t border-border py-8 mt-16">
      <div className="container text-center space-y-3">
        <p className="text-xs lg:text-sm text-muted-foreground">
          © {new Date().getFullYear()} Codice Interiore. Tutti i diritti riservati.
        </p>
        <p className="text-xs lg:text-sm text-muted-foreground">
          <a href="/guide" className="hover:text-foreground transition-colors">
            Guide
          </a>
          {" · "}
          <a href="/glossario" className="hover:text-foreground transition-colors">
            Glossario
          </a>
          {" · "}
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          {" · "}
          <a href="/termini" className="hover:text-foreground transition-colors">
            Termini
          </a>
          {" · "}
          <a href="/contatti" className="hover:text-foreground transition-colors">
            Contatti
          </a>
        </p>
        <p className="text-[10px] lg:text-xs text-muted-foreground/60 leading-relaxed">
          Codice Interiore è un brand di <strong>ECOLIFE COMMERCE LTD.</strong>
          <br />
          Sede legale: 71-75 Shelton Street, Covent Garden, Londra, Regno Unito.
          <br />
          Numero di registrazione: 16364511.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
