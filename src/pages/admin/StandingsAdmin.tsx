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
import { Save, RefreshCw, Trophy, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { useSeason } from "@/hooks/useSeason";
import type { Database } from "@/integrations/supabase/types";

type Standing = Database["public"]["Tables"]["standings"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];

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

// Helper to convert overs string (e.g., "19.3") to decimal overs for NRR calculation
const parseOvers = (overs: string | null): number => {
  if (!overs) return 0;
  const parts = overs.split(".");
  const fullOvers = parseInt(parts[0]) || 0;
  const balls = parseInt(parts[1]) || 0;
  return fullOvers + balls / 6;
};

export default function StandingsAdmin() {
  const [editableStandings, setEditableStandings] = useState<StandingWithTeam[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  // Fetch completed group stage matches for recalculation
  const { data: groupMatches } = useQuery({
    queryKey: ["group-matches", selectedSeasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("season_id", selectedSeasonId!)
        .eq("status", "completed")
        .eq("match_stage", "group");
      if (error) throw error;
      return data as Match[];
    },
    enabled: !!selectedSeasonId,
  });

  const { data: standings, isLoading } = useQuery({
    queryKey: ["admin-standings", selectedSeasonId],
    queryFn: async () => {
      const { data: teamsData, error: teamsError } = await supabase
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
      const result: StandingWithTeam[] = teamsData.map((team) => {
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

  const recalculateFromResults = () => {
    if (!teams || !groupMatches) {
      toast({ title: "Unable to recalculate", description: "Missing teams or matches data", variant: "destructive" });
      return;
    }

    // Initialize standings for all teams
    const calculatedStandings: Map<string, {
      wins: number;
      losses: number;
      ties: number;
      no_results: number;
      runs_scored: number;
      runs_conceded: number;
      overs_faced: number;
      overs_bowled: number;
    }> = new Map();

    teams.forEach((team) => {
      calculatedStandings.set(team.id, {
        wins: 0,
        losses: 0,
        ties: 0,
        no_results: 0,
        runs_scored: 0,
        runs_conceded: 0,
        overs_faced: 0,
        overs_bowled: 0,
      });
    });

    // Process each group stage match
    groupMatches.forEach((match) => {
      const homeStats = calculatedStandings.get(match.home_team_id);
      const awayStats = calculatedStandings.get(match.away_team_id);

      if (!homeStats || !awayStats) return;

      const homeRuns = match.home_team_runs || 0;
      const awayRuns = match.away_team_runs || 0;
      const homeOvers = parseOvers(match.home_team_overs);
      const awayOvers = parseOvers(match.away_team_overs);

      // Update runs and overs
      homeStats.runs_scored += homeRuns;
      homeStats.runs_conceded += awayRuns;
      homeStats.overs_faced += homeOvers;
      homeStats.overs_bowled += awayOvers;

      awayStats.runs_scored += awayRuns;
      awayStats.runs_conceded += homeRuns;
      awayStats.overs_faced += awayOvers;
      awayStats.overs_bowled += homeOvers;

      // Determine winner
      if (match.winner_team_id === match.home_team_id) {
        homeStats.wins += 1;
        awayStats.losses += 1;
      } else if (match.winner_team_id === match.away_team_id) {
        awayStats.wins += 1;
        homeStats.losses += 1;
      } else if (homeRuns === awayRuns && homeRuns > 0) {
        // Tie
        homeStats.ties += 1;
        awayStats.ties += 1;
      } else {
        // No result (if match has no winner and no runs - though this is rare for completed matches)
        homeStats.no_results += 1;
        awayStats.no_results += 1;
      }
    });

    // Update editable standings with calculated values
    const updated = editableStandings.map((standing) => {
      const stats = calculatedStandings.get(standing.team_id);
      if (!stats) return standing;

      const matchesPlayed = stats.wins + stats.losses + stats.ties + stats.no_results;
      const points = stats.wins * 2 + stats.ties + stats.no_results;

      // Calculate NRR
      const oversF = stats.overs_faced || 1;
      const oversB = stats.overs_bowled || 1;
      const nrr = stats.runs_scored / oversF - stats.runs_conceded / oversB;

      return {
        ...standing,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        no_results: stats.no_results,
        matches_played: matchesPlayed,
        points,
        runs_scored: stats.runs_scored,
        runs_conceded: stats.runs_conceded,
        overs_faced: Math.round(stats.overs_faced * 100) / 100,
        overs_bowled: Math.round(stats.overs_bowled * 100) / 100,
        net_run_rate: Math.round(nrr * 1000) / 1000,
      };
    });

    setEditableStandings(updated);
    toast({ title: "Standings recalculated", description: `Processed ${groupMatches.length} group stage matches. Click 'Save All' to persist.` });
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
          <Button variant="secondary" onClick={recalculateFromResults}>
            <Calculator className="w-4 h-4 mr-2" />
            Recalculate from Results
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
                      {standing.team?.logo_url ? (
                        <img 
                          src={standing.team.logo_url} 
                          alt={standing.team.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: standing.team?.primary_color }}
                        />
                      )}
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
