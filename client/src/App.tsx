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
import { PublicAdminEditButton } from "@/components/shared/public-admin-edit-button";
import { loadGa4IfConsented } from "@/lib/analytics-runtime";
import { subscribeToCookieConsent } from "@/lib/cookie-consent";

const CmsPublicPage = lazy(() =>
  import("@/features/public/cms-hybrid-page").then((module) => ({
    default: module.CmsPublicPage,
  })),
);
const CmsPreviewPage = lazy(() => import("@/features/public/cms-preview-page"));
const StandaloneFormPage = lazy(() => import("@/features/public/standalone-form-page"));
const LoginPage = lazy(() => import("@/features/auth/login-page"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/features/auth/reset-password-page"));
const AdminSetupPage = lazy(() => import("@/features/auth/admin-setup-page"));

const AdminDashboardPage = lazy(() => import("@/features/admin/dashboard-page"));
const AdminUsersPage = lazy(() => import("@/features/admin/users-page"));
const AdminFormsPage = lazy(() => import("@/features/admin/forms-page"));
const CrmPage = lazy(() => import("@/features/admin/crm-page"));
const CrmClientsPage = lazy(() => import("@/features/admin/crm-clients-page"));
const DocsPage = lazy(() => import("@/features/admin/docs-page"));
const AdminSettingsPage = lazy(() => import("@/features/admin/settings-page"));
const AdminDesignPage = lazy(() => import("@/features/admin/design-page"));
const SystemEmailsPage = lazy(() => import("@/features/admin/system-emails-page"));
const CmsOverviewPage = lazy(() => import("@/features/admin/cms/cms-overview-page"));
const CmsPagesPage = lazy(() => import("@/features/admin/cms/cms-pages-page"));
const CmsPageEditorPage = lazy(() => import("@/features/admin/cms/cms-page-editor-page"));
const CmsBlogPage = lazy(() => import("@/features/admin/cms/cms-blog-page"));
const CmsBlogEditorPage = lazy(() => import("@/features/admin/cms/cms-blog-editor-page"));
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

function ContactCmsRoute() {
  return <CmsPublicPage slug="contact" />;
}

function CmsNotFoundRoute() {
  return <CmsPublicPage slug="404" />;
}

function CmsSlugRoute({ params }: { params: { slug?: string } }) {
  return <CmsPublicPage slug={params.slug ?? ""} />;
}

function LandscapeCmsRoute({ slug }: { slug: string }) {
  return <CmsPublicPage slug={slug} />;
}

function LandscapeLocationCmsRoute({ params }: { params: { slug?: string } }) {
  return <LandscapeCmsRoute slug={params.slug ?? ""} />;
}

function LandscapeBlogPostCmsRoute({ params }: { params: { slug?: string } }) {
  return <LandscapeCmsRoute slug={params.slug ?? ""} />;
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
        <Route path="/admin/crm/clients">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["crm"]}>
            <CrmClientsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/crm">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["crm"]}>
            <CrmPage />
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
        <Route path="/admin/system/emails">
          <ProtectedRoute roles={["admin"]}>
            <SystemEmailsPage />
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
        <Route path="/admin/cms/blog/new">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsBlogEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/blog/:id">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsBlogEditorPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/cms/blog">
          <ProtectedRoute roles={["admin", "editor"]} adminPermissions={["content"]}>
            <CmsBlogPage />
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

        <Route path="/contact/" component={ContactCmsRoute} />
        <Route path="/contact" component={ContactCmsRoute} />
        <Route path="/">{() => <LandscapeCmsRoute slug="home" />}</Route>
        <Route path="/about">{() => <LandscapeCmsRoute slug="about" />}</Route>
        <Route path="/get-a-quote">{() => <LandscapeCmsRoute slug="get-a-quote" />}</Route>
        <Route path="/commercial-quote">
          {() => <LandscapeCmsRoute slug="commercial-quote" />}
        </Route>
        <Route path="/residential-lawn-maintenance">
          {() => <LandscapeCmsRoute slug="residential-lawn-maintenance" />}
        </Route>
        <Route path="/residential-landscaping">
          {() => <LandscapeCmsRoute slug="residential-landscaping" />}
        </Route>
        <Route path="/residential-hardscape">
          {() => <LandscapeCmsRoute slug="residential-hardscape" />}
        </Route>
        <Route path="/residential-pressure-washing">
          {() => <LandscapeCmsRoute slug="residential-pressure-washing" />}
        </Route>
        <Route path="/mulching-and-planting">
          {() => <LandscapeCmsRoute slug="mulching-and-planting" />}
        </Route>
        <Route path="/drainage-solutions">
          {() => <LandscapeCmsRoute slug="drainage-solutions" />}
        </Route>
        <Route path="/commercial">{() => <LandscapeCmsRoute slug="commercial" />}</Route>
        <Route path="/commercial-grounds-maintenance">
          {() => <LandscapeCmsRoute slug="commercial-grounds-maintenance" />}
        </Route>
        <Route path="/commercial-landscaping">
          {() => <LandscapeCmsRoute slug="commercial-landscaping" />}
        </Route>
        <Route path="/commercial-hardscape">
          {() => <LandscapeCmsRoute slug="commercial-hardscape" />}
        </Route>
        <Route path="/commercial-drainage">
          {() => <LandscapeCmsRoute slug="commercial-drainage" />}
        </Route>
        <Route path="/commercial-pressure-washing">
          {() => <LandscapeCmsRoute slug="commercial-pressure-washing" />}
        </Route>
        <Route path="/hoa-services">{() => <LandscapeCmsRoute slug="hoa-services" />}</Route>
        <Route path="/service-areas">{() => <LandscapeCmsRoute slug="service-areas" />}</Route>
        <Route path="/service-areas/:slug" component={LandscapeLocationCmsRoute} />
        <Route path="/blog">{() => <LandscapeCmsRoute slug="blog" />}</Route>
        <Route path="/blog/:slug" component={LandscapeBlogPostCmsRoute} />
        <Route path="/gallery">{() => <LandscapeCmsRoute slug="gallery" />}</Route>
        <Route path="/commercial-portfolio">
          {() => <LandscapeCmsRoute slug="commercial-portfolio" />}
        </Route>
        <Route path="/faq">{() => <LandscapeCmsRoute slug="faq" />}</Route>
        <Route path="/commercial-faq">{() => <LandscapeCmsRoute slug="commercial-faq" />}</Route>

        <Route path="/service-areas/:slug/" component={CmsSlugRoute} />
        <Route path="/service-areas/:slug" component={CmsSlugRoute} />
        <Route path="/:slug/" component={CmsSlugRoute} />
        <Route path="/:slug" component={CmsSlugRoute} />

        <Route component={CmsNotFoundRoute} />
      </Switch>
    </Suspense>
  );
}

function SetupGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const {
    data: setupStatus,
    isLoading,
    isError,
  } = useQuery<{ needsSetup: boolean }>({
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
      <div
        className="flex items-center justify-center min-h-screen"
        data-testid="setup-guard-loading"
      >
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
    const isAdminRoute = pathname.startsWith("/admin");
    document.documentElement.classList.toggle("admin-mode", isAdminRoute);
    if (isAdminRoute && !document.getElementById("admin-fonts")) {
      const link = document.createElement("link");
      link.id = "admin-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
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
            <PublicAdminEditButton />
            <CookieConsentBanner />
          </SetupGuard>
        </TooltipProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
