import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Clock, Trophy } from "lucide-react";

export function RegistrationCTA() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy-dark to-navy" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-cricket-green/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Registration Closing Soon</span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-foreground mb-6">
            Ready to Play in the <span className="text-gradient-gold">Premier League?</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Register now for the player auction and get a chance to represent one of the six franchises. 
            Show your skills and become a part of the GCNPL family.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register" className="group">
                <UserPlus className="w-5 h-5" />
                Register Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/teams">View Teams</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: UserPlus, title: "Easy Registration", desc: "Simple online form to join the auction pool" },
              { icon: Trophy, title: "Compete to Win", desc: "Play for glory and the championship trophy" },
              { icon: Clock, title: "Fair Auction", desc: "Transparent bidding process for all teams" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl bg-card/50 backdrop-blur border border-border/50">
                <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
