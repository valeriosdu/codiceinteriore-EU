import { MARKET } from "@/markets";
import TermsIt from "./legal/Terms.it";
import TermsEs from "./legal/Terms.es";
import TermsEn from "./legal/Terms.en";
import TermsNl from "./legal/Terms.nl";

const Terms = () => {
  if (MARKET.language === "en") return <TermsEn />;
  if (MARKET.language === "nl") return <TermsNl />;
  if (MARKET.language === "es") return <TermsEs />;
  return <TermsIt />;
};

export default Terms;
