import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy-dark to-background" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cricket-green/20 rounded-full blur-3xl animate-pulse-slow delay-500" />
      </div>
      
      {/* Cricket Ball Pattern */}
      <div className="absolute inset-0 bg-cricket-pattern opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-cricket-green animate-pulse" />
            <span className="text-sm font-medium text-primary">Season 2025 Registration Open</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wide mb-6 animate-fade-in-up delay-100">
            <span className="text-foreground">GOLD COAST</span>
            <br />
            <span className="text-gradient-gold">NEPALESE PREMIER LEAGUE</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
            Experience the thrill of cricket as the best Nepalese players battle it out 
            for glory in Australia's premier community cricket tournament.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up delay-300">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register" className="group">
                Register for Auction
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/fixtures">View Fixtures</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-xl mx-auto animate-fade-in-up delay-400">
            {[
              { icon: Trophy, value: "6", label: "Teams" },
              { icon: Users, value: "90+", label: "Players" },
              { icon: Calendar, value: "15", label: "Matches" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-display text-2xl md:text-3xl text-foreground">{value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
