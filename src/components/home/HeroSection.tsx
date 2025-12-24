import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import allTeamLogo from "@/assets/allteamlogo.jpg";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function HeroSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const { data: settings } = useQuery({
    queryKey: ["tournament-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!settings?.start_date) return;

    const calculateTimeLeft = () => {
      const targetDate = new Date(settings.start_date!).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [settings?.start_date]);

  const countdownDescription = (settings as any)?.countdown_description || "Get ready for the most exciting cricket tournament!";
  const hasCountdown = !!settings?.start_date;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${allTeamLogo})` }}
      />
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background" />
      
      {/* Animated glow effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/30 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-cricket-green animate-pulse" />
            <span className="text-sm font-medium text-primary">Season 2025 Registration Open</span>
          </div>

          {/* Main Title - Reduced Size */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide mb-4 animate-fade-in">
            <span className="text-foreground">GOLD COAST</span>
            <br />
            <span className="text-gradient-gold">NEPALESE PREMIER LEAGUE</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
            Experience the thrill of cricket as the best Nepalese players battle it out 
            for glory in Australia's premier community cricket tournament.
          </p>

          {/* Countdown Timer */}
          {hasCountdown && (
            <div className="mb-8 animate-fade-in">
              <h2 className="font-display text-xl md:text-2xl text-primary/90 mb-2">
                Tournament Starts In
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {countdownDescription}
              </p>
              <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-lg mx-auto">
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Min" },
                  { value: timeLeft.seconds, label: "Sec" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="bg-card/60 backdrop-blur-md border border-primary/20 rounded-xl p-3 md:p-4 shadow-lg shadow-primary/5"
                  >
                    <div className="font-display text-2xl md:text-4xl text-primary">
                      {String(value).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
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
        </div>
      </div>

      {/* Transition Bridge - Wave/Curve Shape */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1440 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path 
            d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" 
            className="fill-background"
          />
          <path 
            d="M0 120L48 114C96 108 192 96 288 90C384 84 480 84 576 87C672 90 768 96 864 96C960 96 1056 90 1152 84C1248 78 1344 72 1392 69L1440 66V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" 
            className="fill-primary/5"
          />
        </svg>
      </div>
    </section>
  );
}
