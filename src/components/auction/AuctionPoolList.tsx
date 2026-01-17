import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, User, TrendingUp, Filter, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuctionPoolListProps {
  seasonId: string | undefined;
}

interface PlayerRegistration {
  id: string;
  base_price: number;
  auction_status: string;
  residency_type: string | null;
  player: {
    id: string;
    full_name: string;
    photo_url: string | null;
    role: string;
    batting_style: string | null;
    bowling_style: string | null;
  };
}

export function AuctionPoolList({ seasonId }: AuctionPoolListProps) {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: poolPlayers, isLoading } = useQuery({
    queryKey: ["auction-pool-players", seasonId],
    queryFn: async () => {
      if (!seasonId) return [];
      
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(`
          id,
          base_price,
          auction_status,
          residency_type,
          player:players!inner(
            id,
            full_name,
            photo_url,
            role,
            batting_style,
            bowling_style
          )
        `)
        .eq("season_id", seasonId)
        .in("auction_status", ["registered", "unsold"]);
      
      if (error) throw error;
      return data as unknown as PlayerRegistration[];
    },
    enabled: !!seasonId,
    refetchInterval: 5000, // Refresh every 5 seconds to stay updated
  });

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const roleColors: Record<string, string> = {
    batsman: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    bowler: "bg-red-500/20 text-red-600 border-red-500/30",
    all_rounder: "bg-purple-500/20 text-purple-600 border-purple-500/30",
    wicket_keeper: "bg-green-500/20 text-green-600 border-green-500/30",
  };

  // Filter and sort players
  const filteredPlayers = poolPlayers?.filter(reg => {
    const matchesRole = roleFilter === "all" || reg.player.role === roleFilter;
    const matchesSearch = !searchQuery || 
      reg.player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.player.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.player.batting_style?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.player.bowling_style?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const sortedPlayers = [...(filteredPlayers || [])].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.player.full_name.localeCompare(b.player.full_name);
      case "price-high":
        return b.base_price - a.base_price;
      case "price-low":
        return a.base_price - b.base_price;
      case "role":
        return a.player.role.localeCompare(b.player.role);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl md:text-3xl">Auction Pool</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Players available for bidding
                    </p>
                  </div>
                </div>
                {!isLoading && poolPlayers && (
                  <div className="flex items-center gap-2 ml-1 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-sm font-semibold text-primary">{poolPlayers.length} Players</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, role, or style..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-border/60 focus:border-primary/50"
                />
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="batsman">Batsman</SelectItem>
                    <SelectItem value="bowler">Bowler</SelectItem>
                    <SelectItem value="all_rounder">All-Rounder</SelectItem>
                    <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="price-high">Price (High)</SelectItem>
                    <SelectItem value="price-low">Price (Low)</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : sortedPlayers && sortedPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedPlayers.map((reg) => (
                <div
                  key={reg.id}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Background gradient accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Status Badge */}
                  {reg.auction_status === "unsold" && (
                    <Badge 
                      className="absolute top-3 right-3 text-xs bg-amber-500/20 text-amber-600 border-amber-500/40 font-semibold"
                    >
                      🔄 Unsold
                    </Badge>
                  )}
                  
                  <div className="relative p-4 space-y-4">
                    {/* Player Image */}
                    <div className="flex justify-center">
                      <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden ring-3 ring-border/40 group-hover:ring-primary/30 transition-all duration-300 shadow-md">
                        {reg.player.photo_url ? (
                          <img
                            src={reg.player.photo_url}
                            alt={reg.player.full_name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <User className="w-12 h-12 text-muted-foreground/50" />
                        )}
                      </div>
                    </div>

                    {/* Player Name */}
                    <div className="text-center">
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {reg.player.full_name}
                      </h4>
                    </div>

                    {/* Role and Residency Badges */}
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge 
                        className={`text-sm px-3 py-1 font-semibold ${roleColors[reg.player.role] || 'bg-muted'}`}
                      >
                        {roleLabels[reg.player.role]}
                      </Badge>
                      {reg.residency_type && reg.residency_type !== "other-state" && (
                        <Badge className={reg.residency_type === "gc-tweed" ? "bg-blue-500/20 text-blue-600 border-blue-500/30" : "bg-purple-500/20 text-purple-600 border-purple-500/30"}>
                          {reg.residency_type === "gc-tweed" ? "🏆 GC" : "🏘️ QLD"}
                        </Badge>
                      )}
                    </div>

                    {/* Playing Styles */}
                    {(reg.player.batting_style || reg.player.bowling_style) && (
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {reg.player.batting_style && (
                          <span className="text-[11px] font-medium text-blue-600 bg-blue-500/15 px-2.5 py-1 rounded-full border border-blue-500/20">
                            {reg.player.batting_style}
                          </span>
                        )}
                        {reg.player.bowling_style && (
                          <span className="text-[11px] font-medium text-red-600 bg-red-500/15 px-2.5 py-1 rounded-full border border-red-500/20">
                            {reg.player.bowling_style}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">
                {roleFilter !== "all" 
                  ? "No players found with the selected filter"
                  : "No players in the auction pool"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
