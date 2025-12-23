import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, User, DollarSign, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

export default function AuctionAdmin() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [soldTeamId, setSoldTeamId] = useState("");
  const [soldPrice, setSoldPrice] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["auction-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("auction_status", "registered")
        .order("base_price", { ascending: false });
      if (error) throw error;
      return data as Player[];
    },
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["auction-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  const sellPlayerMutation = useMutation({
    mutationFn: async ({
      playerId,
      teamId,
      price,
    }: {
      playerId: string;
      teamId: string;
      price: number;
    }) => {
      // Update player
      const { error: playerError } = await supabase
        .from("players")
        .update({
          auction_status: "sold",
          team_id: teamId,
          sold_price: price,
        })
        .eq("id", playerId);
      if (playerError) throw playerError;

      // Update team budget
      const team = teams?.find((t) => t.id === teamId);
      if (team) {
        const { error: teamError } = await supabase
          .from("teams")
          .update({ remaining_budget: team.remaining_budget - price })
          .eq("id", teamId);
        if (teamError) throw teamError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-players"] });
      queryClient.invalidateQueries({ queryKey: ["auction-teams"] });
      toast({ title: "Player sold successfully!" });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: "Error selling player", description: error.message, variant: "destructive" });
    },
  });

  const markUnsoldMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from("players")
        .update({ auction_status: "unsold" })
        .eq("id", playerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-players"] });
      toast({ title: "Player marked as unsold" });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openDialog = (player: Player) => {
    setSelectedPlayer(player);
    setSoldTeamId("");
    setSoldPrice(player.base_price.toString());
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedPlayer(null);
    setSoldTeamId("");
    setSoldPrice("");
    setIsDialogOpen(false);
  };

  const handleSell = () => {
    if (!selectedPlayer || !soldTeamId || !soldPrice) return;
    sellPlayerMutation.mutate({
      playerId: selectedPlayer.id,
      teamId: soldTeamId,
      price: parseInt(soldPrice),
    });
  };

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const isLoading = playersLoading || teamsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Live Auction</h1>
        <p className="text-muted-foreground mt-1">
          Sell registered players to teams
        </p>
      </div>

      {/* Team Budgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {teamsLoading
          ? Array(6)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
          : teams?.map((team) => (
              <Card key={team.id} className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div
                    className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-2"
                    style={{ backgroundColor: team.primary_color, color: team.secondary_color }}
                  >
                    {team.short_name}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className="font-bold text-sm">
                    ₹{(team.remaining_budget / 100000).toFixed(1)}L
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Players Pool */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" />
            Players Awaiting Auction ({players?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : players && players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer"
                  onClick={() => openDialog(player)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{player.full_name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {roleLabels[player.role]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Base Price</span>
                    <span className="font-bold text-primary">
                      ₹{player.base_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No players available for auction</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Player</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedPlayer.full_name}</h3>
                  <Badge variant="secondary">{roleLabels[selectedPlayer.role]}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Base Price: ₹{selectedPlayer.base_price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sold To</Label>
                  <Select value={soldTeamId} onValueChange={setSoldTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          disabled={team.remaining_budget < parseInt(soldPrice || "0")}
                        >
                          {team.name} (₹{(team.remaining_budget / 100000).toFixed(1)}L left)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sold Price (₹)</Label>
                  <Input
                    type="number"
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(e.target.value)}
                    min={selectedPlayer.base_price}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => markUnsoldMutation.mutate(selectedPlayer.id)}
                >
                  Mark Unsold
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSell}
                  disabled={!soldTeamId || !soldPrice}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Sell Player
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
