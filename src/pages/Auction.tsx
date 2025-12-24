import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, User, TrendingUp, Trophy, Clock } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";

interface BidEntry {
  team_id: string;
  team_name: string;
  team_short_name: string;
  amount: number;
  timestamp: string;
}

export default function Auction() {
  const activeSeason = useActiveSeason();
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([]);

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
  });

  const { data: currentPlayer } = useQuery({
    queryKey: ["auction-current-player", liveAuction?.current_player_id],
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
    queryKey: ["auction-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
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
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSeason?.id, refetch]);

  // Parse bid history
  useEffect(() => {
    if (liveAuction?.bid_history && Array.isArray(liveAuction.bid_history)) {
      setBidHistory(liveAuction.bid_history as unknown as BidEntry[]);
    } else {
      setBidHistory([]);
    }
  }, [liveAuction?.bid_history]);

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-gradient-gold mb-2">
            Live Auction
          </h1>
          <p className="text-muted-foreground">
            Watch the bidding action in real-time
          </p>
        </div>

        {!liveAuction?.is_live ? (
          <Card className="border-border/50 max-w-2xl mx-auto">
            <CardContent className="py-16 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-display mb-2">Auction Not Live</h2>
              <p className="text-muted-foreground">
                The auction hasn't started yet. Check back soon!
              </p>
            </CardContent>
          </Card>
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
                  
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {currentPlayer.photo_url ? (
                          <img
                            src={currentPlayer.photo_url}
                            alt={currentPlayer.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="text-center md:text-left flex-grow">
                        <h2 className="text-2xl md:text-3xl font-display font-bold">
                          {currentPlayer.full_name}
                        </h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                          <Badge variant="secondary">
                            {roleLabels[currentPlayer.role]}
                          </Badge>
                          {currentPlayer.batting_style && (
                            <Badge variant="outline">{currentPlayer.batting_style}</Badge>
                          )}
                          {currentPlayer.bowling_style && (
                            <Badge variant="outline">{currentPlayer.bowling_style}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Base Price: ${liveAuction.base_price.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-center flex-shrink-0">
                        <p className="text-sm text-muted-foreground mb-1">Current Bid</p>
                        <p className="text-4xl font-display font-bold text-primary">
                          ${currentBid.toLocaleString()}
                        </p>
                        {currentBiddingTeam && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{
                                backgroundColor: currentBiddingTeam.primary_color,
                                color: currentBiddingTeam.secondary_color,
                              }}
                            >
                              {currentBiddingTeam.short_name}
                            </div>
                            <span className="text-sm font-medium">
                              {currentBiddingTeam.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Budgets */}
            <div>
              <h3 className="text-lg font-display mb-4 text-center">Team Purses</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {teams?.map((team) => (
                  <Card
                    key={team.id}
                    className={`border-border/50 transition-all ${
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
                        ${(team.remaining_budget / 1000).toFixed(0)}K
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
          </div>
        )}
      </div>
    </Layout>
  );
}
