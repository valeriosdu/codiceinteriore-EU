import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizProvider } from "@/context/QuizContext";
import { SynastryProvider } from "@/context/SynastryContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import { MARKET } from "@/markets";
import Index from "./pages/Index.tsx";
// Funnel-conversion path (Quiz → Processing → Teaser → Checkout → Success →
// Activate → ReportProcessing → Report) is loaded eagerly: every drop-off
// between steps costs paid traffic, so we don't add a chunk-fetch latency
// between funnel pages.
import Quiz from "./pages/Quiz.tsx";
import Processing from "./pages/Processing.tsx";
import TeaserResult from "./pages/TeaserResult.tsx";
import Checkout from "./pages/Checkout.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import Activate from "./pages/Activate.tsx";
import Report from "./pages/Report.tsx";
import ReportProcessing from "./pages/ReportProcessing.tsx";
// Funnel sinastria coppia (/coppia/*). Eager-loaded come il funnel natale:
// stesso ragionamento, drop-off costoso fra step paid.
import CoppiaLanding from "./pages/coppia/CoppiaLanding.tsx";
import CoppiaQuiz from "./pages/coppia/CoppiaQuiz.tsx";
import CoppiaProcessing from "./pages/coppia/CoppiaProcessing.tsx";
import CoppiaTeaser from "./pages/coppia/CoppiaTeaser.tsx";
import CoppiaSuccess from "./pages/coppia/CoppiaSuccess.tsx";
import CoppiaActivate from "./pages/coppia/CoppiaActivate.tsx";
import CoppiaReportProcessing from "./pages/coppia/CoppiaReportProcessing.tsx";
import CoppiaReport from "./pages/coppia/CoppiaReport.tsx";
// Angle-targeted Meta landings + low-traffic pages are code-split: each user
// session typically only hits one of these, so loading them on-demand keeps
// the initial bundle smaller.
const IndexClassica = lazy(() => import("./pages/IndexClassica.tsx"));
const IndexAttivazione = lazy(() => import("./pages/IndexAttivazione.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const Contatti = lazy(() => import("./pages/Contatti.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
// SEO content pages (Sprint 3): guide editoriali + glossario. Lazy perché il
// traffico funnel paid non passa di qui — sono solo per organico/discovery.
const GuideIndex = lazy(() => import("./pages/GuideIndex.tsx"));
const GuidePage = lazy(() => import("./pages/GuidePage.tsx"));
const GlossarioIndex = lazy(() => import("./pages/GlossarioIndex.tsx"));
const GlossarioPage = lazy(() => import("./pages/GlossarioPage.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminAstrologyGuide = lazy(() => import("./pages/AdminAstrologyGuide.tsx"));
const AdminCustomersList = lazy(() => import("./pages/AdminCustomersList.tsx"));
const AdminCustomerDetail = lazy(() => import("./pages/AdminCustomerDetail.tsx"));
const AdminSupport = lazy(() => import("./pages/AdminSupport.tsx"));
// Dev-only preview routes. Tree-shaken out of production builds because
// import.meta.env.DEV is replaced at build time.
const DevAstrologyGuidePreview = import.meta.env.DEV
  ? lazy(() => import("./pages/DevAstrologyGuidePreview.tsx"))
  : null;
const DevPaymentPreview = import.meta.env.DEV
  ? lazy(() => import("./pages/DevPaymentPreview.tsx"))
  : null;
import ScrollToTop from "./components/ScrollToTop";
import RouteAnalytics from "./components/RouteAnalytics";
import CookieBanner from "./components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <I18nProvider>
      <QuizProvider>
        <SynastryProvider>
        <BrowserRouter>
          <ScrollToTop />
          <RouteAnalytics />
          <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/lp/classica" element={<IndexClassica />} />
            <Route path="/lp/attivazione" element={<IndexAttivazione />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/regalo" element={<Quiz />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/teaser" element={<TeaserResult />} />
            <Route path="/offer" element={<TeaserResult />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/report-processing" element={<ReportProcessing />} />
            <Route path="/report" element={<Report />} />
            {/* Funnel sinastria coppia */}
            <Route path="/coppia" element={<CoppiaLanding />} />
            <Route path="/coppia/quiz" element={<CoppiaQuiz />} />
            <Route path="/coppia/processing" element={<CoppiaProcessing />} />
            <Route path="/coppia/teaser" element={<CoppiaTeaser />} />
            <Route path="/coppia/offer" element={<CoppiaTeaser />} />
            <Route path="/coppia/success" element={<CoppiaSuccess />} />
            <Route path="/coppia/activate" element={<CoppiaActivate />} />
            <Route path="/coppia/report-processing" element={<CoppiaReportProcessing />} />
            <Route path="/coppia/report" element={<CoppiaReport />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/contatti" element={<Contatti />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/termini" element={<Terms />} />
            {/* Contenuti editoriali solo nei mercati che li hanno (per ora IT);
                negli altri mercati queste route cadono sul NotFound. */}
            {MARKET.editorialContent && (
              <>
                <Route path="/guide" element={<GuideIndex />} />
                <Route path="/guide/:slug" element={<GuidePage />} />
                <Route path="/glossario" element={<GlossarioIndex />} />
                <Route path="/glossario/:tipo/:slug" element={<GlossarioPage />} />
              </>
            )}
            {/* Redirect dalla vecchia URL admin reports verso la nuova vista CRM */}
            <Route path="/admin/reports" element={<Navigate to="/admin/clienti" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/astrology-guide" element={<AdminAstrologyGuide />} />
            <Route path="/admin/clienti" element={<AdminCustomersList />} />
            <Route path="/admin/clienti/:emailEncoded" element={<AdminCustomerDetail />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            {DevAstrologyGuidePreview && (
              <Route
                path="/dev/astrology-guide"
                element={<DevAstrologyGuidePreview />}
              />
            )}
            {DevPaymentPreview && (
              <Route
                path="/dev/payment-preview"
                element={<DevPaymentPreview />}
              />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <CookieBanner />
        </BrowserRouter>
        </SynastryProvider>
      </QuizProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
