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
import { BarChart3, Trophy, Target, User, Search, Zap, Shield, Hand, TrendingUp } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";
import { cricketOversToDecimal } from "@/lib/utils";

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

// Reusable leaderboard card component
const LeaderboardCard = ({
  title,
  icon: Icon,
  players,
  statKey,
  statLabel,
  formatValue,
  gradient,
}: {
  title: string;
  icon: React.ElementType;
  players: PlayerWithStats[];
  statKey: keyof PlayerWithStats["stats"] | "calculated";
  statLabel: string;
  formatValue: (player: PlayerWithStats) => string | number;
  gradient: string;
}) => {
  if (players.length === 0) return null;

  return (
    <Card className={`border-primary/30 ${gradient} overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {players.slice(0, 5).map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                index === 0 
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30" 
                  : "bg-muted/30 hover:bg-muted/50"
              }`}
            >
              <span className={`font-bold w-6 text-center ${index === 0 ? "text-yellow-500" : "text-primary"}`}>
                {index + 1}
              </span>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-medium text-sm truncate">{player.full_name}</p>
                {player.team && (
                  <p className="text-xs text-muted-foreground">{player.team.short_name}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold ${index === 0 ? "text-yellow-500" : ""}`}>
                  {formatValue(player)}
                </p>
                <p className="text-xs text-muted-foreground">{statLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

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

  // Top performers calculations
  const playersWithMatches = (playersWithStats || []).filter((p) => p.stats.matches > 0);

  const topRunScorers = [...playersWithMatches]
    .sort((a, b) => b.stats.runs_scored - a.stats.runs_scored)
    .slice(0, 5);

  const topWicketTakers = [...playersWithMatches]
    .filter((p) => p.stats.wickets > 0)
    .sort((a, b) => b.stats.wickets - a.stats.wickets)
    .slice(0, 5);

  const mostSixes = [...playersWithMatches]
    .filter((p) => p.stats.sixes > 0)
    .sort((a, b) => b.stats.sixes - a.stats.sixes)
    .slice(0, 5);

  const mostFours = [...playersWithMatches]
    .filter((p) => p.stats.fours > 0)
    .sort((a, b) => b.stats.fours - a.stats.fours)
    .slice(0, 5);

  const mostCatches = [...playersWithMatches]
    .filter((p) => p.stats.catches > 0)
    .sort((a, b) => b.stats.catches - a.stats.catches)
    .slice(0, 5);

  const mostRunOuts = [...playersWithMatches]
    .filter((p) => p.stats.run_outs > 0)
    .sort((a, b) => b.stats.run_outs - a.stats.run_outs)
    .slice(0, 5);

  const bestStrikeRate = [...playersWithMatches]
    .filter((p) => p.stats.balls_faced >= 20) // Minimum 20 balls
    .sort((a, b) => {
      const srA = (a.stats.runs_scored / a.stats.balls_faced) * 100;
      const srB = (b.stats.runs_scored / b.stats.balls_faced) * 100;
      return srB - srA;
    })
    .slice(0, 5);

  const bestEconomy = [...playersWithMatches]
    .filter((p) => p.stats.overs_bowled >= 2) // Minimum 2 overs
    .sort((a, b) => {
      const econA = a.stats.runs_conceded / cricketOversToDecimal(a.stats.overs_bowled);
      const econB = b.stats.runs_conceded / cricketOversToDecimal(b.stats.overs_bowled);
      return econA - econB;
    })
    .slice(0, 5);

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "0.00";
    return ((runs / balls) * 100).toFixed(2);
  };

  const calculateEconomy = (runsConceded: number, overs: number) => {
    if (overs === 0) return "-";
    const actualOvers = cricketOversToDecimal(overs);
    if (actualOvers === 0) return "-";
    return (runsConceded / actualOvers).toFixed(2);
  };

  const hasStats = playersWithMatches.length > 0;

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">
              Player <span className="text-gradient-gold">Statistics</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {seasonFilter === "all" 
                ? "Complete statistics from all seasons" 
                : seasons?.find(s => s.id === seasonFilter)?.name || "View player statistics"}
            </p>
          </div>

          {/* Season Filter at Top */}
          <div className="flex justify-center mb-8">
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select Season" />
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
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          ) : !hasStats ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Statistics Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Player statistics will appear here once matches are completed and scores are recorded.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              {/* Batting Leaders Section */}
              <section>
                <h2 className="font-display text-2xl mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Trophy className="w-6 h-6 text-blue-400" />
                  </div>
                  Batting Leaders
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LeaderboardCard
                    title="Top Run Scorers"
                    icon={Trophy}
                    players={topRunScorers}
                    statKey="runs_scored"
                    statLabel="runs"
                    formatValue={(p) => p.stats.runs_scored}
                    gradient="bg-gradient-to-br from-blue-500/10 to-transparent"
                  />
                  <LeaderboardCard
                    title="Most Sixes"
                    icon={Zap}
                    players={mostSixes}
                    statKey="sixes"
                    statLabel="sixes"
                    formatValue={(p) => p.stats.sixes}
                    gradient="bg-gradient-to-br from-purple-500/10 to-transparent"
                  />
                  <LeaderboardCard
                    title="Most Fours"
                    icon={TrendingUp}
                    players={mostFours}
                    statKey="fours"
                    statLabel="fours"
                    formatValue={(p) => p.stats.fours}
                    gradient="bg-gradient-to-br from-green-500/10 to-transparent"
                  />
                  <LeaderboardCard
                    title="Best Strike Rate"
                    icon={Target}
                    players={bestStrikeRate}
                    statKey="calculated"
                    statLabel="SR"
                    formatValue={(p) => calculateStrikeRate(p.stats.runs_scored, p.stats.balls_faced)}
                    gradient="bg-gradient-to-br from-amber-500/10 to-transparent"
                  />
                </div>
              </section>

              {/* Bowling Leaders Section */}
              <section>
                <h2 className="font-display text-2xl mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                  Bowling Leaders
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LeaderboardCard
                    title="Top Wicket Takers"
                    icon={Target}
                    players={topWicketTakers}
                    statKey="wickets"
                    statLabel="wickets"
                    formatValue={(p) => p.stats.wickets}
                    gradient="bg-gradient-to-br from-emerald-500/10 to-transparent"
                  />
                  <LeaderboardCard
                    title="Best Economy"
                    icon={BarChart3}
                    players={bestEconomy}
                    statKey="calculated"
                    statLabel="econ"
                    formatValue={(p) => calculateEconomy(p.stats.runs_conceded, p.stats.overs_bowled)}
                    gradient="bg-gradient-to-br from-teal-500/10 to-transparent"
                  />
                </div>
              </section>

              {/* Fielding Leaders Section */}
              <section>
                <h2 className="font-display text-2xl mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Hand className="w-6 h-6 text-amber-400" />
                  </div>
                  Fielding Leaders
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LeaderboardCard
                    title="Most Catches"
                    icon={Hand}
                    players={mostCatches}
                    statKey="catches"
                    statLabel="catches"
                    formatValue={(p) => p.stats.catches}
                    gradient="bg-gradient-to-br from-amber-500/10 to-transparent"
                  />
                  <LeaderboardCard
                    title="Most Run Outs"
                    icon={Shield}
                    players={mostRunOuts}
                    statKey="run_outs"
                    statLabel="run outs"
                    formatValue={(p) => p.stats.run_outs}
                    gradient="bg-gradient-to-br from-orange-500/10 to-transparent"
                  />
                </div>
              </section>

              {/* Detailed Stats Section */}
              <section>
                <h2 className="font-display text-2xl mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  Detailed Statistics
                </h2>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
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
                                <TableHead className="sticky left-0 bg-card">Player</TableHead>
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
                                ?.filter((p) => p.stats.matches > 0)
                                ?.sort((a, b) => b.stats.runs_scored - a.stats.runs_scored)
                                .map((player) => (
                                  <TableRow key={player.id}>
                                    <TableCell className="sticky left-0 bg-card">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                          {player.photo_url ? (
                                            <img
                                              src={player.photo_url}
                                              alt={player.full_name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <User className="w-4 h-4 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{player.full_name}</p>
                                          <div className="flex items-center gap-2">
                                            {player.team && (
                                              <span className="text-xs text-muted-foreground">
                                                {player.team.short_name}
                                              </span>
                                            )}
                                            <Badge variant="outline" className={`text-xs ${getRoleBadgeStyle(player.role)}`}>
                                              {roleLabels[player.role]}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">{player.stats.matches}</TableCell>
                                    <TableCell className="text-center font-semibold">{player.stats.runs_scored}</TableCell>
                                    <TableCell className="text-center">{player.stats.balls_faced}</TableCell>
                                    <TableCell className="text-center">{player.stats.fours}</TableCell>
                                    <TableCell className="text-center">{player.stats.sixes}</TableCell>
                                    <TableCell className="text-center">{calculateStrikeRate(player.stats.runs_scored, player.stats.balls_faced)}</TableCell>
                                  </TableRow>
                                ))}
                              {filteredPlayers?.filter((p) => p.stats.matches > 0).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No batting stats available
                                  </TableCell>
                                </TableRow>
                              )}
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
                                <TableHead className="sticky left-0 bg-card">Player</TableHead>
                                <TableHead className="text-center">M</TableHead>
                                <TableHead className="text-center">Overs</TableHead>
                                <TableHead className="text-center">Runs</TableHead>
                                <TableHead className="text-center">Wkts</TableHead>
                                <TableHead className="text-center">Maidens</TableHead>
                                <TableHead className="text-center">Econ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredPlayers
                                ?.filter((p) => p.stats.matches > 0 && p.stats.overs_bowled > 0)
                                ?.sort((a, b) => b.stats.wickets - a.stats.wickets)
                                .map((player) => (
                                  <TableRow key={player.id}>
                                    <TableCell className="sticky left-0 bg-card">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                          {player.photo_url ? (
                                            <img
                                              src={player.photo_url}
                                              alt={player.full_name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <User className="w-4 h-4 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{player.full_name}</p>
                                          <div className="flex items-center gap-2">
                                            {player.team && (
                                              <span className="text-xs text-muted-foreground">
                                                {player.team.short_name}
                                              </span>
                                            )}
                                            <Badge variant="outline" className={`text-xs ${getRoleBadgeStyle(player.role)}`}>
                                              {roleLabels[player.role]}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">{player.stats.matches}</TableCell>
                                    <TableCell className="text-center">{player.stats.overs_bowled}</TableCell>
                                    <TableCell className="text-center">{player.stats.runs_conceded}</TableCell>
                                    <TableCell className="text-center font-semibold">{player.stats.wickets}</TableCell>
                                    <TableCell className="text-center">{player.stats.maidens}</TableCell>
                                    <TableCell className="text-center">{calculateEconomy(player.stats.runs_conceded, player.stats.overs_bowled)}</TableCell>
                                  </TableRow>
                                ))}
                              {filteredPlayers?.filter((p) => p.stats.matches > 0 && p.stats.overs_bowled > 0).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No bowling stats available
                                  </TableCell>
                                </TableRow>
                              )}
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
                                <TableHead className="sticky left-0 bg-card">Player</TableHead>
                                <TableHead className="text-center">M</TableHead>
                                <TableHead className="text-center">Catches</TableHead>
                                <TableHead className="text-center">Stumpings</TableHead>
                                <TableHead className="text-center">Run Outs</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredPlayers
                                ?.filter((p) => p.stats.matches > 0)
                                ?.sort((a, b) => {
                                  const totalA = a.stats.catches + a.stats.stumpings + a.stats.run_outs;
                                  const totalB = b.stats.catches + b.stats.stumpings + b.stats.run_outs;
                                  return totalB - totalA;
                                })
                                .map((player) => {
                                  const total = player.stats.catches + player.stats.stumpings + player.stats.run_outs;
                                  return (
                                    <TableRow key={player.id}>
                                      <TableCell className="sticky left-0 bg-card">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                            {player.photo_url ? (
                                              <img
                                                src={player.photo_url}
                                                alt={player.full_name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <User className="w-4 h-4 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="font-medium text-sm">{player.full_name}</p>
                                            <div className="flex items-center gap-2">
                                              {player.team && (
                                                <span className="text-xs text-muted-foreground">
                                                  {player.team.short_name}
                                                </span>
                                              )}
                                              <Badge variant="outline" className={`text-xs ${getRoleBadgeStyle(player.role)}`}>
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
                                      <TableCell className="text-center font-semibold">{total}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              {filteredPlayers?.filter((p) => p.stats.matches > 0).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No fielding stats available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </section>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
