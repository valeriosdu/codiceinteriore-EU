import { MARKET } from "@/markets";
import PrivacyPolicyIt from "./legal/PrivacyPolicy.it";
import PrivacyPolicyEs from "./legal/PrivacyPolicy.es";

const PrivacyPolicy = () => (MARKET.language === "es" ? <PrivacyPolicyEs /> : <PrivacyPolicyIt />);

export default PrivacyPolicy;
