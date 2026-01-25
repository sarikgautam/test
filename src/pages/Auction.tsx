import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, User, TrendingUp, Trophy, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useActiveSeason } from "@/hooks/useSeason";
import { AuctionCountdown } from "@/components/auction/AuctionCountdown";
import { SoldPlayersList } from "@/components/auction/SoldPlayersList";
import { HoldPlayersList } from "@/components/auction/HoldPlayersList";
import { RecentSoldPlayers } from "@/components/auction/RecentSoldPlayers";
import { SoldPlayerCelebration } from "@/components/auction/SoldPlayerCelebration";
import { AuctionPoolList } from "@/components/auction/AuctionPoolList";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface BidEntry {
  team_id: string;
  team_name: string;
  team_short_name: string;
  amount: number;
  timestamp: string;
}

interface SoldCelebrationData {
  player: Player;
  team: Team;
  soldPrice: number;
}

export default function Auction() {
  const { activeSeason, isLoading: seasonLoading } = useActiveSeason();
  const queryClient = useQueryClient();
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([]);
  const [showCelebration, setShowCelebration] = useState<SoldCelebrationData | null>(null);
  const previousPlayerIdRef = useRef<string | null>(null);
  const previousBidRef = useRef<{ playerId: string | null; teamId: string | null; bid: number }>({
    playerId: null,
    teamId: null,
    bid: 0,
  });

  const { data: liveAuction, refetch } = useQuery({
    queryKey: ["live-auction", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return null;
      const { data, error } = await supabase
        .from("live_auction")
        .select("*")
        .eq("season_id", activeSeason.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeSeason?.id,
    refetchInterval: 2000, // Poll every 2 seconds as backup
  });

  const { data: currentPlayer } = useQuery({
    queryKey: ["auction-current-player", liveAuction?.current_player_id, activeSeason?.id],
    queryFn: async () => {
      if (!liveAuction?.current_player_id || !activeSeason?.id) return null;
      const { data, error } = await supabase
        .from("players")
        .select("*, player_season_registrations!inner(residency_type)")
        .eq("id", liveAuction.current_player_id)
        .eq("player_season_registrations.season_id", activeSeason.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!liveAuction?.current_player_id && !!activeSeason?.id,
  });

  const { data: playerStats } = useQuery({
    queryKey: ["auction-player-stats", liveAuction?.current_player_id],
    queryFn: async () => {
      if (!liveAuction?.current_player_id) return null;
      const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", liveAuction.current_player_id);
      if (error) throw error;
      
      // Aggregate stats across all seasons
      const aggregated = {
        matches: 0,
        runs_scored: 0,
        wickets: 0,
      };
      
      data?.forEach((stat) => {
        aggregated.matches += 1;
        aggregated.runs_scored += stat.runs_scored;
        aggregated.wickets += stat.wickets;
      });
      
      return aggregated;
    },
    enabled: !!liveAuction?.current_player_id,
  });

  const { data: currentBiddingTeam } = useQuery({
    queryKey: ["auction-current-team", liveAuction?.current_bidding_team_id],
    queryFn: async () => {
      if (!liveAuction?.current_bidding_team_id) return null;
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", liveAuction.current_bidding_team_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!liveAuction?.current_bidding_team_id,
  });

  const { data: teams } = useQuery({
    queryKey: ["auction-teams", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return [];

      // Get teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, short_name, primary_color, secondary_color, remaining_budget, budget")
        .order("name");
      if (teamsError) throw teamsError;

      // Get sold players for this season to calculate spent budget
      const { data: soldPlayers, error: soldError } = await supabase
        .from("player_season_registrations")
        .select("team_id, sold_price")
        .eq("season_id", activeSeason.id)
        .eq("auction_status", "sold")
        .not("team_id", "is", null);
      if (soldError) throw soldError;

      // Calculate remaining budget dynamically
      return teamsData.map((team) => {
        const teamSpent = soldPlayers
          ?.filter((p) => p.team_id === team.id)
          .reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0;

        return {
          ...team,
          remaining_budget: team.budget - teamSpent,
        };
      });
    },
    enabled: !!activeSeason?.id,
    refetchInterval: 3000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!activeSeason?.id) return;

    const channel = supabase
      .channel("live-auction-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_auction",
          filter: `season_id=eq.${activeSeason.id}`,
        },
        () => {
          // Invalidate all auction related queries
          queryClient.invalidateQueries({ queryKey: ["live-auction"] });
          queryClient.invalidateQueries({ queryKey: ["auction-current-player"] });
          queryClient.invalidateQueries({ queryKey: ["auction-player-stats"] });
          queryClient.invalidateQueries({ queryKey: ["current-bidding-team"] });
          queryClient.invalidateQueries({ queryKey: ["auction-teams", activeSeason.id] });
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSeason?.id, refetch, queryClient]);

  // Parse bid history
  useEffect(() => {
    if (liveAuction?.bid_history && Array.isArray(liveAuction.bid_history)) {
      setBidHistory(liveAuction.bid_history as unknown as BidEntry[]);
    } else {
      setBidHistory([]);
    }
  }, [liveAuction?.bid_history]);

  // Detect when a player is sold (player goes from active to null with a team)
  useEffect(() => {
    const prevPlayerId = previousBidRef.current.playerId;
    const prevTeamId = previousBidRef.current.teamId;
    const prevBid = previousBidRef.current.bid;

    // If we had a player and team, but now player is null - they were sold!
    if (prevPlayerId && prevTeamId && prevBid > 0 && !liveAuction?.current_player_id) {
      // Fetch the sold player and team to show celebration
      const fetchSoldData = async () => {
        const [playerRes, teamRes, regRes] = await Promise.all([
          supabase.from("players").select("*").eq("id", prevPlayerId).single(),
          supabase.from("teams").select("*").eq("id", prevTeamId).single(),
          supabase.from("player_season_registrations").select("*").eq("player_id", prevPlayerId).eq("season_id", activeSeason?.id!).single(),
        ]);

        if (playerRes.data && teamRes.data && regRes.data?.auction_status === "sold") {
          setShowCelebration({
            player: playerRes.data,
            team: teamRes.data,
            soldPrice: prevBid,
          });
          // Invalidate sold players list
          queryClient.invalidateQueries({ queryKey: ["sold-players"] });
          queryClient.invalidateQueries({ queryKey: ["auction-teams"] });
        }
      };
      fetchSoldData();
    }

    // Update the ref with current values
    previousBidRef.current = {
      playerId: liveAuction?.current_player_id || null,
      teamId: liveAuction?.current_bidding_team_id || null,
      bid: liveAuction?.current_bid || 0,
    };
  }, [liveAuction?.current_player_id, liveAuction?.current_bidding_team_id, liveAuction?.current_bid, queryClient, activeSeason?.id]);

  const roleLabels: Record<string, string> = {
    batsman: "Batsman",
    bowler: "Bowler",
    all_rounder: "All-Rounder",
    wicket_keeper: "Wicket Keeper",
  };

  const getTeamById = (id: string) => teams?.find((t) => t.id === id);

  const lastBid = bidHistory.length > 1 ? bidHistory[bidHistory.length - 2] : null;
  const currentBid = liveAuction?.current_bid || 0;
  const increment = lastBid ? currentBid - lastBid.amount : 0;

  return (

    <Layout>
      {/* Sold Player Celebration Modal */}
      {showCelebration && (
        <SoldPlayerCelebration
          player={showCelebration.player}
          team={showCelebration.team}
          soldPrice={showCelebration.soldPrice}
          onClose={() => setShowCelebration(null)}
        />
      )}

      {/* Manual Celebration Trigger for Admins */}
      {liveAuction?.is_live && currentPlayer && currentBiddingTeam && (
        <div className="flex justify-center mb-4">
          <button
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform border-2 border-primary"
            onClick={async () => {
              // Fetch latest player and team data for celebration
              const [playerRes, teamRes] = await Promise.all([
                supabase.from("players").select("*").eq("id", currentPlayer.id).single(),
                supabase.from("teams").select("*").eq("id", currentBiddingTeam.id).single(),
              ]);
              if (playerRes.data && teamRes.data) {
                setShowCelebration({
                  player: playerRes.data,
                  team: teamRes.data,
                  soldPrice: currentBid,
                });
              }
            }}
          >
            Manually Trigger Celebration
          </button>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="/gcnpl-logo.png" alt="GCNPL" className="w-16 h-16 md:w-20 md:h-20" />
            <h1 className="font-display text-4xl md:text-5xl text-gradient-gold">
              Live Auction
            </h1>
            <img src="/gcnpl-logo.png" alt="GCNPL" className="w-16 h-16 md:w-20 md:h-20" />
          </div>
          {liveAuction?.is_live && (
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-full border border-red-500/30 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-semibold">LIVE NOW</span>
            </div>
          )}
          <div className="flex items-center justify-center mt-4">
            <Link to="/auction/stats">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                View Auction Stats
              </Button>
            </Link>
          </div>
        </div>

        {seasonLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full max-w-2xl mx-auto" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !liveAuction?.is_live ? (
          <div className="space-y-8">
            {/* Show countdown only if auction date is set and in the future */}
            {activeSeason?.auction_date && new Date(activeSeason.auction_date) > new Date() && (
              <AuctionCountdown auctionDate={activeSeason.auction_date} />
            )}

            {/* Always show recent sold players and top bids before pool */}
            <RecentSoldPlayers seasonId={activeSeason?.id} limit={3} />
            <SoldPlayersList seasonId={activeSeason?.id} />

            {/* Auction Pool - Show available players */}
            <AuctionPoolList seasonId={activeSeason?.id} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Player Card */}
            {currentPlayer && (
              <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-transparent max-w-3xl mx-auto overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-primary/20 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-primary animate-pulse" />
                      <span className="font-bold text-primary">NOW BIDDING</span>
                    </div>
                    {increment > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +${increment.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Large Profile Picture */}
                      <div className="relative group flex-shrink-0">
                        <div className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl overflow-hidden ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
                          {currentPlayer.photo_url ? (
                            <img
                              src={currentPlayer.photo_url}
                              alt={currentPlayer.full_name}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-32 h-32 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground rounded-xl px-4 py-2 shadow-lg">
                          <span className="text-xs font-semibold">ON AUCTION</span>
                        </div>
                      </div>
                      
                      {/* Player Details */}
                      <div className="flex-grow space-y-6 text-center lg:text-left w-full">
                        <div>
                          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {currentPlayer.full_name}
                          </h2>
                          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                              {roleLabels[currentPlayer.role]}
                            </Badge>
                            {currentPlayer.batting_style && (
                              <Badge variant="outline" className="text-sm">{currentPlayer.batting_style}</Badge>
                            )}
                            {currentPlayer.bowling_style && (
                              <Badge variant="outline" className="text-sm">{currentPlayer.bowling_style}</Badge>
                            )}
                            {(currentPlayer as any).player_season_registrations?.[0]?.residency_type && 
                             (currentPlayer as any).player_season_registrations[0].residency_type !== "other-state" && (
                              <Badge className={
                                (currentPlayer as any).player_season_registrations[0].residency_type === "gc-tweed"
                                  ? "bg-blue-500/20 text-blue-600 border-blue-500/30 text-sm"
                                  : "bg-purple-500/20 text-purple-600 border-purple-500/30 text-sm"
                              }>
                                {(currentPlayer as any).player_season_registrations[0].residency_type === "gc-tweed" ? "🏆 GC" : "🏘️ QLD"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Stats */}
                        {playerStats && (
                          <div className="bg-muted/30 rounded-xl p-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <p className="text-2xl font-bold text-primary">{playerStats.matches}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Matches</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-2xl font-bold text-primary">{playerStats.runs_scored}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Runs</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-2xl font-bold text-primary">{playerStats.wickets}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Wickets</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Current Bid Section */}
                        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-xl p-6 border border-primary/30">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Current Bid</p>
                              <p className="text-5xl md:text-6xl font-display font-bold text-primary animate-pulse">
                                ${currentBid.toLocaleString()}
                              </p>
                            </div>
                            {currentBiddingTeam && (
                              <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-lg px-6 py-3 border border-border">
                                {currentBiddingTeam.logo_url ? (
                                  <img
                                    src={currentBiddingTeam.logo_url}
                                    alt={currentBiddingTeam.name}
                                    className="w-10 h-10 rounded-lg object-cover shadow-md"
                                  />
                                ) : (
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-md"
                                    style={{
                                      backgroundColor: currentBiddingTeam.primary_color,
                                      color: currentBiddingTeam.secondary_color,
                                    }}
                                  >
                                    {currentBiddingTeam.short_name}
                                  </div>
                                )}
                                <div className="text-left">
                                  <p className="text-xs text-muted-foreground">Leading Team</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Budgets */}
            <div>
              <h3 className="text-lg font-display mb-4 text-center">Team Purses</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {teams?.map((team) => (
                  <Card
                    key={team.id}
                    className={`border-border/50 transition-all w-28 ${
                      currentBiddingTeam?.id === team.id
                        ? "ring-2 ring-primary scale-105"
                        : ""
                    }`}
                  >
                    <CardContent className="p-3 text-center">
                      <div
                        className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-2"
                        style={{
                          backgroundColor: team.primary_color,
                          color: team.secondary_color,
                        }}
                      >
                        {team.short_name}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{team.name}</p>
                      <p className="font-bold text-sm">
                        ${team.remaining_budget.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Bid History */}
            {bidHistory.length > 0 && (
              <Card className="border-border/50 max-w-2xl mx-auto">
                <CardContent className="p-4">
                  <h3 className="text-lg font-display mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Bid History
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {[...bidHistory].reverse().map((bid, index) => {
                      const team = getTeamById(bid.team_id);
                      const prevBid = bidHistory[bidHistory.length - 2 - index];
                      const bidIncrement = prevBid ? bid.amount - prevBid.amount : 0;
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            index === 0
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {team && (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{
                                  backgroundColor: team.primary_color,
                                  color: team.secondary_color,
                                }}
                              >
                                {team.short_name}
                              </div>
                            )}
                            <span className="font-medium">{bid.team_name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">
                              ${bid.amount.toLocaleString()}
                            </span>
                            {bidIncrement > 0 && (
                              <span className="text-green-400 text-sm ml-2">
                                +${bidIncrement.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Sold Players */}
            <RecentSoldPlayers seasonId={activeSeason?.id} limit={5} />

            {/* Hold Players Section */}
            <HoldPlayersList seasonId={activeSeason?.id} />

            {/* Auction Pool - Show remaining available players during live auction */}
            <AuctionPoolList seasonId={activeSeason?.id} />

            {/* Sold Players Section during live auction */}
            <SoldPlayersList seasonId={activeSeason?.id} />
          </div>
        )}
      </div>
    </Layout>
  );
}
