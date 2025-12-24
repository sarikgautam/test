import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, User, DollarSign, Users, Play, Pause, Check, X, TrendingUp, Calendar, Save } from "lucide-react";
import { useSeason } from "@/hooks/useSeason";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface BidEntry {
  team_id: string;
  team_name: string;
  team_short_name: string;
  amount: number;
  timestamp: string;
}

export default function AuctionAdmin() {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [incrementAmount, setIncrementAmount] = useState("5000");
  const [basePrice, setBasePrice] = useState("10000");
  const [auctionDate, setAuctionDate] = useState("");
  const [auctionTime, setAuctionTime] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedSeasonId, seasons } = useSeason();
  
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);
  
  // Initialize auction date/time from season
  useEffect(() => {
    if (selectedSeason?.auction_date) {
      const date = new Date(selectedSeason.auction_date);
      setAuctionDate(format(date, "yyyy-MM-dd"));
      setAuctionTime(format(date, "HH:mm"));
    } else {
      setAuctionDate("");
      setAuctionTime("");
    }
  }, [selectedSeason]);

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["auction-players", selectedSeasonId],
    queryFn: async () => {
      let query = supabase
        .from("players")
        .select("*")
        .eq("auction_status", "registered")
        .order("base_price", { ascending: false });

      if (selectedSeasonId) {
        query = query.eq("season_id", selectedSeasonId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Player[];
    },
    enabled: !!selectedSeasonId,
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

  const { data: liveAuction, refetch: refetchAuction } = useQuery({
    queryKey: ["live-auction-admin", selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return null;
      const { data, error } = await supabase
        .from("live_auction")
        .select("*")
        .eq("season_id", selectedSeasonId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSeasonId,
  });

  const { data: currentPlayer } = useQuery({
    queryKey: ["current-auction-player", liveAuction?.current_player_id],
    queryFn: async () => {
      if (!liveAuction?.current_player_id) return null;
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", liveAuction.current_player_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!liveAuction?.current_player_id,
  });

  // Set base price when player is selected
  useEffect(() => {
    if (selectedPlayerId) {
      const player = players?.find((p) => p.id === selectedPlayerId);
      if (player) {
        setBasePrice(player.base_price.toString());
      }
    }
  }, [selectedPlayerId, players]);

  const startAuctionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeasonId || !selectedPlayerId) return;
      
      const player = players?.find((p) => p.id === selectedPlayerId);
      if (!player) return;

      const auctionData = {
        season_id: selectedSeasonId,
        current_player_id: selectedPlayerId,
        current_bid: parseFloat(basePrice),
        current_bidding_team_id: null,
        base_price: parseFloat(basePrice),
        increment_amount: parseFloat(incrementAmount),
        is_live: true,
        bid_history: [],
      };

      if (liveAuction) {
        const { error } = await supabase
          .from("live_auction")
          .update(auctionData)
          .eq("id", liveAuction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("live_auction")
          .insert(auctionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchAuction();
      toast({ title: "Auction started for player!" });
    },
    onError: (error) => {
      toast({ title: "Error starting auction", description: error.message, variant: "destructive" });
    },
  });

  const placeBidMutation = useMutation({
    mutationFn: async (teamId: string) => {
      if (!liveAuction) return;

      const team = teams?.find((t) => t.id === teamId);
      if (!team) return;

      const newBid = liveAuction.current_bid + liveAuction.increment_amount;
      
      if (newBid > team.remaining_budget) {
        throw new Error("Team doesn't have enough budget");
      }

      const bidEntry: BidEntry = {
        team_id: teamId,
        team_name: team.name,
        team_short_name: team.short_name,
        amount: newBid,
        timestamp: new Date().toISOString(),
      };

      const currentHistory = (liveAuction.bid_history as unknown as BidEntry[]) || [];

      const { error } = await supabase
        .from("live_auction")
        .update({
          current_bid: newBid,
          current_bidding_team_id: teamId,
          bid_history: [...currentHistory, bidEntry] as unknown as Database["public"]["Tables"]["live_auction"]["Update"]["bid_history"],
        })
        .eq("id", liveAuction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchAuction();
      queryClient.invalidateQueries({ queryKey: ["auction-teams"] });
    },
    onError: (error) => {
      toast({ title: "Error placing bid", description: error.message, variant: "destructive" });
    },
  });

  const sellPlayerMutation = useMutation({
    mutationFn: async () => {
      if (!liveAuction || !liveAuction.current_player_id || !liveAuction.current_bidding_team_id) {
        throw new Error("No active bid to finalize");
      }

      // Update player
      const { error: playerError } = await supabase
        .from("players")
        .update({
          auction_status: "sold",
          team_id: liveAuction.current_bidding_team_id,
          sold_price: liveAuction.current_bid,
        })
        .eq("id", liveAuction.current_player_id);
      if (playerError) throw playerError;

      // Update team budget
      const team = teams?.find((t) => t.id === liveAuction.current_bidding_team_id);
      if (team) {
        const { error: teamError } = await supabase
          .from("teams")
          .update({ remaining_budget: team.remaining_budget - liveAuction.current_bid })
          .eq("id", team.id);
        if (teamError) throw teamError;
      }

      // Reset auction state
      const { error: auctionError } = await supabase
        .from("live_auction")
        .update({
          current_player_id: null,
          current_bid: 0,
          current_bidding_team_id: null,
          is_live: false,
          bid_history: [],
        })
        .eq("id", liveAuction.id);
      if (auctionError) throw auctionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-players", selectedSeasonId] });
      queryClient.invalidateQueries({ queryKey: ["auction-teams"] });
      refetchAuction();
      setSelectedPlayerId("");
      toast({ title: "Player sold successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error selling player", description: error.message, variant: "destructive" });
    },
  });

  const markUnsoldMutation = useMutation({
    mutationFn: async () => {
      if (!liveAuction || !liveAuction.current_player_id) return;

      const { error: playerError } = await supabase
        .from("players")
        .update({ auction_status: "unsold" })
        .eq("id", liveAuction.current_player_id);
      if (playerError) throw playerError;

      const { error: auctionError } = await supabase
        .from("live_auction")
        .update({
          current_player_id: null,
          current_bid: 0,
          current_bidding_team_id: null,
          is_live: false,
          bid_history: [],
        })
        .eq("id", liveAuction.id);
      if (auctionError) throw auctionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-players", selectedSeasonId] });
      refetchAuction();
      setSelectedPlayerId("");
      toast({ title: "Player marked as unsold" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const pauseAuctionMutation = useMutation({
    mutationFn: async () => {
      if (!liveAuction) return;
      const { error } = await supabase
        .from("live_auction")
        .update({ is_live: false })
        .eq("id", liveAuction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchAuction();
      toast({ title: "Auction paused" });
    },
  });

  const resumeAuctionMutation = useMutation({
    mutationFn: async () => {
      if (!liveAuction) return;
      const { error } = await supabase
        .from("live_auction")
        .update({ is_live: true })
        .eq("id", liveAuction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchAuction();
      toast({ title: "Auction resumed" });
    },
  });

  const updateAuctionDateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSeasonId || !auctionDate) return;
      
      const dateTime = auctionTime 
        ? `${auctionDate}T${auctionTime}:00` 
        : `${auctionDate}T00:00:00`;
      
      const { error } = await supabase
        .from("seasons")
        .update({ auction_date: dateTime })
        .eq("id", selectedSeasonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      toast({ title: "Auction date updated!" });
    },
    onError: (error) => {
      toast({ title: "Error updating auction date", description: error.message, variant: "destructive" });
    },
  });

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const isLoading = playersLoading || teamsLoading;
  const isAuctionActive = liveAuction?.is_live && liveAuction?.current_player_id;
  const currentBiddingTeam = teams?.find((t) => t.id === liveAuction?.current_bidding_team_id);

  return (
    <div className="space-y-6">
      {/* Auction Date Setting */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Auction Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Auction Date</Label>
              <Input
                type="date"
                value={auctionDate}
                onChange={(e) => setAuctionDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Auction Time</Label>
              <Input
                type="time"
                value={auctionTime}
                onChange={(e) => setAuctionTime(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => updateAuctionDateMutation.mutate()}
                disabled={!auctionDate}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Date
              </Button>
            </div>
          </div>
          {selectedSeason?.auction_date && (
            <p className="text-sm text-muted-foreground mt-2">
              Currently set to: {format(new Date(selectedSeason.auction_date), "PPP 'at' h:mm a")}
            </p>
          )}
        </CardContent>
      </Card>
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Live Auction Control</h1>
        <p className="text-muted-foreground mt-1">
          Manage the live auction and place bids
        </p>
      </div>

      {/* Team Budgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {teamsLoading
          ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
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
                    ${(team.remaining_budget / 1000).toFixed(0)}K
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Current Auction */}
      {isAuctionActive && currentPlayer && (
        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary animate-pulse" />
                <span>Now Auctioning</span>
              </div>
              <div className="flex gap-2">
                {liveAuction?.is_live ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pauseAuctionMutation.mutate()}
                  >
                    <Pause className="w-4 h-4 mr-1" /> Pause
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeAuctionMutation.mutate()}
                  >
                    <Play className="w-4 h-4 mr-1" /> Resume
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                {currentPlayer.photo_url ? (
                  <img
                    src={currentPlayer.photo_url}
                    alt={currentPlayer.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="text-center md:text-left flex-grow">
                <h3 className="text-2xl font-bold">{currentPlayer.full_name}</h3>
                <Badge variant="secondary">{roleLabels[currentPlayer.role]}</Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  Base: ${liveAuction?.base_price?.toLocaleString()} | Increment: ${liveAuction?.increment_amount?.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Bid</p>
                <p className="text-4xl font-bold text-primary">
                  ${liveAuction?.current_bid?.toLocaleString()}
                </p>
                {currentBiddingTeam && (
                  <p className="text-sm mt-1">by {currentBiddingTeam.name}</p>
                )}
              </div>
            </div>

            {/* Bid Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {teams?.map((team) => {
                const nextBid = (liveAuction?.current_bid || 0) + (liveAuction?.increment_amount || 0);
                const canAfford = team.remaining_budget >= nextBid;
                const isHighestBidder = team.id === liveAuction?.current_bidding_team_id;

                return (
                  <Button
                    key={team.id}
                    variant={isHighestBidder ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col items-center gap-1"
                    disabled={!canAfford || isHighestBidder}
                    onClick={() => placeBidMutation.mutate(team.id)}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: team.primary_color, color: team.secondary_color }}
                    >
                      {team.short_name}
                    </div>
                    <span className="text-xs">{team.name}</span>
                    {!isHighestBidder && canAfford && (
                      <span className="text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        +${liveAuction?.increment_amount?.toLocaleString()}
                      </span>
                    )}
                    {isHighestBidder && (
                      <Badge variant="secondary" className="text-xs">Highest</Badge>
                    )}
                    {!canAfford && (
                      <span className="text-xs text-destructive">No budget</span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => markUnsoldMutation.mutate()}
              >
                <X className="w-4 h-4 mr-2" />
                Mark Unsold
              </Button>
              <Button
                className="flex-1"
                onClick={() => sellPlayerMutation.mutate()}
                disabled={!liveAuction?.current_bidding_team_id}
              >
                <Check className="w-4 h-4 mr-2" />
                Sell to {currentBiddingTeam?.short_name || "Team"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start New Auction */}
      {!isAuctionActive && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Start Auction for Player
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <Label>Select Player</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players?.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.full_name} - {roleLabels[player.role]} (${player.base_price.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Base Price ($)</Label>
                <Input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </div>
              <div>
                <Label>Increment ($)</Label>
                <Input
                  type="number"
                  value={incrementAmount}
                  onChange={(e) => setIncrementAmount(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => startAuctionMutation.mutate()}
              disabled={!selectedPlayerId}
            >
              <Gavel className="w-4 h-4 mr-2" />
              Start Auction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Players Pool */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
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
                  className={`p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors cursor-pointer ${
                    selectedPlayerId === player.id ? "border-primary" : "border-border"
                  }`}
                  onClick={() => setSelectedPlayerId(player.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
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
                      ${player.base_price.toLocaleString()}
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
    </div>
  );
}
