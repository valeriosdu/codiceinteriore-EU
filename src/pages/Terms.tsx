import { MARKET } from "@/markets";
import TermsIt from "./legal/Terms.it";
import TermsEs from "./legal/Terms.es";

const Terms = () => (MARKET.language === "es" ? <TermsEs /> : <TermsIt />);

export default Terms;
