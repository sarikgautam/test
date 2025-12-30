import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Clock, Trophy } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";
import { useMemo } from "react";

export function RegistrationCTA() {
  const { activeSeason } = useActiveSeason();
  
  const isRegistrationOpen = !!activeSeason?.registration_open;
  
  const badgeText = useMemo(() => {
    if (isRegistrationOpen) {
      return "Registration Open Now";
    }
    const now = new Date();
    const start = activeSeason?.start_date ? new Date(activeSeason.start_date) : null;
    if (start && now < start) {
      return "Registration Closing Soon";
    }
    return "Registration Closed";
  }, [isRegistrationOpen, activeSeason?.start_date]);
  
  const badgeColor = isRegistrationOpen 
    ? "from-vibrant-cyan to-secondary" 
    : "from-primary to-vibrant-orange";

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-card/50" />
      
      {/* Animated Glow Effects */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-vibrant-cyan/30 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-vibrant-purple/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${badgeColor} border border-primary/40 mb-6 animate-fade-in shadow-lg`} style={{ boxShadow: `0 0 20px hsl(${isRegistrationOpen ? '180 100% 50%' : '12 100% 50%'} / 0.3)` }}>
            <Clock className={`w-4 h-4 ${isRegistrationOpen ? 'text-vibrant-cyan' : 'text-primary'} animate-pulse`} />
            <span className={`text-sm font-bold ${isRegistrationOpen ? 'text-secondary' : 'text-primary'}`}>{badgeText}</span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide mb-6 animate-slide-up">
            <span className="text-foreground">Ready to Play in the</span>
            <br />
            <span className="text-gradient-gold">Premier League?</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Register now for the player auction and get a chance to represent one of the six franchises. 
            Show your skills and become a part of the GCNPL family.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {isRegistrationOpen ? (
              <>
                <Button variant="hero" size="xl" asChild className="group">
                  <Link to="/register">
                    <UserPlus className="w-5 h-5" />
                    Register Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/fixtures">View Fixtures</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/fixtures">View Fixtures</Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/standings">View Standings</Link>
                </Button>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            {[
              { icon: UserPlus, title: "Easy Registration", desc: "Simple online form to join the auction pool", color: "from-primary to-vibrant-orange" },
              { icon: Trophy, title: "Compete to Win", desc: "Play for glory and the championship trophy", color: "from-vibrant-cyan to-secondary" },
              { icon: Clock, title: "Fair Auction", desc: "Transparent bidding process for all teams", color: "from-vibrant-purple to-vibrant-pink" },
            ].map(({ icon: Icon, title, desc, color }, idx) => (
              <div key={title} className={`p-6 rounded-xl bg-gradient-to-br ${color} opacity-10 backdrop-blur border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg group`} style={{ animationDelay: `${300 + idx * 100}ms` }}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
