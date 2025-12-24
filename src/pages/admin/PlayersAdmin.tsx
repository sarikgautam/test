import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trash2, Users } from "lucide-react";
import { useSeason } from "@/hooks/useSeason";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface PlayerWithRegistration extends Player {
  registration?: {
    id: string;
    auction_status: string;
    sold_price: number | null;
    team_id: string | null;
    base_price: number;
  } | null;
}

export default function PlayersAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { selectedSeasonId } = useSeason();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: ["admin-players", selectedSeasonId],
    queryFn: async () => {
      // Get all players that have registrations for this season
      const { data: registrations, error: regError } = await supabase
        .from("player_season_registrations")
        .select(`
          id,
          auction_status,
          sold_price,
          team_id,
          base_price,
          player_id,
          players:player_id(*)
        `)
        .eq("season_id", selectedSeasonId!)
        .order("created_at", { ascending: false });
      
      if (regError) throw regError;
      
      // Transform the data
      return registrations?.map((reg) => ({
        ...(reg.players as any),
        registration: {
          id: reg.id,
          auction_status: reg.auction_status,
          sold_price: reg.sold_price,
          team_id: reg.team_id,
          base_price: reg.base_price,
        },
      })) as PlayerWithRegistration[];
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

  const deleteMutation = useMutation({
    mutationFn: async (playerId: string) => {
      // Delete the registration for this season
      const { error } = await supabase
        .from("player_season_registrations")
        .delete()
        .eq("player_id", playerId)
        .eq("season_id", selectedSeasonId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-players", selectedSeasonId] });
      toast({ title: "Player registration deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting player", description: error.message, variant: "destructive" });
    },
  });

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch =
      player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || player.registration?.auction_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTeamName = (teamId: string | null | undefined) => {
    if (!teamId) return "-";
    return teams?.find((t) => t.id === teamId)?.name || "-";
  };

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
    registered: "secondary",
    sold: "default",
    unsold: "destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Players Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage registered players for the auction
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Players</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="unsold">Unsold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Sold Price</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers?.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{player.email}</TableCell>
                  <TableCell>{roleLabels[player.role]}</TableCell>
                  <TableCell>${player.registration?.base_price?.toLocaleString() || player.base_price?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[player.registration?.auction_status || "registered"]}>
                      {player.registration?.auction_status || "registered"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getTeamName(player.registration?.team_id)}</TableCell>
                  <TableCell>
                    {player.registration?.sold_price ? `$${player.registration.sold_price.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(player.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlayers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No players found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {filteredPlayers?.length || 0} of {players?.length || 0} players
      </div>
    </div>
  );
}
