import { Suspense, lazy, useEffect, useRef } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandingProvider } from "@/components/shared/branding-provider";
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { loadGa4IfConsented } from "@/lib/analytics-runtime";
import { subscribeToCookieConsent } from "@/lib/cookie-consent";
import NotFound from "@/pages/not-found";

const CmsHybridPage = lazy(() =>
  import("@/features/public/cms-hybrid-page").then((module) => ({
    default: module.CmsHybridPage,
  })),
);
const CmsPreviewPage = lazy(() => import("@/features/public/cms-preview-page"));
const StandaloneFormPage = lazy(() => import("@/features/public/standalone-form-page"));
const LandscapeSite = lazy(() =>
  import("@/features/landscape-site/landscape-router").then((module) => ({
    default: module.LandscapeSite,
  })),
);

const LoginPage = lazy(() => import("@/features/auth/login-page"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/features/auth/reset-password-page"));
const AdminSetupPage = lazy(() => import("@/features/auth/admin-setup-page"));

const AdminDashboardPage = lazy(() => import("@/features/admin/dashboard-page"));
const AdminUsersPage = lazy(() => import("@/features/admin/users-page"));
const AdminFormsPage = lazy(() => import("@/features/admin/forms-page"));
const DocsPage = lazy(() => import("@/features/admin/docs-page"));
const AdminSettingsPage = lazy(() => import("@/features/admin/settings-page"));
const AdminDesignPage = lazy(() => import("@/features/admin/design-page"));
const CmsOverviewPage = lazy(() => import("@/features/admin/cms/cms-overview-page"));
const CmsPagesPage = lazy(() => import("@/features/admin/cms/cms-pages-page"));
const CmsPageEditorPage = lazy(() => import("@/features/admin/cms/cms-page-editor-page"));
const CmsGalleriesPage = lazy(() => import("@/features/admin/cms/cms-galleries-page"));
const CmsGalleryEditorPage = lazy(() => import("@/features/admin/cms/cms-gallery-editor-page"));
const CmsMediaPage = lazy(() => import("@/features/admin/cms/cms-media-page"));
const CmsSeoPage = lazy(() => import("@/features/admin/cms/cms-seo-page"));
const CmsSectionsPage = lazy(() => import("@/features/admin/cms/cms-sections-page"));
const CmsSectionEditorPage = lazy(() => import("@/features/admin/cms/cms-section-editor-page"));
const CmsMenusPage = lazy(() => import("@/features/admin/cms/cms-menus-page"));
const CmsSidebarsPage = lazy(() => import("@/features/admin/cms/cms-sidebars-page"));
const SystemBackupsPage = lazy(() => import("@/features/admin/system-backups-page"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" data-testid="page-loader">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function CmsSlugRoute({ params }: { params: { slug?: string } }) {
  return <CmsHybridPage slug={params.slug ?? ""} fallback={<NotFound />} />;
}

function LandscapeSiteRoute() {
  return <LandscapeSite />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/preview/cms/:id" component={CmsPreviewPage} />
        <Route path="/forms/:slug" component={StandaloneFormPage} />

        <Route path="/auth/login" component={LoginPage} />
        <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
        <Route path="/auth/reset-password" component={ResetPasswordPage} />
        <Route path="/setup" component={AdminSetupPage} />

        <Route path="/admin">
          <ProtectedRoute roles={["admin", "editor"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/forms">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <AdminFormsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/docs">
          <ProtectedRoute roles={["admin"]}>
            <DocsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/settings">
          <ProtectedRoute roles={["admin"]}>
            <AdminSettingsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/design/branding">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["design"]}>
            <AdminDesignPage initialSubview="branding" />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/design/colors">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["design"]}>
            <AdminDesignPage initialSubview="colors" />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/design/typography">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["design"]}>
            <AdminDesignPage initialSubview="typography" />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/design">
          <Redirect to="/admin/design/branding" replace />
        </Route>
        <Route path="/admin/system/backups">
          <ProtectedRoute roles={["admin"]}>
            <SystemBackupsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsOverviewPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/pages/new">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsPageEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/pages/:id">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsPageEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/pages">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsPagesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/galleries/new">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsGalleryEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/galleries/:id">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsGalleryEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/galleries">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsGalleriesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/media">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsMediaPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/sections/new">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content", "design"]}>
            <CmsSectionEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/sections/:id">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content", "design"]}>
            <CmsSectionEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/sections">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content", "design"]}>
            <CmsSectionsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/seo">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsSeoPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/menus">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["design"]}>
            <CmsMenusPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/sidebars">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["design"]}>
            <CmsSidebarsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/" component={LandscapeSiteRoute} />
        <Route path="/about" component={LandscapeSiteRoute} />
        <Route path="/get-a-quote" component={LandscapeSiteRoute} />
        <Route path="/commercial-quote" component={LandscapeSiteRoute} />
        <Route path="/residential-lawn-maintenance" component={LandscapeSiteRoute} />
        <Route path="/residential-landscaping" component={LandscapeSiteRoute} />
        <Route path="/residential-hardscape" component={LandscapeSiteRoute} />
        <Route path="/mulching-and-planting" component={LandscapeSiteRoute} />
        <Route path="/drainage-solutions" component={LandscapeSiteRoute} />
        <Route path="/commercial" component={LandscapeSiteRoute} />
        <Route path="/commercial-grounds-maintenance" component={LandscapeSiteRoute} />
        <Route path="/commercial-landscaping" component={LandscapeSiteRoute} />
        <Route path="/commercial-hardscape" component={LandscapeSiteRoute} />
        <Route path="/commercial-drainage" component={LandscapeSiteRoute} />
        <Route path="/hoa-services" component={LandscapeSiteRoute} />
        <Route path="/service-areas" component={LandscapeSiteRoute} />
        <Route path="/service-areas/:slug" component={LandscapeSiteRoute} />
        <Route path="/blog" component={LandscapeSiteRoute} />
        <Route path="/blog/:slug" component={LandscapeSiteRoute} />
        <Route path="/gallery" component={LandscapeSiteRoute} />
        <Route path="/commercial-portfolio" component={LandscapeSiteRoute} />
        <Route path="/faq" component={LandscapeSiteRoute} />
        <Route path="/commercial-faq" component={LandscapeSiteRoute} />

        <Route path="/service-areas/:slug/" component={CmsSlugRoute} />
        <Route path="/service-areas/:slug" component={CmsSlugRoute} />
        <Route path="/:slug/" component={CmsSlugRoute} />
        <Route path="/:slug" component={CmsSlugRoute} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function SetupGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: setupStatus, isLoading, isError } = useQuery<{ needsSetup: boolean }>({
    queryKey: ["/api/setup/status"],
    staleTime: 60_000,
    retry: 2,
  });

  const needsSetup = setupStatus?.needsSetup === true || (isError && !setupStatus);

  useEffect(() => {
    if (needsSetup && location !== "/setup") {
      setLocation("/setup");
    }
  }, [needsSetup, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="setup-guard-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

function RouteScrollManager() {
  const [location] = useLocation();
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathname = location.split(/[?#]/)[0] || "/";
    const lastPathname = lastPathnameRef.current;
    lastPathnameRef.current = pathname;
    if (lastPathname === null || lastPathname === pathname) return;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, [location]);

  return null;
}

function RouteAdminModeManager() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const pathname = location.split(/[?#]/)[0] || "/";
    document.documentElement.classList.toggle("admin-mode", pathname.startsWith("/admin"));
    return () => document.documentElement.classList.remove("admin-mode");
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    void loadGa4IfConsented();
    return subscribeToCookieConsent((record) => {
      if (record.preferences.analytics) {
        void loadGa4IfConsented();
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <TooltipProvider>
          <Toaster />
          <SetupGuard>
            <RouteAdminModeManager />
            <RouteScrollManager />
            <Router />
            <CookieConsentBanner />
          </SetupGuard>
        </TooltipProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
