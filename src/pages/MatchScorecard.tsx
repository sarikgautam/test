import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Calendar, MapPin, Star, Award } from "lucide-react";
import { formatLocalTime } from "@/lib/utils";

interface PlayerStat {
  id: string;
  player_id: string;
  runs_scored: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  overs_bowled: number;
  runs_conceded: number;
  wickets: number;
  maidens: number;
  catches: number;
  stumpings: number;
  run_outs: number;
  dismissal_type: string | null;
  bowler_id: string | null;
  fielder_id: string | null;
  runout_by_id: string | null;
  dismissal_other_text: string | null;
  player: {
    id: string;
    full_name: string;
    role: string;
    team_id: string;
  };
  bowler?: {
    id: string;
    full_name: string;
  } | null;
  fielder?: {
    id: string;
    full_name: string;
  } | null;
  runout_by?: {
    id: string;
    full_name: string;
  } | null;
}

const MatchScorecard = () => {
  const { matchId } = useParams<{ matchId: string }>();

  // Fetch match details
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match-detail", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          winner:teams!matches_winner_team_id_fkey(*),
          toss_winner:teams!matches_toss_winner_id_fkey(*),
          man_of_match:players!matches_man_of_match_id_fkey(*)
        `)
        .eq("id", matchId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  // Fetch player stats for match
  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: ["match-player-stats", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select(`
          id,
          player_id,
          match_id,
          season_id,
          runs_scored,
          balls_faced,
          fours,
          sixes,
          overs_bowled,
          runs_conceded,
          wickets,
          maidens,
          catches,
          stumpings,
          run_outs,
          dismissal_type,
          bowler_id,
          fielder_id,
          runout_by_id,
          dismissal_other_text,
          created_at,
          player:players!player_stats_player_id_fkey(id, full_name, role)
        `)
        .eq("match_id", matchId!);
      
      if (error) {
        throw error;
      }
      
      // Get team info from player_season_registrations for this season
      if (data && data.length > 0) {
        const seasonId = data[0].season_id;
        const playerIds = [...new Set(data.map(s => s.player_id))];
        
        const { data: registrations } = await supabase
          .from("player_season_registrations")
          .select("player_id, team_id")
          .eq("season_id", seasonId)
          .in("player_id", playerIds);
        
        // Create a map of player_id -> team_id
        const playerTeamMap = new Map();
        registrations?.forEach(reg => {
          playerTeamMap.set(reg.player_id, reg.team_id);
        });
        
        // Get all unique bowler, fielder, and runout_by IDs
        const allPlayerIdsForNames = new Set<string>();
        data.forEach(stat => {
          if (stat.bowler_id) allPlayerIdsForNames.add(stat.bowler_id);
          if (stat.fielder_id) allPlayerIdsForNames.add(stat.fielder_id);
          if (stat.runout_by_id) allPlayerIdsForNames.add(stat.runout_by_id);
        });
        
        // Fetch names for bowlers, fielders, runout_by players
        let playerNamesMap = new Map();
        if (allPlayerIdsForNames.size > 0) {
          const { data: playerNames } = await supabase
            .from("players")
            .select("id, full_name")
            .in("id", Array.from(allPlayerIdsForNames));
          
          playerNames?.forEach(p => {
            playerNamesMap.set(p.id, p.full_name);
          });
        }
        
        // Add team_id and dismissal player names to each stat
        data.forEach(stat => {
          if (stat.player) {
            stat.player.team_id = playerTeamMap.get(stat.player_id) || null;
          }
          
          // Add bowler, fielder, runout_by objects
          if (stat.bowler_id) {
            stat.bowler = {
              id: stat.bowler_id,
              full_name: playerNamesMap.get(stat.bowler_id) || ''
            };
          }
          if (stat.fielder_id) {
            stat.fielder = {
              id: stat.fielder_id,
              full_name: playerNamesMap.get(stat.fielder_id) || ''
            };
          }
          if (stat.runout_by_id) {
            stat.runout_by = {
              id: stat.runout_by_id,
              full_name: playerNamesMap.get(stat.runout_by_id) || ''
            };
          }
        });
      }
      
      return data as PlayerStat[];
    },
    enabled: !!matchId,
  });

  // Fetch match awards
  const { data: matchAwards } = useQuery({
    queryKey: ["match-awards", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_awards")
        .select(`
          *,
          award_type:award_types(*),
          player:players(id, full_name)
        `)
        .eq("match_id", matchId!);
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  const isLoading = matchLoading || statsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto max-w-5xl space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Match not found</h1>
            <Link to="/fixtures">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Fixtures
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Separate stats by team
  const homeTeamStats = playerStats?.filter((s) => s.player?.team_id === match.home_team_id) || [];
  const awayTeamStats = playerStats?.filter((s) => s.player?.team_id === match.away_team_id) || [];

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "-";
    return ((runs / balls) * 100).toFixed(1);
  };

  const calculateEconomy = (runs: number, overs: number) => {
    if (overs === 0) return "-";
    return (runs / overs).toFixed(2);
  };

  const formatDismissal = (stat: PlayerStat) => {
    if (!stat.dismissal_type || stat.dismissal_type === "not_out") {
      return <span className="text-emerald-500 font-medium">not out</span>;
    }

    const bowlerName = stat.bowler?.full_name || "";
    const fielderName = stat.fielder?.full_name || "";
    const runoutByName = stat.runout_by?.full_name || "";
    
    switch (stat.dismissal_type) {
      case "caught":
        // Format: c fielder b bowler
        if (fielderName && bowlerName) {
          return (
            <span className="text-muted-foreground text-xs">
              c {fielderName} b {bowlerName}
            </span>
          );
        } else if (bowlerName) {
          return (
            <span className="text-muted-foreground text-xs">
              c & b {bowlerName}
            </span>
          );
        }
        return (
          <span className="text-muted-foreground text-xs">
            caught
          </span>
        );
      case "bowled":
        // Format: b bowler
        return (
          <span className="text-muted-foreground text-xs">
            {bowlerName ? `b ${bowlerName}` : "bowled"}
          </span>
        );
      case "lbw":
        // Format: lbw bowler
        return (
          <span className="text-muted-foreground text-xs">
            {bowlerName ? `lbw ${bowlerName}` : "lbw"}
          </span>
        );
      case "runout":
        // Format: run out (fielder)
        return (
          <span className="text-muted-foreground text-xs">
            {runoutByName ? `run out (${runoutByName})` : "run out"}
          </span>
        );
      case "stumped":
        // Format: st fielder b bowler
        if (fielderName && bowlerName) {
          return (
            <span className="text-muted-foreground text-xs">
              st {fielderName} b {bowlerName}
            </span>
          );
        }
        return (
          <span className="text-muted-foreground text-xs">
            {fielderName ? `st ${fielderName}` : "stumped"}
          </span>
        );
      case "mankad":
        return (
          <span className="text-muted-foreground text-xs">
            {bowlerName ? `mankad ${bowlerName}` : "mankad"}
          </span>
        );
      case "retired_hurt":
        return (
          <span className="text-amber-500 text-xs">
            retired hurt
          </span>
        );
      case "other":
        return (
          <span className="text-muted-foreground text-xs">
            {stat.dismissal_other_text || "out"}
          </span>
        );
      default:
        return null;
    }
  };

  // Get total runs, wickets for each team
  const getTeamTotals = (stats: PlayerStat[]) => {
    const totalRuns = stats.reduce((sum, s) => sum + s.runs_scored, 0);
    const totalWickets = stats.reduce((sum, s) => sum + s.wickets, 0);
    const totalCatches = stats.reduce((sum, s) => sum + s.catches, 0);
    const totalStumpings = stats.reduce((sum, s) => sum + s.stumpings, 0);
    const totalRunOuts = stats.reduce((sum, s) => sum + s.run_outs, 0);
    return { totalRuns, totalWickets, totalCatches, totalStumpings, totalRunOuts };
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Back Button */}
          <Link to="/fixtures" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Fixtures
          </Link>

          {/* Match Header - Cricket Style */}
          <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
            {/* Match Info Bar */}
            <div className="bg-primary/10 px-6 py-3 flex flex-wrap items-center gap-4 text-sm">
              <Badge variant="outline" className="text-primary border-primary">Match {match.match_number}</Badge>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatLocalTime(match.match_date, "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {match.venue}
              </span>
            </div>

            {/* Teams & Score */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Home Team */}
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-lg"
                    style={{ backgroundColor: match.home_team?.primary_color || "#1e3a8a" }}
                  >
                    {match.home_team?.logo_url ? (
                      <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-16 h-16 object-contain" />
                    ) : (
                      match.home_team?.short_name?.substring(0, 2)
                    )}
                  </div>
                  <h2 className="font-display text-xl tracking-wide">{match.home_team?.name}</h2>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-primary">{match.home_team_score || "-"}</span>
                    {match.home_team_overs && (
                      <span className="text-muted-foreground ml-2">({match.home_team_overs} ov)</span>
                    )}
                  </div>
                </div>

                {/* VS / Result */}
                <div className="text-center py-4">
                  <div className="text-2xl font-display text-muted-foreground mb-2">VS</div>
                  {match.winner && (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Trophy className="w-5 h-5" />
                      <span className="font-medium">{match.winner.short_name} Won</span>
                    </div>
                  )}
                  {match.toss_winner && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Toss: {match.toss_winner.short_name} ({match.toss_decision})
                    </p>
                  )}
                </div>

                {/* Away Team */}
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-lg"
                    style={{ backgroundColor: match.away_team?.primary_color || "#dc2626" }}
                  >
                    {match.away_team?.logo_url ? (
                      <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-16 h-16 object-contain" />
                    ) : (
                      match.away_team?.short_name?.substring(0, 2)
                    )}
                  </div>
                  <h2 className="font-display text-xl tracking-wide">{match.away_team?.name}</h2>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-primary">{match.away_team_score || "-"}</span>
                    {match.away_team_overs && (
                      <span className="text-muted-foreground ml-2">({match.away_team_overs} ov)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Summary */}
              {match.match_summary && (
                <div className="text-center mt-6 pt-4 border-t border-border">
                  <p className="text-muted-foreground">{match.match_summary}</p>
                </div>
              )}
            </div>

            {/* Man of the Match */}
            {match.man_of_match && (
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 px-6 py-4 border-t border-border">
                <div className="flex items-center justify-center gap-3">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Player of the Match</p>
                    <p className="font-display text-lg text-yellow-500">{match.man_of_match.full_name}</p>
                  </div>
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            )}

            {/* Other Awards */}
            {matchAwards && matchAwards.length > 0 && (
              <div className="px-6 py-4 border-t border-border">
                <div className="flex flex-wrap justify-center gap-4">
                  {matchAwards.map((award: any) => (
                    <div key={award.id} className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full">
                      <Trophy className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-xs text-muted-foreground">{award.award_type?.name}: </span>
                        <span className="font-medium">{award.player?.full_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scorecard Tabs */}
          {playerStats && playerStats.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Tabs defaultValue="home" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger 
                    value="home" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    {match.home_team?.short_name}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="away"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    {match.away_team?.short_name}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="home" className="mt-0">
                  <TeamScorecard 
                    stats={homeTeamStats} 
                    teamName={match.home_team?.name || ""} 
                    score={match.home_team_score}
                    overs={match.home_team_overs}
                    calculateStrikeRate={calculateStrikeRate}
                    calculateEconomy={calculateEconomy}
                    formatDismissal={formatDismissal}
                  />
                </TabsContent>

                <TabsContent value="away" className="mt-0">
                  <TeamScorecard 
                    stats={awayTeamStats} 
                    teamName={match.away_team?.name || ""} 
                    score={match.away_team_score}
                    overs={match.away_team_overs}
                    calculateStrikeRate={calculateStrikeRate}
                    calculateEconomy={calculateEconomy}
                    formatDismissal={formatDismissal}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <p className="text-muted-foreground">Scorecard not available yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Team Scorecard Component
function TeamScorecard({ 
  stats, 
  teamName, 
  score, 
  overs,
  calculateStrikeRate,
  calculateEconomy,
  formatDismissal
}: { 
  stats: PlayerStat[];
  teamName: string;
  score: string | null;
  overs: string | null;
  calculateStrikeRate: (runs: number, balls: number) => string;
  calculateEconomy: (runs: number, overs: number) => string;
  formatDismissal: (stat: PlayerStat) => React.ReactNode;
}) {
  // Separate batters and bowlers
  const batters = stats.filter((s) => s.balls_faced > 0 || s.runs_scored > 0);
  const bowlers = stats.filter((s) => Number(s.overs_bowled) > 0);
  const fielders = stats.filter((s) => s.catches > 0 || s.stumpings > 0 || s.run_outs > 0);

  const totalRuns = batters.reduce((sum, s) => sum + s.runs_scored, 0);
  const totalBalls = batters.reduce((sum, s) => sum + s.balls_faced, 0);
  const totalFours = batters.reduce((sum, s) => sum + s.fours, 0);
  const totalSixes = batters.reduce((sum, s) => sum + s.sixes, 0);

  return (
    <div className="divide-y divide-border">
      {/* Batting Card */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Batting</h3>
          {score && (
            <div className="text-right">
              <span className="text-xl font-bold text-primary">{score}</span>
              {overs && <span className="text-muted-foreground ml-1">({overs} ov)</span>}
            </div>
          )}
        </div>
        
        {batters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Batter</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">R</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">B</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">4s</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">6s</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">SR</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((stat) => (
                  <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium">{stat.player?.full_name}</div>
                        <div className="mt-0.5">{formatDismissal(stat)}</div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 font-bold">{stat.runs_scored}</td>
                    <td className="text-center py-3 px-2 text-muted-foreground">{stat.balls_faced}</td>
                    <td className="text-center py-3 px-2">{stat.fours}</td>
                    <td className="text-center py-3 px-2">{stat.sixes}</td>
                    <td className="text-center py-3 px-2 text-muted-foreground">{calculateStrikeRate(stat.runs_scored, stat.balls_faced)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/20">
                  <td className="py-2 px-2 font-medium">Total</td>
                  <td className="text-center py-2 px-2 font-bold">{totalRuns}</td>
                  <td className="text-center py-2 px-2">{totalBalls}</td>
                  <td className="text-center py-2 px-2">{totalFours}</td>
                  <td className="text-center py-2 px-2">{totalSixes}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No batting data available</p>
        )}
      </div>

      {/* Bowling Card */}
      <div className="p-4">
        <h3 className="font-display text-lg mb-4">Bowling</h3>
        
        {bowlers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Bowler</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">O</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">M</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">R</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">W</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Econ</th>
                </tr>
              </thead>
              <tbody>
                {bowlers.map((stat) => (
                  <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{stat.player?.full_name}</td>
                    <td className="text-center py-3 px-2">{stat.overs_bowled}</td>
                    <td className="text-center py-3 px-2">{stat.maidens}</td>
                    <td className="text-center py-3 px-2">{stat.runs_conceded}</td>
                    <td className="text-center py-3 px-2 font-bold">{stat.wickets}</td>
                    <td className="text-center py-3 px-2 text-muted-foreground">{calculateEconomy(stat.runs_conceded, Number(stat.overs_bowled))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No bowling data available</p>
        )}
      </div>

      {/* Fielding Card */}
      {fielders.length > 0 && (
        <div className="p-4">
          <h3 className="font-display text-lg mb-4">Fielding</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Catches</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Stumpings</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Run Outs</th>
                </tr>
              </thead>
              <tbody>
                {fielders.map((stat) => (
                  <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{stat.player?.full_name}</td>
                    <td className="text-center py-3 px-2">{stat.catches}</td>
                    <td className="text-center py-3 px-2">{stat.stumpings}</td>
                    <td className="text-center py-3 px-2">{stat.run_outs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchScorecard;
