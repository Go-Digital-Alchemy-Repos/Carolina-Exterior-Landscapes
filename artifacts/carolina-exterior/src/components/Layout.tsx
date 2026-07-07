import { Link, useLocation } from "wouter";
import { BRAND, RESIDENTIAL_SERVICES, COMMERCIAL_SERVICES, SERVICE_AREAS } from "@/content/site";
import logoFull from "@/assets/logo-full.png";
import daLogo from "@assets/da-logo_1783441369547.svg";
import logoWhite from "@assets/Primary_Logo_white_1783443034776.png";
import { Phone, Menu, X, ArrowRight, MapPin, Mail, ChevronDown, Leaf } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { BotanicalAccent } from "./nature/BotanicalAccent";

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
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2.5 px-4 hidden md:block text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-foreground/70" />
              Serving {BRAND.region}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary-foreground/70" />
              <a href={`mailto:${BRAND.email}`} className="hover:text-white transition-colors">{BRAND.email}</a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-primary-foreground/90"><Leaf className="h-4 w-4" /> {BRAND.founded}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
          isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm py-3 border-border/50" : "bg-background py-5 border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center group z-50">
            <img src={logoFull} alt={BRAND.name} className="h-[3.75rem] md:h-12 w-auto group-hover:opacity-90 transition-opacity" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 font-bold text-sm text-foreground/80">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-primary transition-colors py-2">
                Residential <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full left-0 w-72 bg-background border border-border/60 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <div className="p-3 flex flex-col gap-1">
                  {RESIDENTIAL_SERVICES.map(s => (
                    <Link key={s.slug} href={`/${s.slug}`} className="p-3 hover:bg-muted/50 rounded-lg transition-colors text-sm group/link flex items-center justify-between">
                      {s.name}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-primary" />
                    </Link>
                  ))}
                  <div className="h-px bg-border/50 my-2" />
                  <Link href="/gallery" className="p-3 hover:bg-primary/5 rounded-lg transition-colors text-sm text-primary flex items-center justify-between group/link">
                    View Gallery
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-primary transition-colors py-2">
                Commercial <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full left-0 w-72 bg-background border border-border/60 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <div className="p-3 flex flex-col gap-1">
                  <Link href="/commercial" className="p-3 bg-muted/30 hover:bg-muted/80 rounded-lg transition-colors text-sm font-extrabold flex items-center justify-between group/link">
                    Commercial Hub
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-primary" />
                  </Link>
                  {COMMERCIAL_SERVICES.map(s => (
                    <Link key={s.slug} href={`/${s.slug}`} className="p-3 hover:bg-muted/50 rounded-lg transition-colors text-sm group/link flex items-center justify-between">
                      {s.name}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-primary" />
                    </Link>
                  ))}
                  <div className="h-px bg-border/50 my-2" />
                  <Link href="/commercial-portfolio" className="p-3 hover:bg-primary/5 rounded-lg transition-colors text-sm text-primary flex items-center justify-between group/link">
                    View Portfolio
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
            <Link href="/service-areas" className="hover:text-primary transition-colors">Service Areas</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-6">
            <a href={`tel:${BRAND.phoneTel}`} className="flex items-center gap-2 font-extrabold text-foreground hover:text-primary transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              {BRAND.phoneDisplay}
            </a>
            <Link href="/get-a-quote">
              <Button className="font-extrabold tracking-wide rounded-full px-6 h-11 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                GET A QUOTE
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-foreground z-50 relative bg-muted/50 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <div className={`fixed inset-0 bg-background/98 backdrop-blur-xl z-40 transition-transform duration-300 pt-28 px-6 overflow-y-auto ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col gap-6 font-extrabold text-2xl pb-20">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
            
            <div className="h-px bg-border/50 my-2" />
            
            <span className="text-primary text-sm tracking-widest uppercase">Residential</span>
            <div className="flex flex-col gap-5 text-xl text-foreground/80 font-bold ml-4">
              {RESIDENTIAL_SERVICES.map(s => (
                <Link key={s.slug} href={`/${s.slug}`} className="hover:text-primary transition-colors">{s.name}</Link>
              ))}
              <Link href="/gallery" className="text-primary hover:text-primary/80 transition-colors">Gallery</Link>
            </div>

            <div className="h-px bg-border/50 my-2" />

            <span className="text-primary text-sm tracking-widest uppercase">Commercial</span>
            <div className="flex flex-col gap-5 text-xl text-foreground/80 font-bold ml-4">
              <Link href="/commercial" className="hover:text-primary transition-colors text-foreground">Commercial Hub</Link>
              {COMMERCIAL_SERVICES.map(s => (
                <Link key={s.slug} href={`/${s.slug}`} className="hover:text-primary transition-colors">{s.name}</Link>
              ))}
              <Link href="/commercial-portfolio" className="text-primary hover:text-primary/80 transition-colors">Portfolio</Link>
            </div>

            <div className="h-px bg-border/50 my-2" />
            
            <Link href="/service-areas" className="hover:text-primary transition-colors">Service Areas</Link>
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>

            <div className="mt-8 flex flex-col gap-4">
              <a href={`tel:${BRAND.phoneTel}`} className="flex items-center justify-center gap-3 font-extrabold text-foreground bg-muted p-5 rounded-2xl">
                <Phone className="h-6 w-6 text-primary" />
                {BRAND.phoneDisplay}
              </a>
              <Link href="/get-a-quote">
                <Button size="lg" className="w-full text-lg h-16 rounded-2xl shadow-xl shadow-primary/20">GET A QUOTE</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background pt-24 pb-12 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute inset-0 bg-topo-light opacity-50 pointer-events-none"></div>
        <BotanicalAccent variant="fern" className="hidden lg:block absolute left-2 bottom-8 h-64 w-auto text-primary/10" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            <div className="lg:col-span-4 space-y-8">
              <img src={logoWhite} alt={BRAND.name} className="h-14 w-auto" />
              <p className="text-background/70 text-base leading-relaxed font-medium max-w-sm">
                {BRAND.tagline} {BRAND.subTagline}.<br/>
                We are proud to serve {BRAND.county} and the {BRAND.region} with premium landscaping and lawn care services.
              </p>
              <div className="space-y-4 font-bold text-sm">
                <a href={`tel:${BRAND.phoneTel}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-background group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Phone className="h-4 w-4" /></div>
                  <span className="text-base tracking-wide">{BRAND.phoneDisplay}</span>
                </a>
                <a href={`mailto:${BRAND.email}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-background group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Mail className="h-4 w-4" /></div>
                  <span className="text-base tracking-wide">{BRAND.email}</span>
                </a>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-background"><MapPin className="h-4 w-4" /></div>
                  <span className="text-base tracking-wide">{BRAND.city}, {BRAND.state}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 lg:col-start-6">
              <h4 className="font-extrabold text-xl mb-6 text-white">Residential</h4>
              <ul className="space-y-4 text-sm font-medium text-background/70">
                {RESIDENTIAL_SERVICES.map(s => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}`} className="hover:text-primary transition-colors flex items-center gap-3 group text-base">
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {s.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/gallery" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-3 group text-base font-bold">
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    View Gallery
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <h4 className="font-extrabold text-xl mb-6 text-white">Commercial</h4>
              <ul className="space-y-4 text-sm font-medium text-background/70">
                <li>
                  <Link href="/commercial" className="text-white hover:text-primary transition-colors flex items-center gap-3 group text-base font-bold">
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Commercial Hub
                  </Link>
                </li>
                {COMMERCIAL_SERVICES.map(s => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}`} className="hover:text-primary transition-colors flex items-center gap-3 group text-base">
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="mt-10">
                <Link href="/get-a-quote">
                  <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white hover:text-foreground h-12 rounded-full font-bold tracking-wide">
                    REQUEST A QUOTE
                  </Button>
                </Link>
              </div>
            </div>

          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium text-background/50">
            <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <span className="flex items-center gap-2"><Leaf className="h-3 w-3" /> {BRAND.founded}</span>
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              <Link href="/service-areas" className="hover:text-white transition-colors">Service Areas</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            </div>
          </div>

          <div className="mt-6 flex justify-center md:justify-end">
            <a
              href="https://godigitalalchemy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-background/40 hover:text-background/70 transition-colors"
            >
              <span className="text-xs font-medium tracking-wide">Site by</span>
              <img src={daLogo} alt="Digital Alchemy" className="h-4 w-auto" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
