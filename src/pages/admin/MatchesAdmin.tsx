import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { formatAEST, aestToUTC, utcToAESTInput } from "@/lib/utils";
import { useSeason } from "@/hooks/useSeason";
import type { Database } from "@/integrations/supabase/types";

type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

export default function MatchesAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState({
    match_number: 1,
    home_team_id: "",
    away_team_id: "",
    match_date: "",
    venue: "Gold Coast Cricket Ground",
    status: "upcoming" as "upcoming" | "live" | "completed" | "cancelled",
    overs_per_side: 20,
    match_stage: "group" as "group" | "eliminator" | "qualifier" | "final",
    home_team_runs: 0,
    home_team_wickets: 0,
    home_team_overs: "",
    away_team_runs: 0,
    away_team_wickets: 0,
    away_team_overs: "",
    winner_team_id: "",
    man_of_match_id: "",
    match_summary: "",
  });
  const [matchAwards, setMatchAwards] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedSeasonId } = useSeason();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["admin-matches", selectedSeasonId],
    queryFn: async () => {
      let query = supabase
        .from("matches")
        .select("*")
        .order("match_number");
      
      if (selectedSeasonId) {
        query = query.eq("season_id", selectedSeasonId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Match[];
    },
    enabled: !!selectedSeasonId,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data as Team[];
    },
  });

  // Fetch players for man of match selection
  const { data: players } = useQuery({
    queryKey: ["players-for-match", formData.home_team_id, formData.away_team_id, selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return [];
      
      // Get players from player_season_registrations for the current season
      const { data: registrations, error } = await supabase
        .from("player_season_registrations")
        .select("player:players(id, full_name), team_id")
        .eq("season_id", selectedSeasonId)
        .eq("auction_status", "sold")
        .in("team_id", [formData.home_team_id, formData.away_team_id].filter(Boolean));
      
      if (error) throw error;
      
      // Extract player data from registrations
      return registrations?.map(reg => ({
        id: (reg.player as any).id,
        full_name: (reg.player as any).full_name,
        team_id: reg.team_id
      })) || [];
    },
    enabled: !!(formData.home_team_id || formData.away_team_id) && !!selectedSeasonId,
  });

  // Fetch award types
  const { data: awardTypes } = useQuery({
    queryKey: ["award-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award_types")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("matches").insert({
        match_number: data.match_number,
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        match_date: aestToUTC(data.match_date),
        venue: data.venue,
        status: data.status,
        overs_per_side: data.overs_per_side,
        match_stage: data.match_stage,
        season_id: selectedSeasonId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches", selectedSeasonId] });
      toast({ title: "Match created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating match", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, awards }: { id: string; data: typeof formData; awards: Record<string, string> }) => {
      // Update match
      // Generate display scores from runs/wickets
      const homeScore = data.status === "completed" ? `${data.home_team_runs}/${data.home_team_wickets}` : null;
      const awayScore = data.status === "completed" ? `${data.away_team_runs}/${data.away_team_wickets}` : null;
      
      const { error } = await supabase
        .from("matches")
        .update({
          match_number: data.match_number,
          home_team_id: data.home_team_id,
          away_team_id: data.away_team_id,
          match_date: aestToUTC(data.match_date),
          venue: data.venue,
          status: data.status,
          overs_per_side: data.overs_per_side,
          match_stage: data.match_stage,
          home_team_runs: data.home_team_runs,
          home_team_wickets: data.home_team_wickets,
          home_team_score: homeScore,
          home_team_overs: data.home_team_overs || null,
          away_team_runs: data.away_team_runs,
          away_team_wickets: data.away_team_wickets,
          away_team_score: awayScore,
          away_team_overs: data.away_team_overs || null,
          winner_team_id: data.winner_team_id || null,
          man_of_match_id: data.man_of_match_id || null,
          match_summary: data.match_summary || null,
        })
        .eq("id", id);
      if (error) throw error;
      
      // Handle awards - delete existing and insert new
      if (data.status === "completed" && Object.keys(awards).length > 0) {
        await supabase.from("match_awards").delete().eq("match_id", id);
        
        const awardInserts = Object.entries(awards)
          .filter(([_, playerId]) => playerId)
          .map(([awardTypeId, playerId]) => ({
            match_id: id,
            award_type_id: awardTypeId,
            player_id: playerId,
          }));
        
        if (awardInserts.length > 0) {
          const { error: awardError } = await supabase.from("match_awards").insert(awardInserts);
          if (awardError) throw awardError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches", selectedSeasonId] });
      toast({ title: "Match updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating match", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches", selectedSeasonId] });
      toast({ title: "Match deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting match", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      match_number: (matches?.length || 0) + 1,
      home_team_id: "",
      away_team_id: "",
      match_date: "",
      venue: "Gold Coast Cricket Ground",
      status: "upcoming",
      overs_per_side: 20,
      match_stage: "group",
      home_team_runs: 0,
      home_team_wickets: 0,
      home_team_overs: "",
      away_team_runs: 0,
      away_team_wickets: 0,
      away_team_overs: "",
      winner_team_id: "",
      man_of_match_id: "",
      match_summary: "",
    });
    setMatchAwards({});
    setEditingMatch(null);
    setIsOpen(false);
  };

  const handleEdit = async (match: Match) => {
    setEditingMatch(match);
    setFormData({
      match_number: match.match_number,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: utcToAESTInput(match.match_date),
      venue: match.venue,
      status: match.status,
      overs_per_side: (match as any).overs_per_side || 20,
      match_stage: ((match as any).match_stage || "group") as "group" | "eliminator" | "qualifier" | "final",
      home_team_runs: (match as any).home_team_runs || 0,
      home_team_wickets: (match as any).home_team_wickets || 0,
      home_team_overs: match.home_team_overs || "",
      away_team_runs: (match as any).away_team_runs || 0,
      away_team_wickets: (match as any).away_team_wickets || 0,
      away_team_overs: match.away_team_overs || "",
      winner_team_id: match.winner_team_id || "",
      man_of_match_id: match.man_of_match_id || "",
      match_summary: match.match_summary || "",
    });
    
    // Fetch existing awards for this match
    const { data: existingAwards } = await supabase
      .from("match_awards")
      .select("award_type_id, player_id")
      .eq("match_id", match.id);
    
    if (existingAwards) {
      const awardsMap: Record<string, string> = {};
      existingAwards.forEach((a) => {
        awardsMap[a.award_type_id] = a.player_id;
      });
      setMatchAwards(awardsMap);
    }
    
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMatch) {
      updateMutation.mutate({ id: editingMatch.id, data: formData, awards: matchAwards });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTeamName = (teamId: string) => {
    return teams?.find((t) => t.id === teamId)?.short_name || "TBD";
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    upcoming: "secondary",
    live: "default",
    completed: "outline",
    cancelled: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gradient-gold">Matches Management</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage tournament matches</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Match
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMatch ? "Edit Match" : "Schedule New Match"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match_number">Match Number</Label>
                  <Input
                    id="match_number"
                    type="number"
                    value={formData.match_number}
                    onChange={(e) =>
                      setFormData({ ...formData, match_number: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as typeof formData.status })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="match_stage">Match Stage</Label>
                  <Select
                    value={formData.match_stage}
                    onValueChange={(value) =>
                      setFormData({ ...formData, match_stage: value as typeof formData.match_stage })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group Stage</SelectItem>
                      <SelectItem value="eliminator">Eliminator</SelectItem>
                      <SelectItem value="qualifier">Qualifier</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="home_team_id">Home Team</Label>
                  <Select
                    value={formData.home_team_id}
                    onValueChange={(value) => setFormData({ ...formData, home_team_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="away_team_id">Away Team</Label>
                  <Select
                    value={formData.away_team_id}
                    onValueChange={(value) => setFormData({ ...formData, away_team_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match_date">Match Date & Time (AEST)</Label>
                  <Input
                    id="match_date"
                    type="datetime-local"
                    value={formData.match_date}
                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">AEST timezone</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overs_per_side">Overs Per Side</Label>
                  <Input
                    id="overs_per_side"
                    type="number"
                    value={formData.overs_per_side}
                    onChange={(e) => setFormData({ ...formData, overs_per_side: parseInt(e.target.value) || 20 })}
                    min={1}
                    max={50}
                  />
                </div>
              </div>

              {editingMatch && formData.status === "completed" && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-4">Match Results</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Home Runs</Label>
                        <Input
                          type="number"
                          value={formData.home_team_runs}
                          onChange={(e) =>
                            setFormData({ ...formData, home_team_runs: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Home Wickets</Label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={formData.home_team_wickets}
                          onChange={(e) =>
                            setFormData({ ...formData, home_team_wickets: Math.min(10, parseInt(e.target.value) || 0) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Home Overs (e.g., 20.0)</Label>
                        <Input
                          value={formData.home_team_overs}
                          onChange={(e) =>
                            setFormData({ ...formData, home_team_overs: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Away Runs</Label>
                        <Input
                          type="number"
                          value={formData.away_team_runs}
                          onChange={(e) =>
                            setFormData({ ...formData, away_team_runs: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Away Wickets</Label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={formData.away_team_wickets}
                          onChange={(e) =>
                            setFormData({ ...formData, away_team_wickets: Math.min(10, parseInt(e.target.value) || 0) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Away Overs (e.g., 19.4)</Label>
                        <Input
                          value={formData.away_team_overs}
                          onChange={(e) =>
                            setFormData({ ...formData, away_team_overs: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Score display: {formData.home_team_runs}/{formData.home_team_wickets} vs {formData.away_team_runs}/{formData.away_team_wickets}
                    </p>
                    <div className="space-y-2 mt-4">
                      <Label>Winner</Label>
                      <Select
                        value={formData.winner_team_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, winner_team_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select winner" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.home_team_id && (
                            <SelectItem value={formData.home_team_id}>
                              {getTeamName(formData.home_team_id)}
                            </SelectItem>
                          )}
                          {formData.away_team_id && (
                            <SelectItem value={formData.away_team_id}>
                              {getTeamName(formData.away_team_id)}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Match Summary</Label>
                      <Input
                        value={formData.match_summary}
                        onChange={(e) =>
                          setFormData({ ...formData, match_summary: e.target.value })
                        }
                        placeholder="e.g., KTM won by 4 runs"
                      />
                    </div>

                    {/* Man of the Match */}
                    <div className="space-y-2 mt-4">
                      <Label>Man of the Match</Label>
                      <Select
                        value={formData.man_of_match_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, man_of_match_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {players?.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.full_name} ({getTeamName(player.team_id || "")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Match Awards */}
                    {awardTypes && awardTypes.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <h4 className="font-medium mb-4">Match Awards</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {awardTypes.map((award) => (
                            <div key={award.id} className="space-y-2">
                              <Label>{award.name}</Label>
                              <Select
                                value={matchAwards[award.id] || "none"}
                                onValueChange={(value) =>
                                  setMatchAwards({ ...matchAwards, [award.id]: value === "none" ? "" : value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select player (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {players?.map((player) => (
                                    <SelectItem key={player.id} value={player.id}>
                                      {player.full_name} ({getTeamName(player.team_id || "")})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingMatch ? "Update Match" : "Create Match"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches?.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">{match.match_number}</TableCell>
                  <TableCell>
                    {getTeamName(match.home_team_id)} vs {getTeamName(match.away_team_id)}
                  </TableCell>
                  <TableCell>
                    {formatAEST(match.match_date, "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{match.venue}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[match.status]}>{match.status}</Badge>
                  </TableCell>
                  <TableCell>{match.match_summary || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(match)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(match.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {matches?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No matches scheduled yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
