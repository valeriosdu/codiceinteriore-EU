import { MARKET } from "@/markets";
import PrivacyPolicyIt from "./legal/PrivacyPolicy.it";
import PrivacyPolicyEs from "./legal/PrivacyPolicy.es";
import PrivacyPolicyEn from "./legal/PrivacyPolicy.en";

const PrivacyPolicy = () => {
  if (MARKET.language === "en") return <PrivacyPolicyEn />;
  if (MARKET.language === "es") return <PrivacyPolicyEs />;
  return <PrivacyPolicyIt />;
};

export default PrivacyPolicy;
