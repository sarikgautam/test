import { useState, useRef } from "react";
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
    logo_url?: string | null;
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

// Netflix-style horizontal stat row with arrow navigation
const HorizontalStatRow = ({
  title,
  icon: Icon,
  players,
  statLabel,
  formatValue,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  players: PlayerWithStats[];
  statLabel: string;
  formatValue: (player: PlayerWithStats) => string | number;
  accent: "blue" | "purple" | "green" | "emerald" | "amber";
}) => {
  if (!players || players.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement>(null);

  const accentMap: Record<string, { chipBg: string; chipText: string; topBar: string; indexBg: string; indexBorder: string; valueText: string; }> = {
    blue: {
      chipBg: "bg-blue-500/20",
      chipText: "text-blue-400",
      topBar: "from-blue-500/60",
      indexBg: "bg-blue-500/15",
      indexBorder: "border-blue-500/30",
      valueText: "text-blue-400",
    },
    purple: {
      chipBg: "bg-purple-500/20",
      chipText: "text-purple-400",
      topBar: "from-purple-500/60",
      indexBg: "bg-purple-500/15",
      indexBorder: "border-purple-500/30",
      valueText: "text-purple-400",
    },
    green: {
      chipBg: "bg-green-500/20",
      chipText: "text-green-400",
      topBar: "from-green-500/60",
      indexBg: "bg-green-500/15",
      indexBorder: "border-green-500/30",
      valueText: "text-green-400",
    },
    emerald: {
      chipBg: "bg-emerald-500/20",
      chipText: "text-emerald-400",
      topBar: "from-emerald-500/60",
      indexBg: "bg-emerald-500/15",
      indexBorder: "border-emerald-500/30",
      valueText: "text-emerald-400",
    },
    amber: {
      chipBg: "bg-amber-500/20",
      chipText: "text-amber-400",
      topBar: "from-amber-500/60",
      indexBg: "bg-amber-500/15",
      indexBorder: "border-amber-500/30",
      valueText: "text-amber-400",
    },
  };
  const a = accentMap[accent] || accentMap.blue;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-xl flex items-center gap-2">
          <span className={`p-2 rounded-lg ${a.chipBg}`}>
            <Icon className={`w-5 h-5 ${a.chipText}`} />
          </span>
          {title}
        </h3>
      </div>
      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory" ref={scrollRef}>
          {players.map((player, index) => (
            <div
              key={player.id}
              className="snap-start min-w-[280px] max-w-[280px] bg-card/80 backdrop-blur rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all group/card"
            >
              <div className={`h-1 rounded-t-2xl bg-gradient-to-r ${a.topBar} to-transparent`} />
              <div className="p-4 flex items-center justify-between gap-3 h-full">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className={`w-10 h-10 ${a.chipText} font-bold grid place-items-center rounded-full ${a.indexBg} border ${a.indexBorder} flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted ring-2 ring-muted-foreground/20 group-hover/card:ring-primary/30 transition mb-2">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground m-auto" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-bold text-sm leading-tight whitespace-normal break-words"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {player.full_name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {player.team && (
                          <p className="text-xs text-muted-foreground">{player.team.short_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center flex-shrink-0">
                  <span className={`text-3xl font-black ${a.valueText}`}>
                    {formatValue(player)}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{statLabel}</span>
                  <p className="text-xs text-muted-foreground mt-1">M: {player.stats.matches}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
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
              className={`group flex items-start gap-4 p-3 rounded-xl transition-all shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/20 ${
                index === 0 
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30" 
                  : "bg-muted/30 hover:bg-muted/50"
              }`}
            >
              <span className={`font-bold w-6 text-center ${index === 0 ? "text-yellow-500" : "text-primary"}`}>
                {index + 1}
              </span>
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-muted-foreground/20 group-hover:ring-primary/30 transition">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p
                  className="font-medium text-sm whitespace-normal break-words leading-tight"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {player.full_name}
                </p>
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

  // Query for best bowling figures in a single match
  const { data: bestBowlingFigures } = useQuery({
    queryKey: ["best-bowling-figures", seasonFilter],
    queryFn: async () => {
      let statsQuery = supabase
        .from("player_stats")
        .select(`
          *,
          player:players!player_stats_player_id_fkey(id, full_name, role, photo_url),
          match:matches(id, match_date)
        `)
        .gt("wickets", 0);

      if (seasonFilter !== "all") {
        statsQuery = statsQuery.eq("season_id", seasonFilter);
      }

      const { data, error } = await statsQuery;
      if (error) {
        console.error("[Stats] Best bowling figures query error:", error);
        throw error;
      }

      console.log("[Stats] Best bowling figures raw data:", data?.length, "records");

      if (!data || data.length === 0) return [];

      // Get team info from registrations
      const playerIds = [...new Set(data.map(s => s.player_id))];
      const { data: registrations } = await supabase
        .from("player_season_registrations")
        .select("player_id, team:teams(id, name, short_name, primary_color, logo_url)")
        .in("player_id", playerIds)
        .eq("auction_status", "sold");

      const teamMap = new Map(registrations?.map(r => [r.player_id, r.team]) || []);

      const result = data.map(stat => ({
        id: stat.player.id,
        full_name: stat.player.full_name,
        role: stat.player.role,
        photo_url: stat.player.photo_url,
        team: teamMap.get(stat.player_id) || null,
        stats: {
          matches: 1,
          runs_scored: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
          wickets: stat.wickets,
          overs_bowled: Number(stat.overs_bowled),
          runs_conceded: stat.runs_conceded,
          maidens: stat.maidens,
          catches: 0,
          stumpings: 0,
          run_outs: 0,
        },
      }));

      console.log("[Stats] Best bowling figures processed:", result.length, "entries");
      return result;
    },
  });

  const { data: playersWithStats, isLoading } = useQuery({
    queryKey: ["players-with-stats", seasonFilter],
    queryFn: async () => {
      // Get all players with team info from player_season_registrations
      const { data: registrations, error: regError } = await supabase
        .from("player_season_registrations")
        .select(`
          player_id,
          team_id,
          season_id,
          player:players!inner(id, full_name, role, photo_url),
          team:teams!inner(id, name, short_name, primary_color, logo_url)
        `)
        .in("auction_status", ["sold", "retained"]) 
        .eq("registration_status", "approved")
        .order("player(full_name)");
      
      if (regError) throw regError;

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

      // Group registrations by player (handle multiple seasons)
      const playerMap = new Map<string, {
        player: any;
        team: any;
      }>();
      
      registrations?.forEach((reg) => {
        const playerId = reg.player_id;
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            player: reg.player,
            team: reg.team,
          });
        }
      });

      // Combine players with their stats
      return Array.from(playerMap.values()).map(({ player, team }) => ({
        id: player.id,
        full_name: player.full_name,
        role: player.role,
        photo_url: player.photo_url,
        team: team ? {
          id: team.id,
          name: team.name,
          short_name: team.short_name,
          primary_color: team.primary_color,
        } : null,
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
    .slice(0, 20);

  const topWicketTakers = [...playersWithMatches]
    .filter((p) => p.stats.wickets > 0)
    .sort((a, b) => b.stats.wickets - a.stats.wickets)
    .slice(0, 20);

  const mostSixes = [...playersWithMatches]
    .filter((p) => p.stats.sixes > 0)
    .sort((a, b) => b.stats.sixes - a.stats.sixes)
    .slice(0, 20);

  const mostFours = [...playersWithMatches]
    .filter((p) => p.stats.fours > 0)
    .sort((a, b) => b.stats.fours - a.stats.fours)
    .slice(0, 20);

  const mostCatches = [...playersWithMatches]
    .filter((p) => p.stats.catches > 0)
    .sort((a, b) => b.stats.catches - a.stats.catches)
    .slice(0, 20);

  const mostRunOuts = [...playersWithMatches]
    .filter((p) => p.stats.run_outs > 0)
    .sort((a, b) => b.stats.run_outs - a.stats.run_outs)
    .slice(0, 20);

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

  // Best bowling figures in a single match
  const bestBowlingInMatch = [...(bestBowlingFigures || [])]
    .sort((a, b) => {
      // Sort by wickets (desc), then by runs conceded (asc)
      if (b.stats.wickets !== a.stats.wickets) {
        return b.stats.wickets - a.stats.wickets;
      }
      return a.stats.runs_conceded - b.stats.runs_conceded;
    })
    .slice(0, 5);

  console.log("[Stats] Best bowling in match:", bestBowlingInMatch.length, "entries", bestBowlingInMatch[0]);

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
              {(topRunScorers[0] || topWicketTakers[0]) && (
                <section className="grid gap-4 md:gap-6 md:grid-cols-2">
                  {topRunScorers[0] && (
                    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-blue-500/5 to-transparent">
                      <CardHeader className="pb-2 flex flex-row items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Trophy className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Run Scorer</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center gap-4 sm:gap-6">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-muted ring-2 ring-muted-foreground/20">
                          {topRunScorers[0].photo_url ? (
                            <img src={topRunScorers[0].photo_url} alt={topRunScorers[0].full_name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-12 h-12 text-muted-foreground m-auto" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold leading-snug">{topRunScorers[0].full_name}</p>
                              {topRunScorers[0].team && (
                                <div className="flex items-center gap-2">
                                  {topRunScorers[0].team.logo_url && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border/60 bg-white/60">
                                      <img src={topRunScorers[0].team.logo_url} alt={topRunScorers[0].team.short_name} className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <span
                                    className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                                    style={{
                                      backgroundColor: `${topRunScorers[0].team.primary_color}15`,
                                      color: topRunScorers[0].team.primary_color,
                                      borderColor: `${topRunScorers[0].team.primary_color}40`,
                                    }}
                                  >
                                    {topRunScorers[0].team.short_name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Matches</p>
                              <p className="text-lg font-semibold">{topRunScorers[0].stats.matches}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-xs text-muted-foreground">Runs</p>
                              <p className="text-3xl font-black text-blue-400">{topRunScorers[0].stats.runs_scored}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Strike Rate</p>
                              <p className="text-xl font-bold">{calculateStrikeRate(topRunScorers[0].stats.runs_scored, topRunScorers[0].stats.balls_faced)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {topWicketTakers[0] && (
                    <Card className="overflow-hidden border-emerald/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
                      <CardHeader className="pb-2 flex flex-row items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                          <Target className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Wicket Taker</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center gap-4 sm:gap-6">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-muted ring-2 ring-muted-foreground/20">
                          {topWicketTakers[0].photo_url ? (
                            <img src={topWicketTakers[0].photo_url} alt={topWicketTakers[0].full_name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-12 h-12 text-muted-foreground m-auto" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold leading-snug">{topWicketTakers[0].full_name}</p>
                              {topWicketTakers[0].team && (
                                <div className="flex items-center gap-2">
                                  {topWicketTakers[0].team.logo_url && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border/60 bg-white/60">
                                      <img src={topWicketTakers[0].team.logo_url} alt={topWicketTakers[0].team.short_name} className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <span
                                    className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                                    style={{
                                      backgroundColor: `${topWicketTakers[0].team.primary_color}15`,
                                      color: topWicketTakers[0].team.primary_color,
                                      borderColor: `${topWicketTakers[0].team.primary_color}40`,
                                    }}
                                  >
                                    {topWicketTakers[0].team.short_name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Matches</p>
                              <p className="text-lg font-semibold">{topWicketTakers[0].stats.matches}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-xs text-muted-foreground">Wickets</p>
                              <p className="text-3xl font-black text-emerald-400">{topWicketTakers[0].stats.wickets}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Economy</p>
                              <p className="text-xl font-bold">{calculateEconomy(topWicketTakers[0].stats.runs_conceded, topWicketTakers[0].stats.overs_bowled)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </section>
              )}

              {/* Batting Leaders: Horizontal Carousels */}
              <section>
                <h2 className="font-display text-2xl mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Trophy className="w-6 h-6 text-blue-400" />
                  </div>
                  Batting Leaders
                </h2>
                <HorizontalStatRow
                  title="Most Runs"
                  icon={Trophy}
                  players={topRunScorers}
                  statLabel="runs"
                  formatValue={(p) => p.stats.runs_scored}
                  accent="blue"
                />
                <HorizontalStatRow
                  title="Most Sixes"
                  icon={Zap}
                  players={mostSixes}
                  statLabel="sixes"
                  formatValue={(p) => p.stats.sixes}
                  accent="purple"
                />
                <HorizontalStatRow
                  title="Most Fours"
                  icon={TrendingUp}
                  players={mostFours}
                  statLabel="fours"
                  formatValue={(p) => p.stats.fours}
                  accent="green"
                />
              </section>

              {/* Bowling Leaders: Horizontal Carousels */}
              <section>
                <h2 className="font-display text-2xl mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                  Bowling Leaders
                </h2>
                <HorizontalStatRow
                  title="Top Wicket Takers"
                  icon={Target}
                  players={topWicketTakers}
                  statLabel="wickets"
                  formatValue={(p) => p.stats.wickets}
                  accent="emerald"
                />
                <HorizontalStatRow
                  title="Best Economy"
                  icon={BarChart3}
                  players={bestEconomy}
                  statLabel="econ"
                  formatValue={(p) => calculateEconomy(p.stats.runs_conceded, p.stats.overs_bowled)}
                  accent="blue"
                />
              </section>

              {/* Fielding Leaders: Horizontal Carousels */}
              <section>
                <h2 className="font-display text-2xl mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Hand className="w-6 h-6 text-amber-400" />
                  </div>
                  Fielding Leaders
                </h2>
                <HorizontalStatRow
                  title="Most Catches"
                  icon={Hand}
                  players={mostCatches}
                  statLabel="catches"
                  formatValue={(p) => p.stats.catches}
                  accent="amber"
                />
                <HorizontalStatRow
                  title="Most Run Outs"
                  icon={Shield}
                  players={mostRunOuts}
                  statLabel="run outs"
                  formatValue={(p) => p.stats.run_outs}
                  accent="emerald"
                />
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