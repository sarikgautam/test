import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Search, 
  Gavel,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useSeason";

interface SoldPlayer {
  id: string;
  full_name: string;
  role: string;
  sold_price: number;
  photo_url: string | null;
  teams: {
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
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(1)}L`;
  }
  return `₹${price.toLocaleString()}`;
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

  const { data: soldPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ["auction-stats-players", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return [];
      
      const { data, error } = await supabase
        .from("players")
        .select(`
          id,
          full_name,
          role,
          sold_price,
          photo_url,
          teams(id, name, short_name, primary_color, logo_url)
        `)
        .eq("season_id", activeSeason.id)
        .eq("auction_status", "sold")
        .order("sold_price", { ascending: false });

      if (error) throw error;
      return data as SoldPlayer[];
    },
    enabled: !!activeSeason?.id,
  });

  const { data: teams } = useQuery({
    queryKey: ["auction-stats-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, short_name, primary_color, logo_url, remaining_budget, budget")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Calculate team stats
  const teamStats: TeamStats[] = teams?.map(team => {
    const teamPlayers = soldPlayers?.filter(p => p.teams?.id === team.id) || [];
    const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
    
    return {
      ...team,
      players: teamPlayers,
      totalSpent,
    };
  }).filter(t => t.players.length > 0) || [];

  const filteredPlayers = soldPlayers?.filter(player => {
    const matchesSearch = player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.teams?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && player.role === activeTab;
  }) || [];

  const isLoading = seasonLoading || playersLoading;

  const totalPlayersCount = soldPlayers?.length || 0;
  const totalSpent = soldPlayers?.reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;
  const highestBid = soldPlayers?.[0]?.sold_price || 0;

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
              Complete overview of all sold players and team acquisitions
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Players Sold</p>
                <p className="text-2xl font-bold">{totalPlayersCount}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Gavel className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Bid</p>
                <p className="text-2xl font-bold">{formatPrice(highestBid)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    <div className="text-xs text-muted-foreground">
                      Budget: {formatPrice(team.remaining_budget)} / {formatPrice(team.budget)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players List */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg">Sold Players</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search players or teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="batsman">Batsmen</TabsTrigger>
                <TabsTrigger value="bowler">Bowlers</TabsTrigger>
                <TabsTrigger value="all_rounder">All-Rounders</TabsTrigger>
                <TabsTrigger value="wicket_keeper">Keepers</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No players found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {player.photo_url ? (
                            <img
                              src={player.photo_url}
                              alt={player.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{player.full_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRoleBadgeColor(player.role)}`}
                              >
                                {formatRole(player.role)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {player.teams && (
                            <div className="flex items-center gap-2">
                              {player.teams.logo_url ? (
                                <img
                                  src={player.teams.logo_url}
                                  alt={player.teams.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: player.teams.primary_color }}
                                >
                                  {player.teams.short_name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm text-muted-foreground hidden md:inline">
                                {player.teams.short_name}
                              </span>
                            </div>
                          )}
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {formatPrice(player.sold_price || 0)}
                          </Badge>
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
