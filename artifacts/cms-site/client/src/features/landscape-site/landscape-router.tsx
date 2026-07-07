import { Route, Switch } from "wouter";
import { Layout } from "@/features/landscape-site/components/Layout";
import Home from "@/features/landscape-site/pages/Home";
import About from "@/features/landscape-site/pages/About";
import GetAQuote from "@/features/landscape-site/pages/GetAQuote";
import CommercialQuote from "@/features/landscape-site/pages/CommercialQuote";
import ServicePage from "@/features/landscape-site/pages/ServicePage";
import ServiceAreas from "@/features/landscape-site/pages/ServiceAreas";
import ServiceAreaCity from "@/features/landscape-site/pages/ServiceAreaCity";
import BlogIndex from "@/features/landscape-site/pages/BlogIndex";
import BlogPost from "@/features/landscape-site/pages/BlogPost";
import Gallery from "@/features/landscape-site/pages/Gallery";
import CommercialPortfolio from "@/features/landscape-site/pages/CommercialPortfolio";
import Faq from "@/features/landscape-site/pages/Faq";
import CommercialFaq from "@/features/landscape-site/pages/CommercialFaq";
import NotFound from "@/features/landscape-site/pages/not-found";

export const LANDSCAPE_CONTENT_PAGE_SLUGS = [
  "residential-lawn-maintenance",
  "residential-landscaping",
  "residential-hardscape",
  "mulching-and-planting",
  "drainage-solutions",
  "commercial",
  "commercial-grounds-maintenance",
  "commercial-landscaping",
  "commercial-hardscape",
  "commercial-drainage",
  "hoa-services",
] as const;

export default function LandscapeSite() {
  return (
    <Layout>
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
    </Layout>
  );
}
