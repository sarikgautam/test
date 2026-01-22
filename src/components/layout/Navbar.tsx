import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Trophy, Users, Calendar, BarChart3, UserPlus, Gavel, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import gcnplLogo from "@/assets/gcnpl-logo.png";

const navLinks = [
  { href: "/", label: "Home", icon: Trophy },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/fixtures", label: "Fixtures", icon: Calendar },
  { href: "/standings", label: "Standings", icon: BarChart3 },
  { href: "/stats", label: "Stats", icon: TrendingUp },
  { href: "/auction", label: "Auction", icon: Gavel },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setShowNavbar(false); // scrolling down
      } else {
        setShowNavbar(true); // scrolling up
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={
      `fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/10 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`
    }>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <img 
                src={gcnplLogo} 
                alt="GCNPL Logo" 
                className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-md"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-xl md:text-2xl tracking-wide bg-gradient-to-r from-primary to-vibrant-orange bg-clip-text text-transparent font-bold">GCNPL</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground -mt-1">Uniting Community</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border",
                    isActive
                      ? "bg-gradient-to-r from-primary to-vibrant-orange text-primary-foreground shadow-lg border-primary/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-transparent hover:border-primary/30"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA Button & Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <Button variant="hero" size="lg" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 border",
                      isActive
                        ? "bg-gradient-to-r from-primary to-vibrant-orange text-primary-foreground shadow-lg border-primary/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-transparent hover:border-primary/30"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-4 mt-2 border-t border-border/50">
                <Button variant="hero" size="lg" className="w-full" asChild>
                  <Link to="/register" onClick={() => setIsOpen(false)}>Register</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
