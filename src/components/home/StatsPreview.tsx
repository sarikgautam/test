import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, User, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useActiveSeason } from "@/hooks/useSeason";

interface PlayerWithStats {
  id: string;
  full_name: string;
  photo_url: string | null;
  team: {
    id: string;
    name: string;
    short_name: string;
    primary_color: string;
  } | null;
  stats: {
    runs_scored: number;
    wickets: number;
    catches: number;
    fours: number;
    sixes: number;
  };
}

export const StatsPreview = () => {
  const { activeSeason } = useActiveSeason();

  const { data: playersWithStats, isLoading } = useQuery({
    queryKey: ["home-player-stats", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return [];

      // Get all players with their teams
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, full_name, photo_url, team:teams(id, name, short_name, primary_color)")
        .order("full_name");
      if (playersError) throw playersError;

      // Get aggregated stats for active season
      const { data: stats, error: statsError } = await supabase
        .from("player_stats")
        .select("*")
        .eq("season_id", activeSeason.id);
      if (statsError) throw statsError;

      // Aggregate stats per player
      const aggregatedStats: Record<string, PlayerWithStats["stats"]> = {};
      stats?.forEach((stat) => {
        if (!aggregatedStats[stat.player_id]) {
          aggregatedStats[stat.player_id] = {
            runs_scored: 0,
            wickets: 0,
            catches: 0,
            fours: 0,
            sixes: 0,
          };
        }
        const s = aggregatedStats[stat.player_id];
        s.runs_scored += stat.runs_scored;
        s.wickets += stat.wickets;
        s.catches += stat.catches;
        s.fours += stat.fours;
        s.sixes += stat.sixes;
      });

      // Combine players with their stats
      return players?.map((player) => ({
        ...player,
        team: player.team as PlayerWithStats["team"],
        stats: aggregatedStats[player.id] || {
          runs_scored: 0,
          wickets: 0,
          catches: 0,
          fours: 0,
          sixes: 0,
        },
      })) as PlayerWithStats[];
    },
    enabled: !!activeSeason?.id,
  });

  // Top performers
  const topRunScorers = [...(playersWithStats || [])]
    .filter((p) => p.stats.runs_scored > 0)
    .sort((a, b) => b.stats.runs_scored - a.stats.runs_scored)
    .slice(0, 3);

  const topWicketTakers = [...(playersWithStats || [])]
    .filter((p) => p.stats.wickets > 0)
    .sort((a, b) => b.stats.wickets - a.stats.wickets)
    .slice(0, 3);

  const mostSixes = [...(playersWithStats || [])]
    .filter((p) => p.stats.sixes > 0)
    .sort((a, b) => b.stats.sixes - a.stats.sixes)
    .slice(0, 3);

  const mostCatches = [...(playersWithStats || [])]
    .filter((p) => p.stats.catches > 0)
    .sort((a, b) => b.stats.catches - a.stats.catches)
    .slice(0, 3);

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <Skeleton className="h-64 w-full" />
        </div>
      </section>
    );
  }

  if (!topRunScorers.length && !topWicketTakers.length) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Player <span className="text-gradient-gold">Statistics</span>
          </h2>
          <p className="text-muted-foreground">
            Top performers of the season
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Top Run Scorers */}
          {topRunScorers.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="w-5 h-5 text-primary" />
                  Top Run Scorers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRunScorers.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                      }`}
                    >
                      <span className="font-bold text-primary text-sm w-5">
                        #{index + 1}
                      </span>
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
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{player.full_name}</p>
                        {player.team && (
                          <p className="text-xs text-muted-foreground truncate">
                            {player.team.short_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary">{player.stats.runs_scored}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Wicket Takers */}
          {topWicketTakers.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-primary" />
                  Top Wicket Takers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topWicketTakers.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                      }`}
                    >
                      <span className="font-bold text-primary text-sm w-5">
                        #{index + 1}
                      </span>
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
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{player.full_name}</p>
                        {player.team && (
                          <p className="text-xs text-muted-foreground truncate">
                            {player.team.short_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary">{player.stats.wickets}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Most Sixes */}
          {mostSixes.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Most Sixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mostSixes.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                      }`}
                    >
                      <span className="font-bold text-primary text-sm w-5">
                        #{index + 1}
                      </span>
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
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{player.full_name}</p>
                        {player.team && (
                          <p className="text-xs text-muted-foreground truncate">
                            {player.team.short_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary">{player.stats.sixes}</p>
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
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="w-5 h-5 text-primary" />
                  Most Catches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mostCatches.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        index === 0 ? "bg-yellow-500/10" : "bg-muted/30"
                      }`}
                    >
                      <span className="font-bold text-primary text-sm w-5">
                        #{index + 1}
                      </span>
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
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{player.full_name}</p>
                        {player.team && (
                          <p className="text-xs text-muted-foreground truncate">
                            {player.team.short_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary">{player.stats.catches}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Link to="/stats">
            <Button variant="outline" size="lg">
              View All Statistics
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
