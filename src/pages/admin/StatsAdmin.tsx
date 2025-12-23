import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PlayerStat = Database["public"]["Tables"]["player_stats"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface AggregatedStats {
  player_id: string;
  player_name: string;
  matches: number;
  runs_scored: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  overs_bowled: number;
  runs_conceded: number;
  wickets: number;
  maidens: number;
  catches: number;
  stumpings: number;
  run_outs: number;
}

export default function StatsAdmin() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-player-stats"],
    queryFn: async () => {
      const { data: playerStats, error: statsError } = await supabase
        .from("player_stats")
        .select("*");
      if (statsError) throw statsError;

      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, full_name");
      if (playersError) throw playersError;

      // Aggregate stats by player
      const aggregated: Record<string, AggregatedStats> = {};

      playerStats.forEach((stat: PlayerStat) => {
        if (!aggregated[stat.player_id]) {
          const player = players.find((p: Player) => p.id === stat.player_id);
          aggregated[stat.player_id] = {
            player_id: stat.player_id,
            player_name: player?.full_name || "Unknown",
            matches: 0,
            runs_scored: 0,
            balls_faced: 0,
            fours: 0,
            sixes: 0,
            overs_bowled: 0,
            runs_conceded: 0,
            wickets: 0,
            maidens: 0,
            catches: 0,
            stumpings: 0,
            run_outs: 0,
          };
        }

        aggregated[stat.player_id].matches += 1;
        aggregated[stat.player_id].runs_scored += stat.runs_scored;
        aggregated[stat.player_id].balls_faced += stat.balls_faced;
        aggregated[stat.player_id].fours += stat.fours;
        aggregated[stat.player_id].sixes += stat.sixes;
        aggregated[stat.player_id].overs_bowled += Number(stat.overs_bowled);
        aggregated[stat.player_id].runs_conceded += stat.runs_conceded;
        aggregated[stat.player_id].wickets += stat.wickets;
        aggregated[stat.player_id].maidens += stat.maidens;
        aggregated[stat.player_id].catches += stat.catches;
        aggregated[stat.player_id].stumpings += stat.stumpings;
        aggregated[stat.player_id].run_outs += stat.run_outs;
      });

      return Object.values(aggregated).sort((a, b) => b.runs_scored - a.runs_scored);
    },
  });

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return 0;
    return ((runs / balls) * 100).toFixed(2);
  };

  const calculateEconomy = (runs: number, overs: number) => {
    if (overs === 0) return 0;
    return (runs / overs).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Player Statistics</h1>
        <p className="text-muted-foreground mt-1">
          View aggregated player stats across all matches
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : stats && stats.length > 0 ? (
        <div className="border rounded-lg border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">M</TableHead>
                <TableHead className="text-center">Runs</TableHead>
                <TableHead className="text-center">BF</TableHead>
                <TableHead className="text-center">4s</TableHead>
                <TableHead className="text-center">6s</TableHead>
                <TableHead className="text-center">SR</TableHead>
                <TableHead className="text-center">Overs</TableHead>
                <TableHead className="text-center">Wkts</TableHead>
                <TableHead className="text-center">Runs</TableHead>
                <TableHead className="text-center">Econ</TableHead>
                <TableHead className="text-center">Ct</TableHead>
                <TableHead className="text-center">St</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((stat) => (
                <TableRow key={stat.player_id}>
                  <TableCell className="font-medium">{stat.player_name}</TableCell>
                  <TableCell className="text-center">{stat.matches}</TableCell>
                  <TableCell className="text-center font-bold">{stat.runs_scored}</TableCell>
                  <TableCell className="text-center">{stat.balls_faced}</TableCell>
                  <TableCell className="text-center">{stat.fours}</TableCell>
                  <TableCell className="text-center">{stat.sixes}</TableCell>
                  <TableCell className="text-center">
                    {calculateStrikeRate(stat.runs_scored, stat.balls_faced)}
                  </TableCell>
                  <TableCell className="text-center">{stat.overs_bowled.toFixed(1)}</TableCell>
                  <TableCell className="text-center font-bold">{stat.wickets}</TableCell>
                  <TableCell className="text-center">{stat.runs_conceded}</TableCell>
                  <TableCell className="text-center">
                    {calculateEconomy(stat.runs_conceded, stat.overs_bowled)}
                  </TableCell>
                  <TableCell className="text-center">{stat.catches}</TableCell>
                  <TableCell className="text-center">{stat.stumpings}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No player stats recorded yet. Stats will appear once matches are played.
          </p>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <strong>Legend:</strong> M = Matches, BF = Balls Faced, SR = Strike Rate,
        Wkts = Wickets, Econ = Economy, Ct = Catches, St = Stumpings
      </div>
    </div>
  );
}
