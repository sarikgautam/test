import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import allTeamLogo from "@/assets/allteamlogo.jpg";
import { useActiveSeason } from "@/hooks/useSeason";
import { supabase } from "@/integrations/supabase/client";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function HeroSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { activeSeason } = useActiveSeason();

  const countdownStartDate = activeSeason?.start_date ?? null;

  useEffect(() => {
    if (!countdownStartDate) return;

    const calculateTimeLeft = () => {
      const targetDate = new Date(countdownStartDate).getTime();
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
  }, [countdownStartDate]);

  const countdownDescription = useMemo(() => {
    if (activeSeason?.countdown_description) {
      return activeSeason.countdown_description as string;
    }
    const now = new Date();
    const start = activeSeason?.start_date ? new Date(activeSeason.start_date) : null;
    const end = activeSeason?.end_date ? new Date(activeSeason.end_date) : null;
    if (start && now < start) return "Countdown to kick-off";
    if (start && end && now >= start && now <= end) return "Season is live";
    if (end && now > end) return "Season concluded — thanks, see you next season";
    return "Get ready for the most exciting cricket tournament!";
  }, [activeSeason?.countdown_description, activeSeason?.start_date, activeSeason?.end_date]);
  const hasCountdown = useMemo(() => {
    if (!countdownStartDate) return false;
    return new Date(countdownStartDate) > new Date();
  }, [countdownStartDate]);
  const isRegistrationOpen = !!activeSeason?.registration_open;

  const now = new Date();
  const seasonStart = activeSeason?.start_date ? new Date(activeSeason.start_date) : null;
  const seasonEnd = activeSeason?.end_date ? new Date(activeSeason.end_date) : null;

  const badgeText = useMemo(() => {
    const now = new Date();
    const start = seasonStart;
    const end = seasonEnd;

    if (start && now < start) {
      return "Tournament starting soon";
    }
    if (start && end && now >= start && now <= end) {
      return "Season is live";
    }
    if (end && now > end) {
      return "Season concluded - See you next season";
    }

    return "Tournament updates coming soon";
  }, [seasonStart, seasonEnd]);

  // Live match spotlight (shows the top/most recent live match)
  const { data: liveMatches } = useQuery({
    queryKey: ["home-hero-live-match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          venue,
          home_team_score,
          away_team_score,
          home_team:teams!matches_home_team_id_fkey(id, name, short_name, primary_color, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, short_name, primary_color, logo_url)
        `)
        .eq("status", "live")
        .order("match_date", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data || [];
    },
    // Light polling to keep scores fresh
    refetchInterval: 10000,
  });

  const liveMatch = liveMatches?.[0];

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
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-vibrant-cyan/30 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-vibrant-purple/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {liveMatch && (
            <Link
              to={`/fixtures/${liveMatch.id}`}
              className="group inline-flex items-center gap-4 px-4 py-3 mb-6 rounded-2xl bg-white/10 backdrop-blur-md border border-primary/40 shadow-lg shadow-primary/20 hover:border-primary/70 transition-colors"
            >
              <span className="flex items-center gap-2 text-red-500 font-semibold text-sm uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Now
              </span>
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center gap-2">
                  {liveMatch.home_team?.logo_url ? (
                    <img src={liveMatch.home_team.logo_url} alt={liveMatch.home_team.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/20 text-primary font-semibold text-xs">
                      {liveMatch.home_team?.short_name?.slice(0, 2) || "HM"}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-foreground">{liveMatch.home_team?.short_name}</div>
                    <div className="text-sm text-muted-foreground">{liveMatch.home_team_score || "-"}</div>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">vs</div>

                <div className="flex items-center gap-2">
                  {liveMatch.away_team?.logo_url ? (
                    <img src={liveMatch.away_team.logo_url} alt={liveMatch.away_team.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/20 text-secondary-foreground font-semibold text-xs">
                      {liveMatch.away_team?.short_name?.slice(0, 2) || "AW"}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-foreground">{liveMatch.away_team?.short_name}</div>
                    <div className="text-sm text-muted-foreground">{liveMatch.away_team_score || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-primary text-sm font-semibold group-hover:translate-x-1 transition-transform">
                Watch live <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          )}

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-vibrant-cyan/20 border border-primary/40 mb-6 animate-fade-in shadow-lg shadow-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">{badgeText}</span>
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
                  { value: timeLeft.days, label: "Days", color: "from-primary to-vibrant-orange" },
                  { value: timeLeft.hours, label: "Hours", color: "from-vibrant-cyan to-secondary" },
                  { value: timeLeft.minutes, label: "Min", color: "from-vibrant-purple to-vibrant-pink" },
                  { value: timeLeft.seconds, label: "Sec", color: "from-secondary to-primary" },
                ].map(({ value, label, color }) => (
                  <div
                    key={label}
                    className={`bg-card/80 backdrop-blur-md border-2 border-primary/30 rounded-xl p-3 md:p-4 shadow-lg hover:border-primary/50 transition-colors`}
                  >
                    <div className="font-display text-2xl md:text-4xl font-bold text-primary">
                      {String(value).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            {isRegistrationOpen ? (
              <>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/register" className="group">
                    Register for Auction
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
                  <Link to="/teams">View Teams</Link>
                </Button>
              </>
            )}
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
