import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentSoldPlayersProps {
  seasonId: string | undefined;
  limit?: number;
}

export function RecentSoldPlayers({ seasonId, limit = 3 }: RecentSoldPlayersProps) {
  const { data: soldPlayers, isLoading } = useQuery({
    queryKey: ["recent-sold-players", seasonId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*, teams(*)")
        .eq("auction_status", "sold")
        .eq("season_id", seasonId!)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!seasonId,
  });

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 max-w-2xl mx-auto">
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!soldPlayers || soldPlayers.length === 0) {
    return (
      <Card className="border-border/50 max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No players have been sold recently.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-primary" />
          Recently Sold
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {soldPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                index === 0
                  ? "bg-yellow-500/10 border border-yellow-500/30"
                  : "bg-muted/30 border border-border/50"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-medium truncate">{player.full_name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {roleLabels[player.role]}
                  </Badge>
                  {player.teams && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: player.teams.primary_color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {player.teams.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-lg">
                  ${player.sold_price?.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Sold</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
