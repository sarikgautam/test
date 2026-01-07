import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Clock, Trophy, CheckCircle2, XCircle, Minus } from "lucide-react";
import { formatLocalTime } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Match {
  id: string;
  match_number: number;
  match_date: string;
  venue: string;
  status: string;
  match_stage?: string | null;
  winner_team_id?: string | null;
  home_team_score?: string | null;
  away_team_score?: string | null;
  match_summary?: string | null;
  season?: { id: string; name: string };
  home_team: { id: string; name: string; short_name: string; primary_color: string; logo_url: string | null };
  away_team: { id: string; name: string; short_name: string; primary_color: string; logo_url: string | null };
}

export function UpcomingMatches() {
  const { data: matches, isLoading, error: queryError } = useQuery({
    queryKey: ["upcoming-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_number,
          match_date,
          venue,
          status,
          match_stage,
          winner_team_id,
          home_team_score,
          away_team_score,
          match_summary,
          season:seasons(id, name),
          home_team:teams!matches_home_team_id_fkey(id, name, short_name, primary_color, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, short_name, primary_color, logo_url)
        `)
        .in("status", ["upcoming", "completed", "live"])
        .order("match_date", { ascending: true })
        .limit(12);

      if (error) {
        console.error("[UpcomingMatches] Query error:", error);
        throw error;
      }
      console.log("[UpcomingMatches] Query data:", data);
      return data as Match[];
    },
  });

  if (queryError) {
    console.error("[UpcomingMatches] Query error from hook:", queryError);
  }

  const live = matches?.filter((m) => m.status === "live") || [];
  const upcoming = matches?.filter((m) => m.status === "upcoming").slice(0, 3) || [];
  const completed = matches?.filter((m) => m.status === "completed").reverse().slice(0, 3) || [];

  const getResult = (match: Match) => {
    // Use match_summary if available (set by admins)
    if (match.match_summary) {
      return match.match_summary;
    }

    // Fallback to dynamic calculation if match_summary is not set
    if (!match.home_team_score || !match.away_team_score || !match.winner_team_id) return null;

    const parseScore = (score: string) => {
      const [runsPart, wicketsPart] = score.split("/");
      const runs = parseInt(runsPart, 10);
      const wickets = wicketsPart ? parseInt(wicketsPart, 10) : null;
      return { runs, wickets };
    };

    const home = parseScore(match.home_team_score);
    const away = parseScore(match.away_team_score);
    const homeWon = match.winner_team_id === match.home_team.id;

    if (homeWon) {
      const runsDiff = home.runs - away.runs;
      if (away.wickets === 10 || away.wickets === null) return `${match.home_team.short_name} won by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
      const wicketsRemaining = 10 - (home.wickets ?? 0);
      return `${match.home_team.short_name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    }

    const runsDiff = away.runs - home.runs;
    if (home.wickets === 10 || home.wickets === null) return `${match.away_team.short_name} won by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
    const wicketsRemaining = 10 - (away.wickets ?? 0);
    return `${match.away_team.short_name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
  };

  const getMatchLabel = (match: Match) => {
    if (match.match_stage === 'final') return 'Final';
    if (match.match_stage === 'eliminator') return 'Eliminator';
    if (match.match_stage === 'qualifier') return 'Qualifier';
    if (match.match_stage === 'group') return `Match ${match.match_number}`;
    return `Match ${match.match_number}`;
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
            {/* Live Matches Highlight */}
            {live.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl text-foreground">Live <span className="text-gradient-gold">Now</span></h3>
                    <p className="text-muted-foreground text-sm mt-1">Tap to view live scorecard</p>
                  </div>
                  <Button variant="ghost" asChild className="hidden sm:flex">
                    <Link to="/fixtures">Go to fixtures</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {live.map((match, index) => {
                    const resultColor = match.home_team.primary_color || "#dc2626";
                    return (
                      <Link
                        key={match.id}
                        to={`/fixtures/${match.id}`}
                        className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover animate-fade-in-up block"
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-primary to-red-500 animate-pulse" />
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-500/15 text-red-600 border border-red-500/30 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              Live
                            </span>
                            {(match as any).season?.name && (
                              <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                                {(match as any).season.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex-1 text-center">
                              {match.home_team?.logo_url ? (
                                <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-12 h-12 mx-auto rounded-full object-cover mb-1" />
                              ) : (
                                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold text-white mb-1" style={{ backgroundColor: match.home_team?.primary_color }}>
                                  {match.home_team?.short_name?.substring(0, 2) || "TBA"}
                                </div>
                              )}
                              <p className="text-sm font-medium text-foreground truncate">{match.home_team?.short_name}</p>
                              <p className="text-xs font-semibold text-foreground">{match.home_team_score || "-"}</p>
                            </div>

                            <div className="text-lg font-display text-red-500 flex flex-col items-center gap-1">
                              <span>vs</span>
                              <span className="text-xs font-semibold text-muted-foreground">Live</span>
                            </div>

                            <div className="flex-1 text-center">
                              {match.away_team?.logo_url ? (
                                <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-12 h-12 mx-auto rounded-full object-cover mb-1" />
                              ) : (
                                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold text-white mb-1" style={{ backgroundColor: match.away_team?.primary_color }}>
                                  {match.away_team?.short_name?.substring(0, 2) || "TBA"}
                                </div>
                              )}
                              <p className="text-sm font-medium text-foreground truncate">{match.away_team?.short_name}</p>
                              <p className="text-xs font-semibold text-foreground">{match.away_team_score || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: resultColor }}>
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span>Live scoring</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {match.venue}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
              Upcoming <span className="text-gradient-gold">Matches</span>
            </h2>
            <p className="text-muted-foreground mt-2">Don't miss the action</p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link to="/fixtures">View All</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : matches && matches.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((match, index) => (
              <div
                key={match.id}
                className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                
                <div className="p-6">
                  {/* Match Number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {getMatchLabel(match)}
                    </span>
                    {(match as any).season?.name && (
                      <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                        {(match as any).season.name}
                      </span>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex-1 text-center">
                      {match.home_team?.logo_url ? (
                        <img 
                          src={match.home_team.logo_url} 
                          alt={match.home_team.name}
                          className="w-14 h-14 mx-auto rounded-full object-cover mb-2"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-bold text-white mb-2"
                          style={{ backgroundColor: match.home_team?.primary_color || "#1e3a8a" }}
                        >
                          {match.home_team?.short_name?.substring(0, 2) || "TBA"}
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground truncate">
                        {match.home_team?.name || "TBA"}
                      </p>
                    </div>
                    
                    <div className="text-2xl font-display text-muted-foreground">VS</div>
                    
                    <div className="flex-1 text-center">
                      {match.away_team?.logo_url ? (
                        <img 
                          src={match.away_team.logo_url} 
                          alt={match.away_team.name}
                          className="w-14 h-14 mx-auto rounded-full object-cover mb-2"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-bold text-white mb-2"
                          style={{ backgroundColor: match.away_team?.primary_color || "#dc2626" }}
                        >
                          {match.away_team?.short_name?.substring(0, 2) || "TBA"}
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground truncate">
                        {match.away_team?.name || "TBA"}
                      </p>
                    </div>
                  </div>

                  {/* Venue & Time */}
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLocalTime(match.match_date, "h:mm a")}
                    </span>
                  </div>
                </div>
                </div>
              ))}
            </div>

            {/* Recent Results */}
            {completed.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl text-foreground">Recent <span className="text-gradient-gold">Results</span></h3>
                    <p className="text-muted-foreground text-sm mt-1">Latest completed matches with winning margin</p>
                  </div>
                  <Button variant="ghost" asChild className="hidden sm:flex">
                    <Link to="/fixtures">See all results</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completed.map((match, index) => {
                    const resultText = getResult(match);
                    const homeWon = match.winner_team_id === match.home_team.id;
                    const resultColor = homeWon ? match.home_team.primary_color : match.away_team.primary_color;
                    const isDraw = !match.winner_team_id;

                    return (
                      <Link
                        key={match.id}
                        to={`/fixtures/${match.id}`}
                        className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover animate-fade-in-up block"
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: resultColor }} />
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: `${resultColor}22`, color: resultColor }}>
                              {getMatchLabel(match)}
                            </span>
                            {(match as any).season?.name && (
                              <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                                {(match as any).season.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex-1 text-center">
                              {match.home_team?.logo_url ? (
                                <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-12 h-12 mx-auto rounded-full object-cover mb-1" />
                              ) : (
                                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold text-white mb-1" style={{ backgroundColor: match.home_team?.primary_color }}>
                                  {match.home_team?.short_name?.substring(0, 2) || "TBA"}
                                </div>
                              )}
                              <p className="text-sm font-medium text-foreground truncate">{match.home_team?.short_name}</p>
                              <p className="text-xs text-muted-foreground">{match.home_team_score || "-"}</p>
                            </div>

                            <div className="text-lg font-display text-muted-foreground">vs</div>

                            <div className="flex-1 text-center">
                              {match.away_team?.logo_url ? (
                                <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-12 h-12 mx-auto rounded-full object-cover mb-1" />
                              ) : (
                                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold text-white mb-1" style={{ backgroundColor: match.away_team?.primary_color }}>
                                  {match.away_team?.short_name?.substring(0, 2) || "TBA"}
                                </div>
                              )}
                              <p className="text-sm font-medium text-foreground truncate">{match.away_team?.short_name}</p>
                              <p className="text-xs text-muted-foreground">{match.away_team_score || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: resultColor }}>
                              {isDraw ? (
                                <Minus className="w-4 h-4" />
                              ) : match.winner_team_id === match.home_team.id ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span>{resultText || "Result pending"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {match.venue}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming matches scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for fixture updates</p>
          </div>
        )}

        <div className="mt-8 sm:hidden text-center">
          <Button variant="outline" asChild>
            <Link to="/fixtures">View All Fixtures</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
