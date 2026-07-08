import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { useSeo } from "@/hooks/use-seo";

const serviceLinks = [
  { text: "Lawn Maintenance", path: "/residential-lawn-maintenance/" },
  { text: "Residential Landscaping", path: "/residential-landscaping/" },
  { text: "Hardscape", path: "/residential-hardscape/" },
  { text: "Pressure Washing", path: "/residential-pressure-washing/" },
  { text: "Mulching & Planting", path: "/mulching-and-planting/" },
  { text: "Drainage Solutions", path: "/drainage-solutions/" },
  { text: "Commercial Grounds", path: "/commercial-grounds-maintenance/" },
  { text: "Service Areas", path: "/service-areas/" },
  { text: "Homepage", path: "/" },
];

export default function NotFound() {
  useSeo({
    title: "Page Not Found | Carolina Exterior Landscapes",
    description: "The page you are looking for does not exist or has been moved.",
    noindex: true,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-normal text-[#2C2C2C]">Page Not Found</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            The page you are looking for does not exist or has been moved. Use the links below to find what you need.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="rounded-md border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                {link.text}
              </Link>
            ))}
          </div>
          <Button asChild className="mt-8">
            <Link href="/">Back to Home</Link>
          </Button>
          <p className="mt-8 text-muted-foreground">
            Or call us directly:{" "}
            <a href="tel:+17049755867" className="font-semibold text-primary hover:text-primary/80">
              (704) 975-5867
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
