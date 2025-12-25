import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useSeason";
import allTeamLogo from "@/assets/allteamlogo.jpg";
import { Trophy } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type SeasonState = "upcoming" | "live" | "ended";

export function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [seasonState, setSeasonState] = useState<SeasonState>("upcoming");
  const { activeSeason } = useActiveSeason();

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

  // Fetch winner team if season has ended
  const { data: winnerTeam } = useQuery({
    queryKey: ["winner-team", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return null;
      const { data, error } = await supabase
        .from("standings")
        .select("*, teams(*)")
        .eq("season_id", activeSeason.id)
        .order("points", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: seasonState === "ended" && !!activeSeason?.id,
  });

  useEffect(() => {
    if (!settings?.start_date || !settings?.end_date) return;

    const calculateTimeLeft = () => {
      const startDate = new Date(settings.start_date!).getTime();
      const endDate = new Date(settings.end_date!).getTime();
      const now = new Date().getTime();

      // Determine season state
      if (now < startDate) {
        // Season hasn't started yet
        setSeasonState("upcoming");
        const difference = startDate - now;
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else if (now >= startDate && now < endDate) {
        // Season is live
        setSeasonState("live");
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        // Season has ended
        setSeasonState("ended");
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [settings?.start_date, settings?.end_date]);

  if (!settings?.start_date || !settings?.end_date) return null;

  const countdownDescription = (settings as any).countdown_description || "Get ready for the most exciting cricket tournament!";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${allTeamLogo})` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {seasonState === "upcoming" && (
            <>
              <h2 className="font-display text-3xl md:text-4xl text-gradient-gold mb-4">
                Tournament Starts In
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                {countdownDescription}
              </p>

              {/* Countdown Timer */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Minutes" },
                  { value: timeLeft.seconds, label: "Seconds" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="bg-card/80 backdrop-blur border border-border/50 rounded-xl p-4 md:p-6"
                  >
                    <div className="font-display text-4xl md:text-6xl text-primary mb-2">
                      {String(value).padStart(2, "0")}
                    </div>
                    <div className="text-sm md:text-base text-muted-foreground uppercase tracking-wider">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {seasonState === "live" && (
            <>
              <h2 className="font-display text-3xl md:text-4xl text-gradient-gold mb-4">
                🏏 Season is LIVE! 🏏
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Season continues until {formatDate(settings.end_date!)}
              </p>
              <div className="bg-card/80 backdrop-blur border border-border/50 rounded-xl p-8 md:p-12">
                <p className="text-primary text-xl font-semibold">
                  Join us for the most exciting cricket tournament!
                </p>
              </div>
            </>
          )}

          {seasonState === "ended" && (
            <>
              <h2 className="font-display text-3xl md:text-5xl text-gradient-gold mb-4 flex items-center justify-center gap-3">
                <Trophy className="w-10 h-10 text-yellow-500" />
                Congratulations!
                <Trophy className="w-10 h-10 text-yellow-500" />
              </h2>
              {winnerTeam ? (
                <>
                  <p className="text-muted-foreground text-lg mb-8">
                    {(winnerTeam as any).teams?.name || "Champion Team"} wins the tournament!
                  </p>
                  <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur border border-yellow-500/30 rounded-xl p-8 md:p-12">
                    <div className="mb-4">
                      {(winnerTeam as any).teams?.logo_url && (
                        <img
                          src={(winnerTeam as any).teams.logo_url}
                          alt="Champion"
                          className="w-24 h-24 mx-auto rounded-full object-cover mb-4 border-2 border-yellow-500"
                        />
                      )}
                    </div>
                    <p className="text-primary text-2xl font-bold mb-2">
                      {(winnerTeam as any).teams?.name}
                    </p>
                    <p className="text-muted-foreground text-lg">
                      Total Points: <span className="text-yellow-500 font-bold">{winnerTeam.points}</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-card/80 backdrop-blur border border-border/50 rounded-xl p-8 md:p-12">
                  <p className="text-primary text-xl font-semibold">
                    Thank you for an amazing tournament!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
