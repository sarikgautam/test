import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Search, 
  Gavel,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  XCircle
} from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useSeason";

interface SoldPlayer {
  id: string;
  sold_price: number;
  player: {
    id: string;
    full_name: string;
    role: string;
    photo_url: string | null;
  };
  team: {
    id: string;
    name: string;
    short_name: string;
    primary_color: string;
    logo_url: string | null;
  } | null;
}

interface UnsoldPlayer {
  id: string;
  base_price: number;
  player: {
    id: string;
    full_name: string;
    role: string;
    photo_url: string | null;
  };
}

interface RetainedPlayer {
  id: string;
  base_price: number | null;
  player: {
    id: string;
    full_name: string;
    role: string;
    photo_url: string | null;
  };
  team: {
    id: string;
    name: string;
    short_name: string;
    primary_color: string;
    logo_url: string | null;
  } | null;
}

interface TeamStats {
  id: string;
  name: string;
  short_name: string;
  primary_color: string;
  logo_url: string | null;
  remaining_budget: number;
  budget: number;
  players: SoldPlayer[];
  totalSpent: number;
}

const formatPrice = (price: number) => {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}K`;
  }
  return `$${price.toLocaleString()}`;
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "batsman":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "bowler":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "all_rounder":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "wicket_keeper":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatRole = (role: string) => {
  return role.split("_").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

export default function AuctionStats() {
  const { activeSeason, isLoading: seasonLoading } = useActiveSeason();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"roles" | "teams">("roles");
  const [seasonFilter, setSeasonFilter] = useState("active");
  const [retainedTab, setRetainedTab] = useState("all");

  const { data: seasons } = useQuery({
    queryKey: ["auction-all-seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: soldPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ["auction-stats-players", seasonFilter],
    queryFn: async () => {
      const targetSeasonId = seasonFilter === "active" ? activeSeason?.id : seasonFilter === "all" ? undefined : seasonFilter;
      
      let query = supabase
        .from("player_season_registrations")
        .select(`
          id,
          sold_price,
          player:players!inner(id, full_name, role, photo_url),
          team:teams(id, name, short_name, primary_color, logo_url)
        `)
        .eq("registration_status", "approved")
        .eq("auction_status", "sold");
      
      if (targetSeasonId) {
        query = query.eq("season_id", targetSeasonId);
      }
      
      const { data, error } = await query.order("sold_price", { ascending: false });

      if (error) throw error;
      return data as unknown as SoldPlayer[];
    },
    enabled: seasonFilter !== "active" || !!activeSeason?.id,
  });

  const { data: unsoldPlayers } = useQuery({
    queryKey: ["auction-stats-unsold", seasonFilter],
    queryFn: async () => {
      const targetSeasonId = seasonFilter === "active" ? activeSeason?.id : seasonFilter === "all" ? undefined : seasonFilter;
      
      let query = supabase
        .from("player_season_registrations")
        .select(`
          id,
          base_price,
          player:players!inner(id, full_name, role, photo_url)
        `)
        .eq("registration_status", "approved")
        .eq("auction_status", "unsold");
      
      if (targetSeasonId) {
        query = query.eq("season_id", targetSeasonId);
      }
      
      const { data, error } = await query.order("created_at");

      if (error) throw error;
      return data as unknown as UnsoldPlayer[];
    },
    enabled: seasonFilter !== "active" || !!activeSeason?.id,
  });

  const { data: retainedPlayers } = useQuery({
    queryKey: ["auction-stats-retained", seasonFilter],
    queryFn: async () => {
      const targetSeasonId = seasonFilter === "active" ? activeSeason?.id : seasonFilter === "all" ? undefined : seasonFilter;
      
      let query = supabase
        .from("player_season_registrations")
        .select(`
          id,
          base_price,
          player:players!inner(id, full_name, role, photo_url),
          team:teams(id, name, short_name, primary_color, logo_url)
        `)
        .eq("registration_status", "approved")
        .eq("auction_status", "retained");

      if (targetSeasonId) {
        query = query.eq("season_id", targetSeasonId);
      }

      const { data, error } = await query.order("created_at");

      if (error) throw error;
      return data as unknown as RetainedPlayer[];
    },
    enabled: seasonFilter !== "active" || !!activeSeason?.id,
  });

  const { data: teams } = useQuery({
    queryKey: ["auction-stats-teams", seasonFilter],
    queryFn: async () => {
      const targetSeasonId = seasonFilter === "active" ? activeSeason?.id : seasonFilter === "all" ? undefined : seasonFilter;
      
      // Get teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, short_name, primary_color, logo_url, budget")
        .order("name");

      if (teamsError) throw teamsError;
      
      // Get sold players for the season(s) to calculate spent budget
      let soldQuery = supabase
        .from("player_season_registrations")
        .select("team_id, sold_price")
        .eq("auction_status", "sold")
        .not("team_id", "is", null);
      
      if (targetSeasonId) {
        soldQuery = soldQuery.eq("season_id", targetSeasonId);
      }
      
      const { data: soldPlayers, error: soldError } = await soldQuery;
      if (soldError) throw soldError;

      // Calculate remaining budget for each team
      const teamsWithBudget = teamsData.map(team => {
        const teamSpent = soldPlayers
          ?.filter(p => p.team_id === team.id)
          .reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;
        
        return {
          ...team,
          remaining_budget: team.budget - teamSpent,
        };
      });

      return teamsWithBudget;
    },
    enabled: seasonFilter !== "active" || !!activeSeason?.id,
  });

  // Calculate team stats
  const teamStats: TeamStats[] = useMemo(() => {
    return teams?.map(team => {
      const teamPlayers = soldPlayers?.filter(p => p.team?.id === team.id) || [];
      const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
      
      return {
        ...team,
        players: teamPlayers,
        totalSpent,
      };
    }).filter(t => t.players.length > 0) || [];
  }, [teams, soldPlayers]);

  // Calculate stats
  const stats = useMemo(() => {
    const prices = soldPlayers?.map(p => p.sold_price || 0).filter(p => p > 0) || [];
    const totalSpent = prices.reduce((sum, p) => sum + p, 0);
    const avgPrice = prices.length > 0 ? totalSpent / prices.length : 0;
    
    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices.length > 0 
      ? sortedPrices.length % 2 === 0
        ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
        : sortedPrices[Math.floor(sortedPrices.length / 2)]
      : 0;

    return {
      totalPlayers: soldPlayers?.length || 0,
      totalSpent,
      highestBid: soldPlayers?.[0]?.sold_price || 0,
      topBidPlayer: soldPlayers?.[0] || null,
      avgPrice,
      medianPrice,
      unsoldCount: unsoldPlayers?.length || 0,
    };
  }, [soldPlayers, unsoldPlayers]);

  const filteredPlayers = useMemo(() => {
    let players = soldPlayers || [];
    
    // Filter by search
    if (searchQuery) {
      players = players.filter(p =>
        p.player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by tab
    if (viewMode === "roles" && activeTab !== "all") {
      players = players.filter(p => p.player.role === activeTab);
    } else if (viewMode === "teams" && activeTab !== "all") {
      players = players.filter(p => p.team?.id === activeTab);
    }
    
    return players;
  }, [soldPlayers, searchQuery, activeTab, viewMode]);

  const isLoading = seasonLoading || playersLoading;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/auction">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Auction
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Auction Statistics
            </h1>
            <p className="text-muted-foreground mt-1">
              {seasonFilter === "all"
                ? "Complete overview from all seasons"
                : seasonFilter === "active"
                ? `Complete overview of all sold players and team acquisitions`
                : seasons?.find(s => s.id === seasonFilter)?.name || "Season statistics"}
            </p>
          </div>
          <Select value={seasonFilter} onValueChange={setSeasonFilter}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Season</SelectItem>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons?.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Players Sold</p>
                <p className="text-xl font-bold">{stats.totalPlayers}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold">{formatPrice(stats.totalSpent)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Gavel className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top Bid</p>
                <p className="text-xl font-bold">{formatPrice(stats.highestBid)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Price</p>
                <p className="text-xl font-bold">{formatPrice(stats.avgPrice)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <TrendingDown className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Median Price</p>
                <p className="text-xl font-bold">{formatPrice(stats.medianPrice)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/20">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unsold</p>
                <p className="text-xl font-bold">{stats.unsoldCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Bid Player */}
        {stats.topBidPlayer && (
          <Card className="border-border/50 border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex items-center gap-4 flex-1">
                  {stats.topBidPlayer.player.photo_url ? (
                    <img
                      src={stats.topBidPlayer.player.photo_url}
                      alt={stats.topBidPlayer.player.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-yellow-500 font-medium">Highest Paid Player</p>
                    <p className="text-lg font-bold">{stats.topBidPlayer.player.full_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getRoleBadgeColor(stats.topBidPlayer.player.role)}>
                        {formatRole(stats.topBidPlayer.player.role)}
                      </Badge>
                      {stats.topBidPlayer.team && (
                        <span className="text-sm text-muted-foreground">
                          → {stats.topBidPlayer.team.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg px-4 py-2">
                  {formatPrice(stats.topBidPlayer.sold_price || 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Breakdown */}
        {teamStats.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Team Acquisitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamStats.map(team => (
                  <div 
                    key={team.id}
                    className="p-4 rounded-lg border border-border/50 bg-card/50"
                    style={{ borderLeftColor: team.primary_color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.primary_color }}
                        >
                          {team.short_name}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.players.length} players • Spent {formatPrice(team.totalSpent)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-primary">${team.remaining_budget.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Retained Players */}
        {retainedPlayers && retainedPlayers.length > 0 && (
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl">Retained Players</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Pre-auction retained squad members
                  </p>
                </div>
              </div>
              {retainedPlayers && (
                <div className="flex items-center gap-2 ml-1 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-sm font-semibold text-emerald-600">{retainedPlayers.length} Players</span>
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Tabs value={retainedTab} onValueChange={setRetainedTab} className="w-full">
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {[...new Map(retainedPlayers.map(p => [p.team?.id, p.team])).values()]
                    .filter((team): team is RetainedPlayer['team'] => team !== null)
                    .map(team => (
                      <TabsTrigger key={team.id} value={team.id}>
                        {team.short_name}
                      </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={retainedTab}>
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-72 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    (() => {
                      const filtered = retainedTab === "all" 
                        ? retainedPlayers 
                        : retainedPlayers.filter(p => p.team?.id === retainedTab);
                      
                      return filtered.length === 0 ? (
                        <div className="text-center py-12">
                          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">No retained players in this team</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filtered.map((p) => (
                            <div
                              key={p.id}
                              className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                            >
                              {/* Background gradient accent */}
                              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              
                              <div className="relative p-4 space-y-4">
                                {/* Player Image */}
                                <div className="flex justify-center">
                                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center overflow-hidden ring-3 ring-border/40 group-hover:ring-emerald-500/30 transition-all duration-300 shadow-md">
                                    {p.player.photo_url ? (
                                      <img
                                        src={p.player.photo_url}
                                        alt={p.player.full_name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                      />
                                    ) : (
                                      <Users className="w-12 h-12 text-muted-foreground/50" />
                                    )}
                                  </div>
                                </div>

                                {/* Player Name */}
                                <div className="text-center">
                                  <h4 className="font-bold text-lg text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2">
                                    {p.player.full_name}
                                  </h4>
                                </div>

                                {/* Role Badge */}
                                <div className="flex justify-center">
                                  <Badge 
                                    className={`text-sm px-3 py-1 font-semibold ${getRoleBadgeColor(p.player.role)}`}
                                  >
                                    {formatRole(p.player.role)}
                                  </Badge>
                                </div>

                                {/* Team Section */}
                                {p.team && (
                                  <div className="pt-3 border-t border-border/40">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                      {p.team.logo_url ? (
                                        <img
                                          src={p.team.logo_url}
                                          alt={p.team.name}
                                          className="w-6 h-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                          style={{ backgroundColor: p.team.primary_color }}
                                        >
                                          {p.team.short_name.charAt(0)}
                                        </div>
                                      )}
                                      <span className="text-xs font-medium text-muted-foreground">{p.team.name}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Retained Badge */}
                                <div className="pt-2 border-t border-border/40">
                                  <div className="flex justify-center">
                                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-semibold">
                                      ✓ Retained
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Unsold Players */}
        {unsoldPlayers && unsoldPlayers.length > 0 && (
          <Card className="border-border/50 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Unsold Players ({unsoldPlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unsoldPlayers.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50"
                  >
                    {p.player.photo_url ? (
                      <img
                        src={p.player.photo_url}
                        alt={p.player.full_name}
                        className="w-10 h-10 rounded-full object-cover grayscale opacity-70"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-muted-foreground">{p.player.full_name}</p>
                      <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(p.player.role)}`}>
                        {formatRole(p.player.role)}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Base: {formatPrice(p.base_price)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players List */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                      <Gavel className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl md:text-3xl">Sold Players</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Players acquired in the auction
                      </p>
                    </div>
                  </div>
                  {!isLoading && soldPlayers && (
                    <div className="flex items-center gap-2 ml-1 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-sm font-semibold text-green-600">{soldPlayers.length} Players</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "roles" ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setViewMode("roles"); setActiveTab("all"); }}
                    >
                      By Role
                    </Button>
                    <Button
                      variant={viewMode === "teams" ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setViewMode("teams"); setActiveTab("all"); }}
                    >
                      By Team
                    </Button>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players or teams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All</TabsTrigger>
                {viewMode === "roles" ? (
                  <>
                    <TabsTrigger value="batsman">Batsmen</TabsTrigger>
                    <TabsTrigger value="bowler">Bowlers</TabsTrigger>
                    <TabsTrigger value="all_rounder">All-Rounders</TabsTrigger>
                    <TabsTrigger value="wicket_keeper">Keepers</TabsTrigger>
                  </>
                ) : (
                  teamStats.map(team => (
                    <TabsTrigger key={team.id} value={team.id}>
                      {team.short_name}
                    </TabsTrigger>
                  ))
                )}
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-72 w-full rounded-xl" />
                    ))}
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No players found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                      >
                        {/* Background gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative p-4 space-y-4">
                          {/* Player Image */}
                          <div className="flex justify-center">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center overflow-hidden ring-3 ring-border/40 group-hover:ring-green-500/30 transition-all duration-300 shadow-md">
                              {p.player.photo_url ? (
                                <img
                                  src={p.player.photo_url}
                                  alt={p.player.full_name}
                                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <Users className="w-12 h-12 text-muted-foreground/50" />
                              )}
                            </div>
                          </div>

                          {/* Player Name */}
                          <div className="text-center">
                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {p.player.full_name}
                            </h4>
                          </div>

                          {/* Role Badge */}
                          <div className="flex justify-center">
                            <Badge 
                              className={`text-sm px-3 py-1 font-semibold ${getRoleBadgeColor(p.player.role)}`}
                            >
                              {formatRole(p.player.role)}
                            </Badge>
                          </div>

                          {/* Team Section */}
                          {p.team && (
                            <div className="pt-3 border-t border-border/40">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                {p.team.logo_url ? (
                                  <img
                                    src={p.team.logo_url}
                                    alt={p.team.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                    style={{ backgroundColor: p.team.primary_color }}
                                  >
                                    {p.team.short_name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-xs font-medium text-muted-foreground">{p.team.name}</span>
                              </div>
                            </div>
                          )}

                          {/* Price Section */}
                          <div className="pt-2 border-t border-border/40">
                            <p className="text-xs text-muted-foreground text-center mb-1">Sold For</p>
                            <p className="text-2xl font-display font-bold text-center text-green-600">
                              {formatPrice(p.sold_price || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}