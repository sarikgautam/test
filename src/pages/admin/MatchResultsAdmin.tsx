import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, ClipboardList, Users } from "lucide-react";
import { formatAEST } from "@/lib/utils";
import { useSeason } from "@/hooks/useSeason";
import type { Database } from "@/integrations/supabase/types";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type PlayerStat = Database["public"]["Tables"]["player_stats"]["Row"];

interface PlayerStatForm {
  player_id: string;
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

const defaultStatForm: PlayerStatForm = {
  player_id: "",
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

export default function MatchResultsAdmin() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<PlayerStat | null>(null);
  const [statForm, setStatForm] = useState<PlayerStatForm>(defaultStatForm);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();

  // Fetch completed matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["completed-matches", selectedSeasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("season_id", selectedSeasonId!)
        .eq("status", "completed")
        .order("match_number");
      if (error) throw error;
      return data as Match[];
    },
    enabled: !!selectedSeasonId,
  });

  // Fetch all teams
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data as Team[];
    },
  });

  // Fetch players for selected match's teams
  const selectedMatch = matches?.find((m) => m.id === selectedMatchId);
  const { data: matchPlayers } = useQuery({
    queryKey: ["match-players", selectedMatch?.home_team_id, selectedMatch?.away_team_id],
    queryFn: async () => {
      if (!selectedMatch) return [];
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .in("team_id", [selectedMatch.home_team_id, selectedMatch.away_team_id])
        .eq("auction_status", "sold");
      if (error) throw error;
      return data as Player[];
    },
    enabled: !!selectedMatch,
  });

  // Fetch player stats for selected match
  const { data: matchStats, isLoading: statsLoading } = useQuery({
    queryKey: ["match-stats", selectedMatchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("match_id", selectedMatchId!);
      if (error) throw error;
      return data as PlayerStat[];
    },
    enabled: !!selectedMatchId,
  });

  const createStatMutation = useMutation({
    mutationFn: async (data: PlayerStatForm) => {
      const { error } = await supabase.from("player_stats").insert({
        player_id: data.player_id,
        match_id: selectedMatchId!,
        season_id: selectedSeasonId!,
        runs_scored: data.runs_scored,
        balls_faced: data.balls_faced,
        fours: data.fours,
        sixes: data.sixes,
        overs_bowled: data.overs_bowled,
        runs_conceded: data.runs_conceded,
        wickets: data.wickets,
        maidens: data.maidens,
        catches: data.catches,
        stumpings: data.stumpings,
        run_outs: data.run_outs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      toast({ title: "Player stats added successfully" });
      resetStatForm();
    },
    onError: (error) => {
      toast({ title: "Error adding player stats", description: error.message, variant: "destructive" });
    },
  });

  const updateStatMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlayerStatForm }) => {
      const { error } = await supabase
        .from("player_stats")
        .update({
          runs_scored: data.runs_scored,
          balls_faced: data.balls_faced,
          fours: data.fours,
          sixes: data.sixes,
          overs_bowled: data.overs_bowled,
          runs_conceded: data.runs_conceded,
          wickets: data.wickets,
          maidens: data.maidens,
          catches: data.catches,
          stumpings: data.stumpings,
          run_outs: data.run_outs,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      toast({ title: "Player stats updated successfully" });
      resetStatForm();
    },
    onError: (error) => {
      toast({ title: "Error updating player stats", description: error.message, variant: "destructive" });
    },
  });

  const deleteStatMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("player_stats").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      toast({ title: "Player stats deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting player stats", description: error.message, variant: "destructive" });
    },
  });

  const resetStatForm = () => {
    setStatForm(defaultStatForm);
    setEditingStat(null);
    setIsStatDialogOpen(false);
  };

  const handleEditStat = (stat: PlayerStat) => {
    setEditingStat(stat);
    setStatForm({
      player_id: stat.player_id,
      runs_scored: stat.runs_scored,
      balls_faced: stat.balls_faced,
      fours: stat.fours,
      sixes: stat.sixes,
      overs_bowled: Number(stat.overs_bowled),
      runs_conceded: stat.runs_conceded,
      wickets: stat.wickets,
      maidens: stat.maidens,
      catches: stat.catches,
      stumpings: stat.stumpings,
      run_outs: stat.run_outs,
    });
    setIsStatDialogOpen(true);
  };

  const handleStatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStat) {
      updateStatMutation.mutate({ id: editingStat.id, data: statForm });
    } else {
      createStatMutation.mutate(statForm);
    }
  };

  const getTeamName = (teamId: string) => {
    return teams?.find((t) => t.id === teamId)?.short_name || "TBD";
  };

  const getPlayerName = (playerId: string) => {
    return matchPlayers?.find((p) => p.id === playerId)?.full_name || "Unknown";
  };

  const getPlayerTeam = (playerId: string) => {
    const player = matchPlayers?.find((p) => p.id === playerId);
    return player?.team_id ? getTeamName(player.team_id) : "";
  };

  // Filter players who don't have stats for this match yet
  const playersWithoutStats = matchPlayers?.filter(
    (player) => !matchStats?.some((stat) => stat.player_id === player.id)
  );

  // Group stats by team
  const homeTeamStats = matchStats?.filter((stat) => {
    const player = matchPlayers?.find((p) => p.id === stat.player_id);
    return player?.team_id === selectedMatch?.home_team_id;
  });

  const awayTeamStats = matchStats?.filter((stat) => {
    const player = matchPlayers?.find((p) => p.id === stat.player_id);
    return player?.team_id === selectedMatch?.away_team_id;
  });

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "-";
    return ((runs / balls) * 100).toFixed(1);
  };

  const calculateEconomy = (runs: number, overs: number) => {
    if (overs === 0) return "-";
    return (runs / overs).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Match Results & Scorecards</h1>
        <p className="text-muted-foreground mt-1">Enter player statistics for completed matches</p>
      </div>

      {/* Match Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Select Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : matches?.length === 0 ? (
            <p className="text-muted-foreground">No completed matches found. Complete a match first to add scorecards.</p>
          ) : (
            <Select value={selectedMatchId || ""} onValueChange={setSelectedMatchId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a completed match" />
              </SelectTrigger>
              <SelectContent>
                {matches?.map((match) => (
                  <SelectItem key={match.id} value={match.id}>
                    Match #{match.match_number}: {getTeamName(match.home_team_id)} vs {getTeamName(match.away_team_id)} - {formatAEST(match.match_date, "MMM d")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Match Stats */}
      {selectedMatch && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Scorecard: {getTeamName(selectedMatch.home_team_id)} vs {getTeamName(selectedMatch.away_team_id)}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {selectedMatch.home_team_score} - {selectedMatch.away_team_score} | {selectedMatch.match_summary}
              </p>
            </div>
            <Button onClick={() => setIsStatDialogOpen(true)} disabled={!playersWithoutStats?.length}>
              <Plus className="w-4 h-4 mr-2" />
              Add Player Stats
            </Button>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="home" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="home">{getTeamName(selectedMatch.home_team_id)}</TabsTrigger>
                  <TabsTrigger value="away">{getTeamName(selectedMatch.away_team_id)}</TabsTrigger>
                </TabsList>

                <TabsContent value="home">
                  <StatsTable 
                    stats={homeTeamStats || []} 
                    getPlayerName={getPlayerName}
                    calculateStrikeRate={calculateStrikeRate}
                    calculateEconomy={calculateEconomy}
                    onEdit={handleEditStat}
                    onDelete={(id) => deleteStatMutation.mutate(id)}
                  />
                </TabsContent>

                <TabsContent value="away">
                  <StatsTable 
                    stats={awayTeamStats || []} 
                    getPlayerName={getPlayerName}
                    calculateStrikeRate={calculateStrikeRate}
                    calculateEconomy={calculateEconomy}
                    onEdit={handleEditStat}
                    onDelete={(id) => deleteStatMutation.mutate(id)}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Stat Dialog */}
      <Dialog open={isStatDialogOpen} onOpenChange={setIsStatDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStat ? "Edit Player Stats" : "Add Player Stats"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStatSubmit} className="space-y-6">
            {/* Player Selection */}
            {!editingStat && (
              <div className="space-y-2">
                <Label>Player</Label>
                <Select
                  value={statForm.player_id}
                  onValueChange={(value) => setStatForm({ ...statForm, player_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {playersWithoutStats?.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.full_name} ({getTeamName(player.team_id!)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingStat && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{getPlayerName(editingStat.player_id)}</p>
                <p className="text-sm text-muted-foreground">{getPlayerTeam(editingStat.player_id)}</p>
              </div>
            )}

            {/* Batting Stats */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Batting</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Runs</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.runs_scored}
                    onChange={(e) => setStatForm({ ...statForm, runs_scored: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balls Faced</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.balls_faced}
                    onChange={(e) => setStatForm({ ...statForm, balls_faced: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>4s</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.fours}
                    onChange={(e) => setStatForm({ ...statForm, fours: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>6s</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.sixes}
                    onChange={(e) => setStatForm({ ...statForm, sixes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Bowling Stats */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bowling</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Overs Bowled</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={statForm.overs_bowled}
                    onChange={(e) => setStatForm({ ...statForm, overs_bowled: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Runs Conceded</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.runs_conceded}
                    onChange={(e) => setStatForm({ ...statForm, runs_conceded: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wickets</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.wickets}
                    onChange={(e) => setStatForm({ ...statForm, wickets: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maidens</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.maidens}
                    onChange={(e) => setStatForm({ ...statForm, maidens: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Fielding Stats */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Fielding</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Catches</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.catches}
                    onChange={(e) => setStatForm({ ...statForm, catches: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stumpings</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.stumpings}
                    onChange={(e) => setStatForm({ ...statForm, stumpings: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Run Outs</Label>
                  <Input
                    type="number"
                    min="0"
                    value={statForm.run_outs}
                    onChange={(e) => setStatForm({ ...statForm, run_outs: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetStatForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={!editingStat && !statForm.player_id}>
                {editingStat ? "Update Stats" : "Add Stats"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stats Table Component
function StatsTable({
  stats,
  getPlayerName,
  calculateStrikeRate,
  calculateEconomy,
  onEdit,
  onDelete,
}: {
  stats: PlayerStat[];
  getPlayerName: (id: string) => string;
  calculateStrikeRate: (runs: number, balls: number) => string;
  calculateEconomy: (runs: number, overs: number) => string;
  onEdit: (stat: PlayerStat) => void;
  onDelete: (id: string) => void;
}) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No player stats recorded for this team yet.
      </div>
    );
  }

  return (
    <div className="border rounded-lg border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="text-center">R</TableHead>
            <TableHead className="text-center">B</TableHead>
            <TableHead className="text-center">4s</TableHead>
            <TableHead className="text-center">6s</TableHead>
            <TableHead className="text-center">SR</TableHead>
            <TableHead className="text-center">O</TableHead>
            <TableHead className="text-center">RC</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">Eco</TableHead>
            <TableHead className="text-center">Ct</TableHead>
            <TableHead className="text-center">St</TableHead>
            <TableHead className="text-center">RO</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((stat) => (
            <TableRow key={stat.id}>
              <TableCell className="font-medium">{getPlayerName(stat.player_id)}</TableCell>
              <TableCell className="text-center">{stat.runs_scored}</TableCell>
              <TableCell className="text-center">{stat.balls_faced}</TableCell>
              <TableCell className="text-center">{stat.fours}</TableCell>
              <TableCell className="text-center">{stat.sixes}</TableCell>
              <TableCell className="text-center">{calculateStrikeRate(stat.runs_scored, stat.balls_faced)}</TableCell>
              <TableCell className="text-center">{stat.overs_bowled}</TableCell>
              <TableCell className="text-center">{stat.runs_conceded}</TableCell>
              <TableCell className="text-center">{stat.wickets}</TableCell>
              <TableCell className="text-center">{calculateEconomy(stat.runs_conceded, Number(stat.overs_bowled))}</TableCell>
              <TableCell className="text-center">{stat.catches}</TableCell>
              <TableCell className="text-center">{stat.stumpings}</TableCell>
              <TableCell className="text-center">{stat.run_outs}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(stat)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(stat.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
