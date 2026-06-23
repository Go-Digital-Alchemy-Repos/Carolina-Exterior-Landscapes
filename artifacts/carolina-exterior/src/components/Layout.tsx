import { Link, useLocation } from "wouter";
import { BRAND, RESIDENTIAL_SERVICES, COMMERCIAL_SERVICES, SERVICE_AREAS } from "@/content/site";
import logoIcon from "@/assets/logo-icon.png";
import { Phone, Menu, X, ArrowRight, MapPin, Mail, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4 hidden md:block text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              Serving {BRAND.region}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              <a href={`mailto:${BRAND.email}`} className="hover:text-accent transition-colors">{BRAND.email}</a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>{BRAND.founded}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm py-2" : "bg-background py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group z-50">
            <img src={logoIcon} alt={BRAND.name} className="h-10 w-auto group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-extrabold text-foreground leading-none tracking-tight text-lg md:text-xl">
                CAROLINA EXTERIOR
              </span>
              <span className="font-extrabold text-primary leading-none tracking-widest text-[0.65rem] md:text-xs">
                LANDSCAPES
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 font-bold text-sm text-foreground/80">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-primary transition-colors py-2">
                Residential <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 w-64 bg-background border border-border shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
                <div className="p-2 flex flex-col">
                  {RESIDENTIAL_SERVICES.map(s => (
                    <Link key={s.slug} href={`/${s.slug}`} className="p-3 hover:bg-muted rounded-sm transition-colors text-sm">
                      {s.name}
                    </Link>
                  ))}
                  <div className="h-px bg-border my-1" />
                  <Link href="/gallery" className="p-3 hover:bg-muted rounded-sm transition-colors text-sm text-primary">View Gallery</Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-primary transition-colors py-2">
                Commercial <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 w-64 bg-background border border-border shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
                <div className="p-2 flex flex-col">
                  <Link href="/commercial" className="p-3 hover:bg-muted rounded-sm transition-colors text-sm font-extrabold">Commercial Hub</Link>
                  {COMMERCIAL_SERVICES.map(s => (
                    <Link key={s.slug} href={`/${s.slug}`} className="p-3 hover:bg-muted rounded-sm transition-colors text-sm">
                      {s.name}
                    </Link>
                  ))}
                  <div className="h-px bg-border my-1" />
                  <Link href="/commercial-portfolio" className="p-3 hover:bg-muted rounded-sm transition-colors text-sm text-primary">View Portfolio</Link>
                </div>
              </div>
            </div>

            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a href={`tel:${BRAND.phoneTel}`} className="flex items-center gap-2 font-extrabold text-foreground hover:text-primary transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              {BRAND.phoneDisplay}
            </a>
            <Link href="/get-a-quote">
              <Button className="font-extrabold tracking-wide">
                GET A QUOTE
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-foreground z-50 relative"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <div className={`fixed inset-0 bg-background z-40 transition-transform duration-300 pt-24 px-6 overflow-y-auto ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col gap-6 font-extrabold text-2xl">
            <Link href="/" className="hover:text-primary">Home</Link>
            <Link href="/about" className="hover:text-primary">About Us</Link>
            
            <div className="h-px bg-border my-2" />
            
            <span className="text-primary text-sm tracking-widest uppercase">Residential</span>
            <div className="flex flex-col gap-4 text-lg text-foreground/80 font-bold ml-4">
              {RESIDENTIAL_SERVICES.map(s => (
                <Link key={s.slug} href={`/${s.slug}`} className="hover:text-primary">{s.name}</Link>
              ))}
              <Link href="/gallery" className="hover:text-primary text-primary">Gallery</Link>
            </div>

            <div className="h-px bg-border my-2" />

            <span className="text-primary text-sm tracking-widest uppercase">Commercial</span>
            <div className="flex flex-col gap-4 text-lg text-foreground/80 font-bold ml-4">
              <Link href="/commercial" className="hover:text-primary">Commercial Services Hub</Link>
              {COMMERCIAL_SERVICES.map(s => (
                <Link key={s.slug} href={`/${s.slug}`} className="hover:text-primary">{s.name}</Link>
              ))}
              <Link href="/commercial-portfolio" className="hover:text-primary text-primary">Portfolio</Link>
            </div>

            <div className="h-px bg-border my-2" />
            
            <Link href="/service-areas" className="hover:text-primary">Service Areas</Link>
            <Link href="/blog" className="hover:text-primary">Blog</Link>
            <Link href="/faq" className="hover:text-primary">FAQ</Link>

            <div className="mt-8 flex flex-col gap-4">
              <a href={`tel:${BRAND.phoneTel}`} className="flex items-center justify-center gap-2 font-extrabold text-foreground bg-muted p-4 rounded-md">
                <Phone className="h-5 w-5 text-primary" />
                {BRAND.phoneDisplay}
              </a>
              <Link href="/get-a-quote">
                <Button size="lg" className="w-full text-lg h-14">GET A QUOTE</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src={logoIcon} alt={BRAND.name} className="h-10 w-auto brightness-0 invert" />
                <div className="flex flex-col">
                  <span className="font-extrabold leading-none tracking-tight text-lg">CAROLINA EXTERIOR</span>
                  <span className="font-extrabold text-primary leading-none tracking-widest text-[0.65rem]">LANDSCAPES</span>
                </div>
              </div>
              <p className="text-muted/80 text-sm leading-relaxed font-medium">
                {BRAND.tagline} {BRAND.subTagline}.<br/>
                We are proud to serve {BRAND.county} and the {BRAND.region} with premium landscaping and lawn care services.
              </p>
              <div className="space-y-3 font-bold text-sm">
                <a href={`tel:${BRAND.phoneTel}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Phone className="h-4 w-4" /></div>
                  {BRAND.phoneDisplay}
                </a>
                <a href={`mailto:${BRAND.email}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Mail className="h-4 w-4" /></div>
                  {BRAND.email}
                </a>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><MapPin className="h-4 w-4" /></div>
                  {BRAND.city}, {BRAND.state}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-lg mb-6 border-b border-white/10 pb-4">Residential</h4>
              <ul className="space-y-3 text-sm font-medium text-muted/80">
                {RESIDENTIAL_SERVICES.map(s => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}`} className="hover:text-primary transition-colors flex items-center gap-2 group">
                      <ArrowRight className="h-3 w-3 text-primary opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {s.name}
                    </Link>
                  </li>
                ))}
                <li><Link href="/gallery" className="hover:text-primary transition-colors flex items-center gap-2 group"><ArrowRight className="h-3 w-3 text-primary opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />Gallery</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-lg mb-6 border-b border-white/10 pb-4">Commercial</h4>
              <ul className="space-y-3 text-sm font-medium text-muted/80">
                <li><Link href="/commercial" className="hover:text-primary transition-colors flex items-center gap-2 group font-bold"><ArrowRight className="h-3 w-3 text-primary opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />Commercial Hub</Link></li>
                {COMMERCIAL_SERVICES.map(s => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}`} className="hover:text-primary transition-colors flex items-center gap-2 group">
                      <ArrowRight className="h-3 w-3 text-primary opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold text-lg mb-6 border-b border-white/10 pb-4">Service Areas</h4>
              <ul className="grid grid-cols-2 gap-3 text-sm font-medium text-muted/80">
                {SERVICE_AREAS.map(a => (
                  <li key={a.slug}>
                    <Link href={`/service-areas/${a.slug}`} className="hover:text-primary transition-colors">
                      {a.city}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/get-a-quote">
                  <Button variant="outline" className="w-full bg-transparent border-primary text-primary hover:bg-primary hover:text-white">
                    REQUEST A QUOTE
                  </Button>
                </Link>
              </div>
            </div>

          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-muted/50">
            <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
            <div className="flex gap-6">
              <span>{BRAND.founded}</span>
              <Link href="/about" className="hover:text-white">About Us</Link>
              <Link href="/blog" className="hover:text-white">Blog</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
