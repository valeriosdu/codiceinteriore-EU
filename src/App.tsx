import { Suspense, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuizProvider } from "@/context/QuizContext";
import { SynastryProvider } from "@/context/SynastryContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import { MARKET } from "@/markets";
import { ROUTES, LEGACY_SLUGS, SLUGS_LOCALIZED } from "@/lib/routes";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import Index from "./pages/Index.tsx";
// Funnel-conversion path (Quiz → Processing → Teaser → Checkout → Success →
// Activate → ReportProcessing) is loaded eagerly: every drop-off between
// steps costs paid traffic, so we don't add a chunk-fetch latency between
// funnel pages. The exception is Report: it is the heaviest page and only
// buyers reach it, so it is split out and prefetched at idle from the pages
// right before it (see PrefetchNextChunk below).
import Quiz from "./pages/Quiz.tsx";
import Processing from "./pages/Processing.tsx";
import TeaserResult from "./pages/TeaserResult.tsx";
import Checkout from "./pages/Checkout.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import Activate from "./pages/Activate.tsx";
import ReportProcessing from "./pages/ReportProcessing.tsx";
// Le due pagine coppia su cui si atterra da fuori restano eager: CoppiaActivate
// legge il token di login dall'hash al primo render (caricata in ritardo, il
// client Supabase lo consumerebbe prima), CoppiaSuccess fa la capture PayPal.
// Il resto del funnel coppia è on demand, più sotto.
import CoppiaSuccess from "./pages/coppia/CoppiaSuccess.tsx";
import CoppiaActivate from "./pages/coppia/CoppiaActivate.tsx";
// Angle-targeted Meta landings + low-traffic pages are code-split: each user
// session typically only hits one of these, so loading them on-demand keeps
// the initial bundle smaller.
const IndexClassica = lazyWithRetry(() => import("./pages/IndexClassica.tsx"));
const IndexAttivazione = lazyWithRetry(() => import("./pages/IndexAttivazione.tsx"));
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe.tsx"));
const Contatti = lazyWithRetry(() => import("./pages/Contatti.tsx"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazyWithRetry(() => import("./pages/Terms.tsx"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound.tsx"));
// SEO content pages (Sprint 3): guide editoriali + glossario. Lazy perché il
// traffico funnel paid non passa di qui — sono solo per organico/discovery.
const GuideIndex = lazyWithRetry(() => import("./pages/GuideIndex.tsx"));
const GuidePage = lazyWithRetry(() => import("./pages/GuidePage.tsx"));
const GlossarioIndex = lazyWithRetry(() => import("./pages/GlossarioIndex.tsx"));
const GlossarioPage = lazyWithRetry(() => import("./pages/GlossarioPage.tsx"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard.tsx"));
const AdminAstrologyGuide = lazyWithRetry(() => import("./pages/AdminAstrologyGuide.tsx"));
const AdminCustomersList = lazyWithRetry(() => import("./pages/AdminCustomersList.tsx"));
const AdminCustomerDetail = lazyWithRetry(() => import("./pages/AdminCustomerDetail.tsx"));
const AdminSupport = lazyWithRetry(() => import("./pages/AdminSupport.tsx"));
// Dev-only preview routes. Tree-shaken out of production builds because
// import.meta.env.DEV is replaced at build time.
const DevAstrologyGuidePreview = import.meta.env.DEV
  ? lazyWithRetry(() => import("./pages/DevAstrologyGuidePreview.tsx"))
  : null;
const DevPaymentPreview = import.meta.env.DEV
  ? lazyWithRetry(() => import("./pages/DevPaymentPreview.tsx"))
  : null;
// Report e funnel coppia, ognuno nel suo chunk. Le sei pagine coppia arrivano
// da un unico modulo, così il primo passo scarica il chunk e i successivi
// restano istantanei come quando erano eager.
const loadReport = () => import("./pages/Report.tsx");
const loadCoppia = () => import("./pages/coppia/index.ts");
const Report = lazyWithRetry(loadReport);
const CoppiaLanding = lazyWithRetry(() => loadCoppia().then((m) => ({ default: m.CoppiaLanding })));
const CoppiaQuiz = lazyWithRetry(() => loadCoppia().then((m) => ({ default: m.CoppiaQuiz })));
const CoppiaProcessing = lazyWithRetry(() => loadCoppia().then((m) => ({ default: m.CoppiaProcessing })));
const CoppiaTeaser = lazyWithRetry(() => loadCoppia().then((m) => ({ default: m.CoppiaTeaser })));
const CoppiaReportProcessing = lazyWithRetry(() =>
  loadCoppia().then((m) => ({ default: m.CoppiaReportProcessing })),
);
const CoppiaReport = lazyWithRetry(() => loadCoppia().then((m) => ({ default: m.CoppiaReport })));
import ScrollToTop from "./components/ScrollToTop";
import RouteAnalytics from "./components/RouteAnalytics";
import CookieBanner from "./components/CookieBanner";
import { captureFbclid } from "./hooks/useMetaConversions";

const queryClient = new QueryClient();

// Dalle pagine subito prima del report (o del report coppia) scarica in
// anticipo il chunk che servirà dopo, quando il browser è libero: chi ha
// appena pagato non aspetta il download quando la lettura è pronta.
// Le rotte coppia sono localizzate (/coppia, /couple, /koppel): si leggono da
// ROUTES, mai scritte a mano. Quelle natali sono uguali in ogni mercato.
const REPORT_PREFETCH_ROUTES = new Set(["/success", "/activate", "/report-processing"]);
const COPPIA_PREFETCH_ROUTES = new Set<string>([ROUTES.coupleSuccess, ROUTES.coupleActivate]);

// Report e funnel coppia sono on demand: mentre arriva il chunk mostrano lo
// stesso spinner con cui Report aspetta i dati, invece della pagina bianca del
// Suspense esterno. Conta per chi ci arriva senza passare dal prefetch: il
// cliente che torna da "/", dal bottone account dell'header o dal teaser.
const ChunkLoading = ({ children }: { children: ReactNode }) => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }
  >
    {children}
  </Suspense>
);

const PrefetchNextChunk = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const load = REPORT_PREFETCH_ROUTES.has(pathname)
      ? loadReport
      : COPPIA_PREFETCH_ROUTES.has(pathname)
        ? loadCoppia
        : null;
    if (!load) return;

    // Un prefetch fallito non deve fare rumore: ci riprova lazyWithRetry
    // quando la pagina serve davvero.
    const run = () => {
      load().catch(() => {});
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(run, 1500);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
};

// Redirect 301 dai vecchi slug italiani ai nuovi slug inglesi, preservando
// sottopath e query (usato per il sottoalbero /coppia/* → /couple/*). Registrato
// solo nel mercato en (vedi SLUGS_LOCALIZED).
const LegacyRedirect = ({ from, to }: { from: string; to: string }) => {
  const { pathname, search } = useLocation();
  const rest = pathname.startsWith(from) ? pathname.slice(from.length) : "";
  return <Navigate to={`${to}${rest}${search}`} replace />;
};

const App = () => {
  useEffect(() => {
    captureFbclid();
  }, []);

  return (
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
          <PrefetchNextChunk />
          <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path={ROUTES.lpClassica} element={<IndexClassica />} />
            <Route path={ROUTES.lpAttivazione} element={<IndexAttivazione />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path={ROUTES.gift} element={<Quiz />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/teaser" element={<TeaserResult />} />
            <Route path="/offer" element={<TeaserResult />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/report-processing" element={<ReportProcessing />} />
            <Route path="/report" element={<ChunkLoading><Report /></ChunkLoading>} />
            {/* Funnel sinastria coppia (slug localizzato: /couple in en, /coppia altrove) */}
            <Route path={ROUTES.couple} element={<ChunkLoading><CoppiaLanding /></ChunkLoading>} />
            <Route path={ROUTES.coupleQuiz} element={<ChunkLoading><CoppiaQuiz /></ChunkLoading>} />
            <Route path={ROUTES.coupleProcessing} element={<ChunkLoading><CoppiaProcessing /></ChunkLoading>} />
            <Route path={ROUTES.coupleTeaser} element={<ChunkLoading><CoppiaTeaser /></ChunkLoading>} />
            <Route path={ROUTES.coupleOffer} element={<ChunkLoading><CoppiaTeaser /></ChunkLoading>} />
            <Route path={ROUTES.coupleSuccess} element={<CoppiaSuccess />} />
            <Route path={ROUTES.coupleActivate} element={<CoppiaActivate />} />
            <Route path={ROUTES.coupleReportProcessing} element={<ChunkLoading><CoppiaReportProcessing /></ChunkLoading>} />
            <Route path={ROUTES.coupleReport} element={<ChunkLoading><CoppiaReport /></ChunkLoading>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path={ROUTES.contact} element={<Contatti />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path={ROUTES.terms} element={<Terms />} />
            {/* Redirect 301 dai vecchi slug italiani ai nuovi (solo mercato en) */}
            {SLUGS_LOCALIZED && (
              <>
                <Route path={LEGACY_SLUGS.lpClassica} element={<LegacyRedirect from={LEGACY_SLUGS.lpClassica} to={ROUTES.lpClassica} />} />
                <Route path={LEGACY_SLUGS.lpAttivazione} element={<LegacyRedirect from={LEGACY_SLUGS.lpAttivazione} to={ROUTES.lpAttivazione} />} />
                <Route path={LEGACY_SLUGS.gift} element={<LegacyRedirect from={LEGACY_SLUGS.gift} to={ROUTES.gift} />} />
                <Route path={LEGACY_SLUGS.contact} element={<LegacyRedirect from={LEGACY_SLUGS.contact} to={ROUTES.contact} />} />
                <Route path={LEGACY_SLUGS.terms} element={<LegacyRedirect from={LEGACY_SLUGS.terms} to={ROUTES.terms} />} />
                <Route path={LEGACY_SLUGS.couple} element={<LegacyRedirect from={LEGACY_SLUGS.couple} to={ROUTES.couple} />} />
                <Route path={`${LEGACY_SLUGS.couple}/*`} element={<LegacyRedirect from={LEGACY_SLUGS.couple} to={ROUTES.couple} />} />
              </>
            )}
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
          {MARKET.cookieBanner && <CookieBanner />}
        </BrowserRouter>
        </SynastryProvider>
      </QuizProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
