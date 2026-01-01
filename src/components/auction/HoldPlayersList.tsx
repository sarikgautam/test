import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HoldPlayersListProps {
  seasonId: string | undefined;
}

export function HoldPlayersList({ seasonId }: HoldPlayersListProps) {
  const queryClient = useQueryClient();
  
  const { data: holdPlayers, isLoading } = useQuery({
    queryKey: ["hold-players", seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(`
          *,
          players:player_id(*)
        `)
        .eq("auction_status", "hold")
        .eq("season_id", seasonId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!seasonId,
  });

  // Subscribe to realtime updates for hold players
  useEffect(() => {
    if (!seasonId) return;

    const channel = supabase
      .channel("hold-players-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_season_registrations",
          filter: `season_id=eq.${seasonId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hold-players", seasonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId, queryClient]);

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!holdPlayers || holdPlayers.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players on hold.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Players marked as "hold" will appear here and be available for post-auction sale.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-orange-500" />
          Players on Hold ({holdPlayers.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Available for post-auction acquisition
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdPlayers.map((registration) => {
            const player = registration.players as any;
            
            return (
              <div
                key={registration.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-orange-500/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {player?.photo_url ? (
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
                  <p className="font-medium truncate">{player?.full_name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {roleLabels[player?.role] || player?.role}
                    </Badge>
                    <Badge className="text-xs bg-orange-500/20 text-orange-500 border-orange-500/30">
                      On Hold
                    </Badge>
                  </div>
                  {registration.base_price && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Base: ${registration.base_price.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
