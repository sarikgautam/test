import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, User, Search, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SoldPlayersListProps {
  seasonId: string | undefined;
}

export function SoldPlayersList({ seasonId }: SoldPlayersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: soldPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ["sold-players", seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*, team:teams(*)")
        .eq("auction_status", "sold")
        .eq("season_id", seasonId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!seasonId,
  });

  const { data: teams } = useQuery({
    queryKey: ["auction-teams-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const getFilteredPlayers = (filter: string) => {
    let filtered = soldPlayers?.filter((player) =>
      player.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filter === "all") {
      return filtered?.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }

    if (filter === "top-price") {
      return filtered?.sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0));
    }

    // Filter by team
    return filtered
      ?.filter((player) => player.team_id === filter)
      .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0));
  };

  const topExpensivePlayers = [...(soldPlayers || [])]
    .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
    .slice(0, 5);

  const totalSpent = soldPlayers?.reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;

  if (playersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!soldPlayers || soldPlayers.length === 0) {
    return null;
  }

  const filteredPlayers = getFilteredPlayers(activeTab);

  // Get teams that have bought players
  const teamsWithPlayers = teams?.filter((team) =>
    soldPlayers.some((player) => player.team_id === team.id)
  );

  return (
    <div className="space-y-8">
      {/* Top Expensive Players */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Top Expensive Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {topExpensivePlayers.map((player, index) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg border ${
                  index === 0
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : index === 1
                    ? "bg-gray-300/10 border-gray-300/30"
                    : index === 2
                    ? "bg-amber-700/10 border-amber-700/30"
                    : "bg-muted/30 border-border/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
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
                  <span className="font-bold text-lg text-primary">#{index + 1}</span>
                </div>
                <p className="font-medium text-sm truncate">{player.full_name}</p>
                <p className="text-primary font-bold">
                  ${player.sold_price?.toLocaleString()}
                </p>
                {player.team && (
                  <div className="flex items-center gap-1 mt-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: player.team.primary_color }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {player.team.short_name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">${(totalSpent / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{soldPlayers.length}</p>
            <p className="text-xs text-muted-foreground">Players Sold</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">
              ${topExpensivePlayers[0]?.sold_price?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground">Highest Bid</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">
              ${Math.round(totalSpent / soldPlayers.length / 1000)}K
            </p>
            <p className="text-xs text-muted-foreground">Avg Price</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            Sold Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
                <TabsTrigger value="all" className="flex-shrink-0">
                  All ({soldPlayers.length})
                </TabsTrigger>
                <TabsTrigger value="top-price" className="flex-shrink-0">
                  By Price
                </TabsTrigger>
                {teamsWithPlayers?.map((team) => (
                  <TabsTrigger
                    key={team.id}
                    value={team.id}
                    className="flex-shrink-0 flex items-center gap-1.5"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.primary_color }}
                    />
                    {team.short_name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Player Grid - shared across all tabs */}
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredPlayers?.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-sm truncate">{player.full_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {roleLabels[player.role]}
                        </Badge>
                        {player.team && (
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: player.team.primary_color }}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {player.team.short_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">
                        ${player.sold_price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPlayers?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No players match your search.
                </p>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
