import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, RefreshCw, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useSeason } from "@/hooks/useSeason";
import type { Database } from "@/integrations/supabase/types";

type Standing = Database["public"]["Tables"]["standings"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface StandingWithTeam {
  id: string;
  team_id: string;
  season_id: string | null;
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  no_results: number;
  points: number;
  runs_scored: number;
  runs_conceded: number;
  overs_faced: number;
  overs_bowled: number;
  net_run_rate: number;
  updated_at: string;
  team?: Team;
}

export default function StandingsAdmin() {
  const [editableStandings, setEditableStandings] = useState<StandingWithTeam[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();

  const { data: standings, isLoading } = useQuery({
    queryKey: ["admin-standings", selectedSeasonId],
    queryFn: async () => {
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (teamsError) throw teamsError;

      let query = supabase.from("standings").select("*");
      if (selectedSeasonId) {
        query = query.eq("season_id", selectedSeasonId);
      }
      const { data: standingsData, error: standingsError } = await query;
      if (standingsError) throw standingsError;

      // Map teams to standings, creating entries for teams without standings
      const result: StandingWithTeam[] = teams.map((team) => {
        const standing = standingsData.find((s) => s.team_id === team.id);
        if (standing) {
          return { ...standing, team };
        }
        return {
          id: "",
          team_id: team.id,
          season_id: selectedSeasonId,
          matches_played: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          no_results: 0,
          points: 0,
          runs_scored: 0,
          runs_conceded: 0,
          overs_faced: 0,
          overs_bowled: 0,
          net_run_rate: 0,
          updated_at: new Date().toISOString(),
          team,
        };
      });

      return result;
    },
    enabled: !!selectedSeasonId,
  });

  useEffect(() => {
    if (standings) {
      setEditableStandings(standings);
    }
  }, [standings]);

  const saveMutation = useMutation({
    mutationFn: async (standingsToSave: StandingWithTeam[]) => {
      for (const standing of standingsToSave) {
        const data = {
          team_id: standing.team_id,
          season_id: selectedSeasonId,
          matches_played: standing.matches_played,
          wins: standing.wins,
          losses: standing.losses,
          ties: standing.ties,
          no_results: standing.no_results,
          points: standing.points,
          runs_scored: standing.runs_scored,
          runs_conceded: standing.runs_conceded,
          overs_faced: standing.overs_faced,
          overs_bowled: standing.overs_bowled,
          net_run_rate: standing.net_run_rate,
        };

        if (standing.id) {
          const { error } = await supabase
            .from("standings")
            .update(data)
            .eq("id", standing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("standings").insert(data);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standings", selectedSeasonId] });
      toast({ title: "Standings saved successfully" });
    },
    onError: (error) => {
      toast({ title: "Error saving standings", description: error.message, variant: "destructive" });
    },
  });

  const updateStanding = (index: number, field: keyof Standing, value: number) => {
    const updated = [...editableStandings];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate points (2 per win, 1 per tie/NR)
    const wins = updated[index].wins;
    const ties = updated[index].ties;
    const noResults = updated[index].no_results;
    updated[index].points = wins * 2 + ties + noResults;

    // Auto-calculate matches played
    updated[index].matches_played =
      wins + updated[index].losses + ties + noResults;

    // Auto-calculate NRR
    const oversF = updated[index].overs_faced || 1;
    const oversB = updated[index].overs_bowled || 1;
    const runsF = updated[index].runs_scored;
    const runsC = updated[index].runs_conceded;
    const nrr = runsF / oversF - runsC / oversB;
    updated[index].net_run_rate = Math.round(nrr * 1000) / 1000;

    setEditableStandings(updated);
  };

  const handleSave = () => {
    saveMutation.mutate(editableStandings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Standings Management</h1>
          <p className="text-muted-foreground mt-1">Update team standings and points table</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-standings"] })}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : (
        <div className="border rounded-lg border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">T</TableHead>
                <TableHead className="text-center">NR</TableHead>
                <TableHead className="text-center">Pts</TableHead>
                <TableHead className="text-center">RF</TableHead>
                <TableHead className="text-center">RA</TableHead>
                <TableHead className="text-center">OF</TableHead>
                <TableHead className="text-center">OB</TableHead>
                <TableHead className="text-center">NRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editableStandings.map((standing, index) => (
                <TableRow key={standing.team_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: standing.team?.primary_color }}
                      />
                      {standing.team?.short_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-14 text-center"
                      value={standing.wins}
                      onChange={(e) => updateStanding(index, "wins", parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-14 text-center"
                      value={standing.losses}
                      onChange={(e) =>
                        updateStanding(index, "losses", parseInt(e.target.value) || 0)
                      }
                      min={0}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-14 text-center"
                      value={standing.ties}
                      onChange={(e) => updateStanding(index, "ties", parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-14 text-center"
                      value={standing.no_results}
                      onChange={(e) =>
                        updateStanding(index, "no_results", parseInt(e.target.value) || 0)
                      }
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary">
                    {standing.points}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={standing.runs_scored}
                      onChange={(e) =>
                        updateStanding(index, "runs_scored", parseInt(e.target.value) || 0)
                      }
                      min={0}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={standing.runs_conceded}
                      onChange={(e) =>
                        updateStanding(index, "runs_conceded", parseInt(e.target.value) || 0)
                      }
                      min={0}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={standing.overs_faced}
                      onChange={(e) =>
                        updateStanding(index, "overs_faced", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step={0.1}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={standing.overs_bowled}
                      onChange={(e) =>
                        updateStanding(index, "overs_bowled", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step={0.1}
                    />
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {standing.net_run_rate > 0 ? "+" : ""}
                    {standing.net_run_rate.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
              {editableStandings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No teams found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <strong>Legend:</strong> W = Wins, L = Losses, T = Ties, NR = No Result, Pts = Points,
        RF = Runs For, RA = Runs Against, OF = Overs Faced, OB = Overs Bowled, NRR = Net Run Rate
      </div>
    </div>
  );
}
