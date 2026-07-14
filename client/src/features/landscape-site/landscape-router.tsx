import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { Loader2 } from "lucide-react";
import { Layout } from "@/features/landscape-site/components/Layout";

const Home = lazy(() => import("@/features/landscape-site/pages/Home"));
const About = lazy(() => import("@/features/landscape-site/pages/About"));
const GetAQuote = lazy(() => import("@/features/landscape-site/pages/GetAQuote"));
const CommercialQuote = lazy(() => import("@/features/landscape-site/pages/CommercialQuote"));
const ServicePage = lazy(() => import("@/features/landscape-site/pages/ServicePage"));
const ServiceAreas = lazy(() => import("@/features/landscape-site/pages/ServiceAreas"));
const ServiceAreaCity = lazy(() => import("@/features/landscape-site/pages/ServiceAreaCity"));
const BlogIndex = lazy(() => import("@/features/landscape-site/pages/BlogIndex"));
const BlogPost = lazy(() => import("@/features/landscape-site/pages/BlogPost"));
const Gallery = lazy(() => import("@/features/landscape-site/pages/Gallery"));
const CommercialPortfolio = lazy(
  () => import("@/features/landscape-site/pages/CommercialPortfolio"),
);
const Faq = lazy(() => import("@/features/landscape-site/pages/Faq"));
const CommercialFaq = lazy(() => import("@/features/landscape-site/pages/CommercialFaq"));
const NotFound = lazy(() => import("@/features/landscape-site/pages/not-found"));

export const LANDSCAPE_CONTENT_PAGE_SLUGS = [
  "residential-lawn-maintenance",
  "residential-landscaping",
  "residential-hardscape",
  "residential-pressure-washing",
  "mulching-and-planting",
  "drainage-solutions",
  "commercial",
  "commercial-grounds-maintenance",
  "commercial-landscaping",
  "commercial-hardscape",
  "commercial-drainage",
  "commercial-pressure-washing",
  "hoa-services",
] as const;

function LandscapePageLoader() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      data-testid="landscape-page-loader"
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading page" />
    </div>
  );
}

export function LandscapeSite() {
  return (
    <Layout>
      <Suspense fallback={<LandscapePageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/get-a-quote" component={GetAQuote} />
          <Route path="/commercial-quote" component={CommercialQuote} />

          {LANDSCAPE_CONTENT_PAGE_SLUGS.map((slug) => (
            <Route key={slug} path={`/${slug}`}>
              {() => <ServicePage slug={slug} />}
            </Route>
          ))}

          <Route path="/service-areas" component={ServiceAreas} />
          <Route path="/service-areas/:slug" component={ServiceAreaCity} />
          <Route path="/blog" component={BlogIndex} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/commercial-portfolio" component={CommercialPortfolio} />
          <Route path="/faq" component={Faq} />
          <Route path="/commercial-faq" component={CommercialFaq} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}
