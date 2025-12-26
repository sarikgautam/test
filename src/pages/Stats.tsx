import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Trophy, Target, User, Search } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";

interface PlayerWithStats {
  id: string;
  full_name: string;
  role: string;
  photo_url: string | null;
  team: {
    id: string;
    name: string;
    short_name: string;
    primary_color: string;
  } | null;
  stats: {
    matches: number;
    runs_scored: number;
    balls_faced: number;
    fours: number;
    sixes: number;
    wickets: number;
    overs_bowled: number;
    runs_conceded: number;
    maidens: number;
    catches: number;
    stumpings: number;
    run_outs: number;
  };
}

const Stats = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  
  const { activeSeason } = useActiveSeason();

  const { data: seasons } = useQuery({
    queryKey: ["all-seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["stats-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: playersWithStats, isLoading } = useQuery({
    queryKey: ["players-with-stats", seasonFilter],
    queryFn: async () => {
      // Get all players
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, full_name, role, photo_url, team:teams(*)")
        .order("full_name");
      if (playersError) throw playersError;

      // Get aggregated stats - filter by season or get all
      let statsQuery = supabase.from("player_stats").select("*");
      
      if (seasonFilter !== "all") {
        statsQuery = statsQuery.eq("season_id", seasonFilter);
      }
      
      const { data: stats, error: statsError } = await statsQuery;
      if (statsError) throw statsError;

      // Aggregate stats per player
      const aggregatedStats: Record<string, PlayerWithStats["stats"]> = {};
      stats?.forEach((stat) => {
        if (!aggregatedStats[stat.player_id]) {
          aggregatedStats[stat.player_id] = {
            matches: 0,
            runs_scored: 0,
            balls_faced: 0,
            fours: 0,
            sixes: 0,
            wickets: 0,
            overs_bowled: 0,
            runs_conceded: 0,
            maidens: 0,
            catches: 0,
            stumpings: 0,
            run_outs: 0,
          };
        }
        const s = aggregatedStats[stat.player_id];
        s.matches += 1;
        s.runs_scored += stat.runs_scored;
        s.balls_faced += stat.balls_faced;
        s.fours += stat.fours;
        s.sixes += stat.sixes;
        s.wickets += stat.wickets;
        s.overs_bowled += Number(stat.overs_bowled);
        s.runs_conceded += stat.runs_conceded;
        s.maidens += stat.maidens;
        s.catches += stat.catches;
        s.stumpings += stat.stumpings;
        s.run_outs += stat.run_outs;
      });

      // Combine players with their stats
      return players?.map((player) => ({
        ...player,
        team: player.team as PlayerWithStats["team"],
        stats: aggregatedStats[player.id] || {
          matches: 0,
          runs_scored: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          wickets: 0,
          overs_bowled: 0,
          runs_conceded: 0,
          maidens: 0,
          catches: 0,
          stumpings: 0,
          run_outs: 0,
        },
      })) as PlayerWithStats[];
    },
  });

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      batsman: "bg-blue-500/20 text-blue-400",
      bowler: "bg-emerald-500/20 text-emerald-400",
      all_rounder: "bg-purple-500/20 text-purple-400",
      wicket_keeper: "bg-amber-500/20 text-amber-400",
    };
    return styles[role] || "";
  };

  const filteredPlayers = playersWithStats
    ?.filter((player) => {
      const matchesSearch = player.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesTeam = teamFilter === "all" || player.team?.id === teamFilter;
      const matchesRole = roleFilter === "all" || player.role === roleFilter;
      return matchesSearch && matchesTeam && matchesRole;
    });

  // Top performers
  const topRunScorers = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => b.stats.runs_scored - a.stats.runs_scored)
    .slice(0, 5);

  const topWicketTakers = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => b.stats.wickets - a.stats.wickets)
    .slice(0, 5);

  const mostSixes = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => b.stats.sixes - a.stats.sixes)
    .slice(0, 5);

  const mostFours = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => b.stats.fours - a.stats.fours)
    .slice(0, 5);

  const mostCatches = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => b.stats.catches - a.stats.catches)
    .slice(0, 5);

  const bestStrikeRate = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0 && p.stats.balls_faced >= 30) // Minimum 30 balls
    .sort((a, b) => {
      const srA = (a.stats.runs_scored / a.stats.balls_faced) * 100;
      const srB = (b.stats.runs_scored / b.stats.balls_faced) * 100;
      return srB - srA;
    })
    .slice(0, 5);

  const bestEconomy = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0 && p.stats.overs_bowled >= 5) // Minimum 5 overs
    .sort((a, b) => {
      const econA = a.stats.runs_conceded / a.stats.overs_bowled;
      const econB = b.stats.runs_conceded / b.stats.overs_bowled;
      return econA - econB;
    })
    .slice(0, 5);

  const mostRunOuts = [...(playersWithStats || [])]
    .filter((p) => p.stats.matches > 0)
    .sort((a, b) => b.stats.run_outs - a.stats.run_outs)
    .slice(0, 5);

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return 0;
    return ((runs / balls) * 100).toFixed(1);
  };

  const calculateEconomy = (runsConceded: number, overs: number) => {
    if (overs === 0) return 0;
    return (runsConceded / overs).toFixed(2);
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">
              Player <span className="text-gradient-gold">Stats</span>
            </h1>
            <p className="text-muted-foreground">
              {seasonFilter === "all" 
                ? "Showing stats from all seasons" 
                : seasons?.find(s => s.id === seasonFilter)?.name || "View player statistics"}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Performers - Batting */}
              {(topRunScorers.length > 0 || bestStrikeRate.length > 0 || mostFours.length > 0 || mostSixes.length > 0) && (
                <>
                  <div>
                    <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-primary" />
                      Batting Leaders
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Top Run Scorers */}
                      {topRunScorers.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Trophy className="w-5 h-5 text-primary" />
                          Top Run Scorers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {topRunScorers.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{player.stats.runs_scored}</p>
                                <p className="text-xs text-muted-foreground">runs</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Best Strike Rate */}
                  {bestStrikeRate.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="w-5 h-5 text-primary" />
                          Best Strike Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {bestStrikeRate.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{calculateStrikeRate(player.stats.runs_scored, player.stats.balls_faced)}</p>
                                <p className="text-xs text-muted-foreground">SR</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                    </div>
                  </div>
                </>
              )}

              {/* Bowling Leaders */}
              {(topWicketTakers.length > 0 || bestEconomy.length > 0) && (
                <>
                  <div>
                    <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                      <Target className="w-6 h-6 text-primary" />
                      Bowling Leaders
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Top Wicket Takers */}
                      {topWicketTakers.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="w-5 h-5 text-primary" />
                          Top Wicket Takers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {topWicketTakers.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{player.stats.wickets}</p>
                                <p className="text-xs text-muted-foreground">wickets</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Best Economy */}
                  {bestEconomy.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          Best Economy
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {bestEconomy.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{calculateEconomy(player.stats.runs_conceded, player.stats.overs_bowled)}</p>
                                <p className="text-xs text-muted-foreground">Econ</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                    </div>
                  </div>
                </>
              )}

              {/* Fielding Leaders */}
              {(mostCatches.length > 0 || mostRunOuts.length > 0) && (
                <>
                  <div>
                    <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-primary" />
                      Fielding Leaders
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Most Catches */}
                      {mostCatches.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="w-5 h-5 text-primary" />
                          Most Sixes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mostSixes.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{player.stats.sixes}</p>
                                <p className="text-xs text-muted-foreground">sixes</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Most Fours */}
                  {mostFours.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Trophy className="w-5 h-5 text-primary" />
                          Most Fours
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mostFours.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{player.stats.fours}</p>
                                <p className="text-xs text-muted-foreground">fours</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Most Catches */}
                  {mostCatches.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Trophy className="w-5 h-5 text-primary" />
                          Most Catches
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mostCatches.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{player.stats.catches}</p>
                                <p className="text-xs text-muted-foreground">catches</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Most Run Outs */}
                  {mostRunOuts.length > 0 && (
                    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="w-5 h-5 text-primary" />
                          Most Run Outs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mostRunOuts.map((player, index) => (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                              }`}
                            >
                              <span className="font-bold text-primary w-6">
                                #{index + 1}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {player.photo_url ? (
                                  <img
                                    src={player.photo_url}
                                    alt={player.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-sm">{player.full_name}</p>
                                {player.team && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.team.short_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{player.stats.run_outs}</p>
                                <p className="text-xs text-muted-foreground">run outs</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                    </div>
                  </div>
                </>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="All Seasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {seasons?.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.short_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="batsman">Batsman</SelectItem>
                    <SelectItem value="bowler">Bowler</SelectItem>
                    <SelectItem value="all_rounder">All-Rounder</SelectItem>
                    <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats Tabs */}
              <Tabs defaultValue="batting" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="batting">Batting</TabsTrigger>
                  <TabsTrigger value="bowling">Bowling</TabsTrigger>
                  <TabsTrigger value="fielding">Fielding</TabsTrigger>
                </TabsList>

                <TabsContent value="batting" className="mt-4">
                  <Card className="border-border/50">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Player</TableHead>
                              <TableHead className="text-center">M</TableHead>
                              <TableHead className="text-center">Runs</TableHead>
                              <TableHead className="text-center">Balls</TableHead>
                              <TableHead className="text-center">4s</TableHead>
                              <TableHead className="text-center">6s</TableHead>
                              <TableHead className="text-center">SR</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPlayers
                              ?.sort((a, b) => b.stats.runs_scored - a.stats.runs_scored)
                              .map((player) => (
                                <TableRow key={player.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        {player.photo_url ? (
                                          <img
                                            src={player.photo_url}
                                            alt={player.full_name}
                                            className="w-full h-full rounded-full object-cover"
                                          />
                                        ) : (
                                          <User className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium">{player.full_name}</p>
                                        <div className="flex items-center gap-1">
                                          {player.team && (
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: player.team.primary_color }}
                                            />
                                          )}
                                          <Badge className={`text-[10px] px-1 ${getRoleBadgeStyle(player.role)}`}>
                                            {roleLabels[player.role]}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">{player.stats.matches}</TableCell>
                                  <TableCell className="text-center font-bold">{player.stats.runs_scored}</TableCell>
                                  <TableCell className="text-center">{player.stats.balls_faced}</TableCell>
                                  <TableCell className="text-center">{player.stats.fours}</TableCell>
                                  <TableCell className="text-center">{player.stats.sixes}</TableCell>
                                  <TableCell className="text-center">
                                    {calculateStrikeRate(player.stats.runs_scored, player.stats.balls_faced)}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bowling" className="mt-4">
                  <Card className="border-border/50">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Player</TableHead>
                              <TableHead className="text-center">M</TableHead>
                              <TableHead className="text-center">Overs</TableHead>
                              <TableHead className="text-center">Runs</TableHead>
                              <TableHead className="text-center">Wkts</TableHead>
                              <TableHead className="text-center">Mdn</TableHead>
                              <TableHead className="text-center">Econ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPlayers
                              ?.sort((a, b) => b.stats.wickets - a.stats.wickets)
                              .map((player) => (
                                <TableRow key={player.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        {player.photo_url ? (
                                          <img
                                            src={player.photo_url}
                                            alt={player.full_name}
                                            className="w-full h-full rounded-full object-cover"
                                          />
                                        ) : (
                                          <User className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium">{player.full_name}</p>
                                        <div className="flex items-center gap-1">
                                          {player.team && (
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: player.team.primary_color }}
                                            />
                                          )}
                                          <Badge className={`text-[10px] px-1 ${getRoleBadgeStyle(player.role)}`}>
                                            {roleLabels[player.role]}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">{player.stats.matches}</TableCell>
                                  <TableCell className="text-center">{player.stats.overs_bowled.toFixed(1)}</TableCell>
                                  <TableCell className="text-center">{player.stats.runs_conceded}</TableCell>
                                  <TableCell className="text-center font-bold">{player.stats.wickets}</TableCell>
                                  <TableCell className="text-center">{player.stats.maidens}</TableCell>
                                  <TableCell className="text-center">
                                    {calculateEconomy(player.stats.runs_conceded, player.stats.overs_bowled)}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="fielding" className="mt-4">
                  <Card className="border-border/50">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Player</TableHead>
                              <TableHead className="text-center">M</TableHead>
                              <TableHead className="text-center">Catches</TableHead>
                              <TableHead className="text-center">Stumpings</TableHead>
                              <TableHead className="text-center">Run Outs</TableHead>
                              <TableHead className="text-center">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPlayers
                              ?.sort((a, b) => 
                                (b.stats.catches + b.stats.stumpings + b.stats.run_outs) - 
                                (a.stats.catches + a.stats.stumpings + a.stats.run_outs)
                              )
                              .map((player) => (
                                <TableRow key={player.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        {player.photo_url ? (
                                          <img
                                            src={player.photo_url}
                                            alt={player.full_name}
                                            className="w-full h-full rounded-full object-cover"
                                          />
                                        ) : (
                                          <User className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium">{player.full_name}</p>
                                        <div className="flex items-center gap-1">
                                          {player.team && (
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: player.team.primary_color }}
                                            />
                                          )}
                                          <Badge className={`text-[10px] px-1 ${getRoleBadgeStyle(player.role)}`}>
                                            {roleLabels[player.role]}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">{player.stats.matches}</TableCell>
                                  <TableCell className="text-center">{player.stats.catches}</TableCell>
                                  <TableCell className="text-center">{player.stats.stumpings}</TableCell>
                                  <TableCell className="text-center">{player.stats.run_outs}</TableCell>
                                  <TableCell className="text-center font-bold">
                                    {player.stats.catches + player.stats.stumpings + player.stats.run_outs}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {filteredPlayers?.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No players match your filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
