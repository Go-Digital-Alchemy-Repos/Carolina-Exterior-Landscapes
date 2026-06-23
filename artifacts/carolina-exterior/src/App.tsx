import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import About from "@/pages/About";
import GetAQuote from "@/pages/GetAQuote";
import CommercialQuote from "@/pages/CommercialQuote";
import ServicePage from "@/pages/ServicePage";
import ServiceAreas from "@/pages/ServiceAreas";
import ServiceAreaCity from "@/pages/ServiceAreaCity";
import BlogIndex from "@/pages/BlogIndex";
import BlogPost from "@/pages/BlogPost";
import Gallery from "@/pages/Gallery";
import CommercialPortfolio from "@/pages/CommercialPortfolio";
import Faq from "@/pages/Faq";
import CommercialFaq from "@/pages/CommercialFaq";

const queryClient = new QueryClient();

// A generic wrapper for pages that are just content blocks
const contentPages = [
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
  "hoa-services"
];

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/get-a-quote" component={GetAQuote} />
        <Route path="/commercial-quote" component={CommercialQuote} />
        
        {contentPages.map(slug => (
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
