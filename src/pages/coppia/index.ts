// Unico punto d'ingresso per le pagine coppia caricate on demand da App.tsx:
// importarle tutte da qui le mette nello stesso chunk, cosi' il primo passo del
// funnel coppia lo scarica e i successivi restano istantanei.
// CoppiaActivate e CoppiaSuccess restano fuori di proposito: App.tsx le carica
// subito (token di login nell'hash, capture PayPal).
export { default as CoppiaLanding } from "./CoppiaLanding.tsx";
export { default as CoppiaQuiz } from "./CoppiaQuiz.tsx";
export { default as CoppiaProcessing } from "./CoppiaProcessing.tsx";
export { default as CoppiaTeaser } from "./CoppiaTeaser.tsx";
export { default as CoppiaReportProcessing } from "./CoppiaReportProcessing.tsx";
export { default as CoppiaReport } from "./CoppiaReport.tsx";
