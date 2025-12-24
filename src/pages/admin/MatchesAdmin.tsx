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
import { format } from "date-fns";
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
    home_team_score: "",
    away_team_score: "",
    home_team_overs: "",
    away_team_overs: "",
    winner_team_id: "",
    match_summary: "",
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("matches").insert({
        match_number: data.match_number,
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        match_date: data.match_date,
        venue: data.venue,
        status: data.status,
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
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("matches")
        .update({
          match_number: data.match_number,
          home_team_id: data.home_team_id,
          away_team_id: data.away_team_id,
          match_date: data.match_date,
          venue: data.venue,
          status: data.status,
          home_team_score: data.home_team_score || null,
          away_team_score: data.away_team_score || null,
          home_team_overs: data.home_team_overs || null,
          away_team_overs: data.away_team_overs || null,
          winner_team_id: data.winner_team_id || null,
          match_summary: data.match_summary || null,
        })
        .eq("id", id);
      if (error) throw error;
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
      home_team_score: "",
      away_team_score: "",
      home_team_overs: "",
      away_team_overs: "",
      winner_team_id: "",
      match_summary: "",
    });
    setEditingMatch(null);
    setIsOpen(false);
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      match_number: match.match_number,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: match.match_date.slice(0, 16),
      venue: match.venue,
      status: match.status,
      home_team_score: match.home_team_score || "",
      away_team_score: match.away_team_score || "",
      home_team_overs: match.home_team_overs || "",
      away_team_overs: match.away_team_overs || "",
      winner_team_id: match.winner_team_id || "",
      match_summary: match.match_summary || "",
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMatch) {
      updateMutation.mutate({ id: editingMatch.id, data: formData });
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match_date">Match Date & Time</Label>
                  <Input
                    id="match_date"
                    type="datetime-local"
                    value={formData.match_date}
                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                    required
                  />
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
              </div>

              {editingMatch && formData.status === "completed" && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-4">Match Results</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Home Score (e.g., 156/8)</Label>
                        <Input
                          value={formData.home_team_score}
                          onChange={(e) =>
                            setFormData({ ...formData, home_team_score: e.target.value })
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
                        <Label>Away Score (e.g., 152/10)</Label>
                        <Input
                          value={formData.away_team_score}
                          onChange={(e) =>
                            setFormData({ ...formData, away_team_score: e.target.value })
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
                          <SelectItem value={formData.home_team_id}>
                            {getTeamName(formData.home_team_id)}
                          </SelectItem>
                          <SelectItem value={formData.away_team_id}>
                            {getTeamName(formData.away_team_id)}
                          </SelectItem>
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
                    {format(new Date(match.match_date), "MMM d, yyyy h:mm a")}
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
