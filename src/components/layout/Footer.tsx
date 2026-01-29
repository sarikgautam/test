import { Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import gcnplLogo from "@/assets/gcnpl-logo.png";

export function Footer() {
  const { data: supportClubs } = useQuery({
    queryKey: ["support-clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_club")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <footer className="bg-card border-t border-primary/20 shadow-lg shadow-primary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <img 
                  src={gcnplLogo} 
                  alt="GCNPL Logo" 
                  className="w-10 h-10 object-contain drop-shadow-md"
                />
              </div>
              <div>
                <h3 className="font-display text-2xl tracking-wide bg-gradient-to-r from-primary to-vibrant-orange bg-clip-text text-transparent font-bold">GCNPL</h3>
                <p className="text-xs text-muted-foreground">Gold Coast Nepalese Premier League</p>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm">
              Uniting the community through the spirit of cricket.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg tracking-wide mb-4 bg-gradient-to-r from-primary to-vibrant-orange bg-clip-text text-transparent font-bold">Quick Links</h4>
            <ul className="space-y-2">
              {["Teams", "Fixtures", "Standings", "Stats", "Register"].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase()}`}
                    className="text-muted-foreground hover:text-primary hover:font-semibold transition-all duration-300 text-sm"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg tracking-wide mb-4 bg-gradient-to-r from-vibrant-cyan to-vibrant-purple bg-clip-text text-transparent font-bold">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                Gold Coast, Australia
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                gcnpleague@gmail.com
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-lg tracking-wide mb-4 bg-gradient-to-r from-vibrant-pink to-vibrant-orange bg-clip-text text-transparent font-bold">Follow Us</h4>
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: "Facebook", color: "221 83% 53%" },
                { icon: Instagram, label: "Instagram", color: "330 100% 55%" },
                { icon: Youtube, label: "YouTube", color: "0 100% 50%" },
              ].map(({ icon: Icon, label, color }) => (
                <a
                  key={label}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-secondary/50 hover:shadow-lg hover:scale-110 flex items-center justify-center transition-all duration-300 border border-primary/20 hover:border-primary/50"
                  style={{ 
                    backgroundColor: `hsl(${color} / 0.1)`,
                    borderColor: `hsl(${color} / 0.3)`
                  }}
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${color})` }} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Support Club Section */}
        {supportClubs && supportClubs.length > 0 && (
          <div className="mt-8 pt-8 border-t border-border">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm font-medium">Supported By</p>
              <div className="flex flex-wrap justify-center items-center gap-6">
                {supportClubs.map((club) => (
                  <a
                    key={club.id}
                    href={club.website_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      className="h-20 w-auto object-contain"
                    />
                    <span className="text-base font-medium text-foreground">
                      {club.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Acknowledgement of Traditional Owners - Full Footer Plain Text */}
        <div className="w-full bg-background text-white flex flex-col items-center justify-center py-10 mt-12 border-t border-border">
          <img src="/abo.jpg" alt="Aboriginal Flag" className="w-24 h-16 mb-4" />
          <div className="max-w-4xl w-full flex flex-col items-center px-4">
            <span className="text-2xl md:text-3xl font-bold mb-2">Acknowledgement of Country</span>
            <p className="text-base md:text-lg font-normal leading-relaxed text-center">
              We acknowledge the Traditional Owners of the lands and waters upon which we work, play, live, and sustain ourselves. This land was never ceded, and we acknowledge that the Queensland Aboriginal people are its continuing custodians. We pay our respects to Elders past and present.
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Gold Coast Nepalese Premier League 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
