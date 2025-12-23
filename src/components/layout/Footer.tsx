import { Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import gcnplLogo from "@/assets/gcnpl-logo.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={gcnplLogo} 
                alt="GCNPL Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="font-display text-2xl tracking-wide text-foreground">GCNPL</h3>
                <p className="text-xs text-muted-foreground">Gold Coast Nepalese Premier League</p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm">
              Uniting the Nepalese community through the spirit of cricket in Gold Coast, Australia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg tracking-wide mb-4 text-primary">Quick Links</h4>
            <ul className="space-y-2">
              {["Teams", "Fixtures", "Standings", "Stats", "Register"].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase()}`}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg tracking-wide mb-4 text-primary">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Gold Coast, Queensland, Australia
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                contact@gcnpl.com.au
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-lg tracking-wide mb-4 text-primary">Follow Us</h4>
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Gold Coast Nepalese Premier League. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
