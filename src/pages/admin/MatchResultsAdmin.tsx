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
import { Plus, Pencil, Trash2, ClipboardList, Users, Upload, Save, ArrowUp, ArrowDown, ChevronsUp, GripVertical, FileUp } from "lucide-react";
import { formatAEST } from "@/lib/utils";
import { useSeason } from "@/hooks/useSeason";
import { PDFImportDialog } from "@/components/admin/PDFImportDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  dismissal_type?: string;
  bowler_id?: string;
  fielder_id?: string;
  runout_by_id?: string;
  dismissal_other_text?: string;
}

interface BulkStatEntry extends PlayerStatForm {
  player_name?: string;
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
  dismissal_type: undefined,
  bowler_id: undefined,
  fielder_id: undefined,
  runout_by_id: undefined,
  dismissal_other_text: undefined,
};

export default function MatchResultsAdmin() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isPDFDialogOpen, setIsPDFDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<PlayerStat | null>(null);
  const [statForm, setStatForm] = useState<PlayerStatForm>(defaultStatForm);
  const [homeTeamBulkStats, setHomeTeamBulkStats] = useState<BulkStatEntry[]>([]);
  const [awayTeamBulkStats, setAwayTeamBulkStats] = useState<BulkStatEntry[]>([]);

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
    queryKey: ["match-players", selectedMatch?.home_team_id, selectedMatch?.away_team_id, selectedSeasonId],
    queryFn: async () => {
      if (!selectedMatch || !selectedSeasonId) return [];
      
      // Get players from player_season_registrations for the current season
      const { data: registrations, error } = await supabase
        .from("player_season_registrations")
        .select("player:players(*), team_id")
        .eq("season_id", selectedSeasonId)
        .eq("auction_status", "sold")
        .in("team_id", [selectedMatch.home_team_id, selectedMatch.away_team_id]);
      
      if (error) throw error;
      
      // Extract player data from registrations
      return registrations?.map(reg => ({
        ...(reg.player as Player),
        team_id: reg.team_id
      })) as Player[];
    },
    enabled: !!selectedMatch && !!selectedSeasonId,
  });

  // Fetch player stats for selected match
  const { data: matchStats, isLoading: statsLoading } = useQuery({
    queryKey: ["match-stats", selectedMatchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("match_id", selectedMatchId!)
        .order("created_at", { ascending: true });
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
        dismissal_type: data.dismissal_type || null,
        bowler_id: data.bowler_id || null,
        fielder_id: data.fielder_id || null,
        runout_by_id: data.runout_by_id || null,
        dismissal_other_text: data.dismissal_other_text || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      queryClient.invalidateQueries({ queryKey: ["match-player-stats", selectedMatchId] });
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
          dismissal_type: data.dismissal_type || null,
          bowler_id: data.bowler_id || null,
          fielder_id: data.fielder_id || null,
          runout_by_id: data.runout_by_id || null,
          dismissal_other_text: data.dismissal_other_text || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      queryClient.invalidateQueries({ queryKey: ["match-player-stats", selectedMatchId] });
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
      queryClient.invalidateQueries({ queryKey: ["match-player-stats", selectedMatchId] });
      toast({ title: "Player stats deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting player stats", description: error.message, variant: "destructive" });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (entries: BulkStatEntry[]) => {
      const statsToInsert = entries.map((entry, index) => ({
        player_id: entry.player_id,
        match_id: entry.match_id || selectedMatchId!,
        season_id: entry.season_id || selectedSeasonId!,
        runs_scored: entry.runs_scored,
        balls_faced: entry.balls_faced,
        fours: entry.fours,
        sixes: entry.sixes,
        overs_bowled: entry.overs_bowled,
        runs_conceded: entry.runs_conceded,
        wickets: entry.wickets,
        maidens: entry.maidens,
        catches: entry.catches,
        stumpings: entry.stumpings,
        run_outs: entry.run_outs,
        dismissal_type: entry.dismissal_type || null,
        bowler_id: entry.bowler_id || null,
        fielder_id: entry.fielder_id || null,
        runout_by_id: entry.runout_by_id || null,
        dismissal_other_text: entry.dismissal_other_text || null,
      }));
      console.log(`[bulkCreateMutation] Upserting ${statsToInsert.length} stats. First entry matchId: ${statsToInsert[0]?.match_id}`, statsToInsert.slice(0, 2));
      // Use upsert to update existing stats or insert new ones
      const { error } = await supabase
        .from("player_stats")
        .upsert(statsToInsert, { 
          onConflict: 'player_id,match_id'
        });
      if (error) throw error;
      return statsToInsert;
    },
    onSuccess: (statsInserted) => {
      // Get unique match IDs from the stats that were inserted
      const matchIdsToInvalidate = [...new Set(statsInserted.map(s => s.match_id))];
      console.log(`[MatchResultsAdmin] Invalidating queries for matchIds: ${matchIdsToInvalidate.join(', ')}`);
      
      matchIdsToInvalidate.forEach(matchId => {
        queryClient.invalidateQueries({ queryKey: ["match-stats", matchId] });
        queryClient.invalidateQueries({ queryKey: ["match-player-stats", matchId] });
      });
      
      toast({ title: "Bulk stats added successfully" });
      setHomeTeamBulkStats([]);
      setAwayTeamBulkStats([]);
      setIsBulkDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error adding bulk stats", description: error.message, variant: "destructive" });
    },
  });

  const moveToTopMutation = useMutation({
    mutationFn: async (statId: string) => {
      // Get all stats for this match
      const stats = matchStats || [];
      const targetStat = stats.find(s => s.id === statId);
      if (!targetStat) throw new Error("Stat not found");

      // Find the minimum batting_order or set to 0
      const minOrder = Math.min(...stats.map(s => s.batting_order || 999), 0);
      const newOrder = minOrder - 1;

      // Update the target stat to have the lowest order
      const { error } = await supabase
        .from("player_stats")
        .update({ batting_order: newOrder })
        .eq("id", statId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      queryClient.invalidateQueries({ queryKey: ["match-player-stats", selectedMatchId] });
      toast({ title: "Player moved to top" });
    },
    onError: (error) => {
      toast({ title: "Error moving player", description: error.message, variant: "destructive" });
    },
  });

  const moveUpMutation = useMutation({
    mutationFn: async (statId: string) => {
      const stats = matchStats || [];
      const currentIndex = stats.findIndex(s => s.id === statId);
      
      if (currentIndex <= 0) return; // Already at top
      
      const currentStat = stats[currentIndex];
      const aboveStat = stats[currentIndex - 1];
      
      // Swap batting orders
      const currentOrder = currentStat.batting_order ?? currentIndex;
      const aboveOrder = aboveStat.batting_order ?? currentIndex - 1;
      
      const { error } = await supabase
        .from("player_stats")
        .update({ batting_order: aboveOrder })
        .eq("id", statId);
      
      if (error) throw error;
      
      const { error: error2 } = await supabase
        .from("player_stats")
        .update({ batting_order: currentOrder })
        .eq("id", aboveStat.id);
      
      if (error2) throw error2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      queryClient.invalidateQueries({ queryKey: ["match-player-stats", selectedMatchId] });
    },
    onError: (error) => {
      toast({ title: "Error moving player", description: error.message, variant: "destructive" });
    },
  });

  const moveDownMutation = useMutation({
    mutationFn: async (statId: string) => {
      const stats = matchStats || [];
      const currentIndex = stats.findIndex(s => s.id === statId);
      
      if (currentIndex >= stats.length - 1) return; // Already at bottom
      
      const currentStat = stats[currentIndex];
      const belowStat = stats[currentIndex + 1];
      
      // Swap batting orders
      const currentOrder = currentStat.batting_order ?? currentIndex;
      const belowOrder = belowStat.batting_order ?? currentIndex + 1;
      
      const { error } = await supabase
        .from("player_stats")
        .update({ batting_order: belowOrder })
        .eq("id", statId);
      
      if (error) throw error;
      
      const { error: error2 } = await supabase
        .from("player_stats")
        .update({ batting_order: currentOrder })
        .eq("id", belowStat.id);
      
      if (error2) throw error2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-stats", selectedMatchId] });
      queryClient.invalidateQueries({ queryKey: ["match-player-stats", selectedMatchId] });
    },
    onError: (error) => {
      toast({ title: "Error moving player", description: error.message, variant: "destructive" });
    },
  });

  const resetStatForm = () => {
    setStatForm(defaultStatForm);
    setEditingStat(null);
    setIsStatDialogOpen(false);
  };

  const initBulkStats = () => {
    if (!selectedMatch || !playersWithoutStats) return;
    
    // Separate players by team
    const homeTeamPlayers = playersWithoutStats
      .filter(player => player.team_id === selectedMatch.home_team_id)
      .map((player) => ({
        ...defaultStatForm,
        player_id: player.id,
        player_name: player.full_name,
      }));
    
    const awayTeamPlayers = playersWithoutStats
      .filter(player => player.team_id === selectedMatch.away_team_id)
      .map((player) => ({
        ...defaultStatForm,
        player_id: player.id,
        player_name: player.full_name,
      }));
    
    setHomeTeamBulkStats(homeTeamPlayers);
    setAwayTeamBulkStats(awayTeamPlayers);
    setIsBulkDialogOpen(true);
  };

  const updateBulkStat = (playerId: string, field: keyof PlayerStatForm, value: number, isHomeTeam: boolean) => {
    if (isHomeTeam) {
      setHomeTeamBulkStats((prev) => {
        return prev.map(entry =>
          entry.player_id === playerId ? { ...entry, [field]: value } : entry
        );
      });
    } else {
      setAwayTeamBulkStats((prev) => {
        return prev.map(entry =>
          entry.player_id === playerId ? { ...entry, [field]: value } : entry
        );
      });
    }
  };

  const handleBulkSubmit = () => {
    const allEntries = [...homeTeamBulkStats, ...awayTeamBulkStats];
    const entries = allEntries.filter(
      (entry) =>
        entry.runs_scored > 0 ||
        entry.balls_faced > 0 ||
        Number(entry.overs_bowled) > 0 ||
        entry.wickets > 0 ||
        entry.catches > 0 ||
        entry.stumpings > 0 ||
        entry.run_outs > 0
    );
    if (entries.length === 0) {
      toast({ title: "No stats to save", description: "Enter at least one stat value", variant: "destructive" });
      return;
    }
    bulkCreateMutation.mutate(entries);
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
      dismissal_type: stat.dismissal_type || undefined,
      bowler_id: stat.bowler_id || undefined,
      fielder_id: stat.fielder_id || undefined,
      runout_by_id: stat.runout_by_id || undefined,
      dismissal_other_text: stat.dismissal_other_text || undefined,
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

  const handleHomeTeamDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = homeTeamBulkStats.findIndex(item => item.player_id === active.id);
      const newIndex = homeTeamBulkStats.findIndex(item => item.player_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setHomeTeamBulkStats(arrayMove(homeTeamBulkStats, oldIndex, newIndex));
      }
    }
  };

  const handleAwayTeamDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = awayTeamBulkStats.findIndex(item => item.player_id === active.id);
      const newIndex = awayTeamBulkStats.findIndex(item => item.player_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setAwayTeamBulkStats(arrayMove(awayTeamBulkStats, oldIndex, newIndex));
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      {selectedMatchId && console.log(`[MatchResultsAdmin RENDER] Selected matchId: ${selectedMatchId}, Match Number: ${selectedMatch?.match_number}`)}

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPDFDialogOpen(true)}>
                <FileUp className="w-4 h-4 mr-2" />
                Import PDF
              </Button>
              <Button variant="outline" onClick={initBulkStats} disabled={!playersWithoutStats?.length}>
                <Upload className="w-4 h-4 mr-2" />
                Bulk Entry
              </Button>
              <Button onClick={() => setIsStatDialogOpen(true)} disabled={!playersWithoutStats?.length}>
                <Plus className="w-4 h-4 mr-2" />
                Add Player Stats
              </Button>
            </div>
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

            {/* Dismissal Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Dismissal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>How Out</Label>
                  <Select
                    value={statForm.dismissal_type || ""}
                    onValueChange={(value) => setStatForm({ ...statForm, dismissal_type: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dismissal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_out">Not Out</SelectItem>
                      <SelectItem value="caught">Caught</SelectItem>
                      <SelectItem value="bowled">Bowled</SelectItem>
                      <SelectItem value="lbw">LBW</SelectItem>
                      <SelectItem value="runout">Run Out</SelectItem>
                      <SelectItem value="stumped">Stumped</SelectItem>
                      <SelectItem value="mankad">Mankad</SelectItem>
                      <SelectItem value="retired_hurt">Retired Hurt</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {statForm.dismissal_type && statForm.dismissal_type !== "not_out" && statForm.dismissal_type !== "retired_hurt" && (
                  <div className="space-y-2">
                    <Label>Bowler</Label>
                    <Select
                      value={statForm.bowler_id || ""}
                      onValueChange={(value) => setStatForm({ ...statForm, bowler_id: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bowler" />
                      </SelectTrigger>
                      <SelectContent>
                        {matchPlayers?.filter(p => p.team_id !== matchPlayers.find(mp => mp.id === statForm.player_id)?.team_id).map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {statForm.dismissal_type === "caught" && (
                  <div className="space-y-2">
                    <Label>Caught By (Fielder)</Label>
                    <Select
                      value={statForm.fielder_id || ""}
                      onValueChange={(value) => setStatForm({ ...statForm, fielder_id: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fielder" />
                      </SelectTrigger>
                      <SelectContent>
                        {matchPlayers?.filter(p => p.team_id !== matchPlayers.find(mp => mp.id === statForm.player_id)?.team_id).map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {statForm.dismissal_type === "runout" && (
                  <div className="space-y-2">
                    <Label>Run Out By</Label>
                    <Select
                      value={statForm.runout_by_id || ""}
                      onValueChange={(value) => setStatForm({ ...statForm, runout_by_id: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fielder" />
                      </SelectTrigger>
                      <SelectContent>
                        {matchPlayers?.filter(p => p.team_id !== matchPlayers.find(mp => mp.id === statForm.player_id)?.team_id).map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {statForm.dismissal_type === "other" && (
                  <div className="space-y-2 col-span-2">
                    <Label>Other Dismissal Details</Label>
                    <Input
                      type="text"
                      placeholder="Enter dismissal details"
                      value={statForm.dismissal_other_text || ""}
                      onChange={(e) => setStatForm({ ...statForm, dismissal_other_text: e.target.value })}
                    />
                  </div>
                )}
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

      {/* Bulk Entry Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Bulk Stats Entry
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Enter stats for all players at once. Drag players within each team to reorder by batting order. Only players with at least one non-zero stat will be saved.
            </p>

            {/* Home Team Batting / Away Team Bowling */}
            {homeTeamBulkStats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-primary/10 px-4 py-2 rounded-lg">
                  <h3 className="font-semibold text-lg">
                    {getTeamName(selectedMatch?.home_team_id || "")} Batting / {getTeamName(selectedMatch?.away_team_id || "")} Bowling
                  </h3>
                  <Badge variant="secondary">{homeTeamBulkStats.length} players</Badge>
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleHomeTeamDragEnd}
                >
                  <div className="border rounded-lg border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background z-10 w-8"></TableHead>
                          <TableHead className="sticky left-8 bg-background z-10">Player</TableHead>
                          <TableHead className="text-center w-16">Runs</TableHead>
                          <TableHead className="text-center w-16">Balls</TableHead>
                          <TableHead className="text-center w-16">4s</TableHead>
                          <TableHead className="text-center w-16">6s</TableHead>
                          <TableHead className="text-center w-16">Overs</TableHead>
                          <TableHead className="text-center w-16">RC</TableHead>
                          <TableHead className="text-center w-16">Wkts</TableHead>
                          <TableHead className="text-center w-16">Mdn</TableHead>
                          <TableHead className="text-center w-16">Ct</TableHead>
                          <TableHead className="text-center w-16">St</TableHead>
                          <TableHead className="text-center w-16">RO</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={homeTeamBulkStats.map(entry => entry.player_id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {homeTeamBulkStats.map((entry, index) => (
                            <BulkStatRow
                              key={entry.player_id}
                              entry={entry}
                              index={index}
                              getPlayerTeam={getPlayerTeam}
                              updateBulkStat={updateBulkStat}
                              isHomeTeam={true}
                            />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </div>
                </DndContext>
              </div>
            )}

            {/* Away Team Batting / Home Team Bowling */}
            {awayTeamBulkStats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-primary/10 px-4 py-2 rounded-lg">
                  <h3 className="font-semibold text-lg">
                    {getTeamName(selectedMatch?.away_team_id || "")} Batting / {getTeamName(selectedMatch?.home_team_id || "")} Bowling
                  </h3>
                  <Badge variant="secondary">{awayTeamBulkStats.length} players</Badge>
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleAwayTeamDragEnd}
                >
                  <div className="border rounded-lg border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background z-10 w-8"></TableHead>
                          <TableHead className="sticky left-8 bg-background z-10">Player</TableHead>
                          <TableHead className="text-center w-16">Runs</TableHead>
                          <TableHead className="text-center w-16">Balls</TableHead>
                          <TableHead className="text-center w-16">4s</TableHead>
                          <TableHead className="text-center w-16">6s</TableHead>
                          <TableHead className="text-center w-16">Overs</TableHead>
                          <TableHead className="text-center w-16">RC</TableHead>
                          <TableHead className="text-center w-16">Wkts</TableHead>
                          <TableHead className="text-center w-16">Mdn</TableHead>
                          <TableHead className="text-center w-16">Ct</TableHead>
                          <TableHead className="text-center w-16">St</TableHead>
                          <TableHead className="text-center w-16">RO</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={awayTeamBulkStats.map(entry => entry.player_id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {awayTeamBulkStats.map((entry, index) => (
                            <BulkStatRow
                              key={entry.player_id}
                              entry={entry}
                              index={index}
                              getPlayerTeam={getPlayerTeam}
                              updateBulkStat={updateBulkStat}
                              isHomeTeam={false}
                            />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </div>
                </DndContext>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkSubmit} disabled={bulkCreateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {bulkCreateMutation.isPending ? "Saving..." : "Save All Stats"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Import Dialog */}
      {selectedMatch && (
        <PDFImportDialog
          open={isPDFDialogOpen}
          onOpenChange={setIsPDFDialogOpen}
          matchId={selectedMatch.id}
          seasonId={selectedSeasonId!}
          homeTeamId={selectedMatch.home_team_id}
          awayTeamId={selectedMatch.away_team_id}
          homePlayers={matchPlayers?.filter(p => p.team_id === selectedMatch.home_team_id).map(p => ({ id: p.id, name: p.full_name })) || []}
          awayPlayers={matchPlayers?.filter(p => p.team_id === selectedMatch.away_team_id).map(p => ({ id: p.id, name: p.full_name })) || []}
          onImportComplete={(stats) => {
            bulkCreateMutation.mutate(stats);
          }}
        />
      )}
    </div>
  );
}

// Draggable Bulk Stat Row Component
function BulkStatRow({
  entry,
  index,
  getPlayerTeam,
  updateBulkStat,
  isHomeTeam,
}: {
  entry: BulkStatEntry;
  index: number;
  getPlayerTeam: (id: string) => string;
  updateBulkStat: (playerId: string, field: keyof PlayerStatForm, value: number, isHomeTeam: boolean) => void;
  isHomeTeam: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.player_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-blue-100 dark:bg-blue-900" : ""}>
      <TableCell className="sticky left-0 bg-background z-10 p-1" {...attributes} {...listeners}>
        <div className="flex items-center justify-center cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="sticky left-8 bg-background font-medium">
        <div className="text-sm">
          {entry.player_name}
        </div>
        <span className="text-xs text-muted-foreground">
          ({getPlayerTeam(entry.player_id)})
        </span>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.runs_scored || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "runs_scored", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.balls_faced || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "balls_faced", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.fours || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "fours", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.sixes || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "sixes", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.1"
          className="w-16 h-8 text-center p-1"
          value={entry.overs_bowled || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "overs_bowled", parseFloat(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.runs_conceded || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "runs_conceded", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.wickets || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "wickets", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.maidens || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "maidens", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.catches || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "catches", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.stumpings || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "stumpings", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          className="w-16 h-8 text-center p-1"
          value={entry.run_outs || ""}
          onChange={(e) => updateBulkStat(entry.player_id, "run_outs", parseInt(e.target.value) || 0, isHomeTeam)}
        />
      </TableCell>
    </TableRow>
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
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => moveToTopMutation.mutate(stat.id)}
                    title="Move to top"
                    className="h-8 w-8"
                  >
                    <ChevronsUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => moveUpMutation.mutate(stat.id)}
                    title="Move up"
                    className="h-8 w-8"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => moveDownMutation.mutate(stat.id)}
                    title="Move down"
                    className="h-8 w-8"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onEdit(stat)} className="h-8 w-8">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive h-8 w-8"
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
