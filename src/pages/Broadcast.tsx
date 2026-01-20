import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, User, TrendingUp } from "lucide-react";
import { useActiveSeason } from "@/hooks/useSeason";

const roleLabels: Record<string, string> = {
  batsman: "Batsman",
  bowler: "Bowler",
  all_rounder: "All-Rounder",
  wicket_keeper: "Wicket Keeper",
};

export default function Broadcast() {
  const { activeSeason, isLoading: seasonLoading } = useActiveSeason();
  const queryClient = useQueryClient();
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const previousBidRef = useRef<{ playerId: string | null; teamId: string | null; bid: number }>({
    playerId: null,
    teamId: null,
    bid: 0,
  });

  const { data: liveAuction } = useQuery({
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
    refetchInterval: 2000,
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
      const aggregated = { matches: 0, runs_scored: 0, wickets: 0 };
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

  // Bid increment logic
  useEffect(() => {
    if (liveAuction?.bid_history && Array.isArray(liveAuction.bid_history)) {
      setBidHistory(liveAuction.bid_history as any[]);
    } else {
      setBidHistory([]);
    }
  }, [liveAuction?.bid_history]);

  const lastBid = bidHistory.length > 1 ? bidHistory[bidHistory.length - 2] : null;
  const currentBid = liveAuction?.current_bid || 0;
  const increment = lastBid ? currentBid - lastBid.amount : 0;

  // 1920x1080 full-bleed container, professional broadcast look
  return (
    <div
      style={{ width: "1920px", height: "1080px", minHeight: "100vh", background: "#0a0d16" }}
      className="flex items-center justify-center overflow-hidden relative"
    >
      {/* Main Container */}
      <div className="relative z-10 flex w-[1600px] h-[900px] bg-gradient-to-br from-[#181f2e] to-[#0a0d16] rounded-3xl shadow-2xl border-8 border-primary/40 overflow-hidden">
        {/* Left: Player Photo with GCNPL Logo above */}
        <div className="relative flex flex-col items-center justify-center w-[600px] h-full bg-black/60">
          {/* GCNPL Logo above profile pic */}
          <div className="mt-10 mb-4 flex items-center justify-center">
            <span className="inline-flex items-center justify-center rounded-2xl bg-white w-36 h-36 shadow-xl">
              <img src="/gcnpl-logo.png" alt="GCNPL" className="w-32 h-32 drop-shadow-xl" />
            </span>
          </div>
          <div className="relative w-[500px] h-[650px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 flex items-center justify-center mb-4">
            {currentPlayer?.photo_url ? (
              <img
                src={currentPlayer.photo_url}
                alt={currentPlayer.full_name}
                className="w-full h-full object-cover"
                style={{ filter: "drop-shadow(0 0 50px #fff8)" }}
              />
            ) : (
              <User className="w-48 h-48 text-muted-foreground/50" />
            )}
          </div>
          {/* On Auction Badge below profile pic */}
          <span className="bg-green-500 text-white text-2xl font-bold px-8 py-2 rounded-full shadow-lg border-4 border-white/20 animate-fade-in">
            ON AUCTION
          </span>
        </div>

        {/* Right: Player Info and Bidding */}
        <div className="flex-1 flex flex-col justify-between p-16">
          <div>
            {/* Player Name */}
            <h2 className="text-6xl font-extrabold text-white tracking-tight mb-6 animate-fade-in">
              {currentPlayer?.full_name || <Skeleton className="h-16 w-96" />}
            </h2>
            {/* Player Style */}
            <div className="flex flex-wrap items-center gap-6 mb-4">
              {currentPlayer?.role && (
                <span className="text-2xl font-semibold uppercase tracking-widest text-primary/90 bg-white/10 px-6 py-2 rounded-lg">
                  {roleLabels[currentPlayer.role]}
                </span>
              )}
              {currentPlayer?.batting_style && (
                <span className="text-xl text-white/80 bg-white/5 px-4 py-1 rounded-lg">
                  {currentPlayer.batting_style}
                </span>
              )}
              {currentPlayer?.bowling_style && (
                <span className="text-xl text-white/80 bg-white/5 px-4 py-1 rounded-lg">
                  {currentPlayer.bowling_style}
                </span>
              )}
            </div>
            {/* Residency on its own line */}
            {(currentPlayer as any)?.player_season_registrations?.[0]?.residency_type &&
              (currentPlayer as any).player_season_registrations[0].residency_type !== "other-state" && (
                <div className="mb-8">
                  <span className="text-2xl text-blue-400 bg-blue-900/30 px-6 py-2 rounded-lg">
                    {(currentPlayer as any).player_season_registrations[0].residency_type === "gc-tweed"
                      ? "🏆 GC"
                      : "🏘️ QLD"}
                  </span>
                </div>
              )}
            {/* Key Player Stats - Bigger with transparent background */}
            {playerStats && (
              <div className="flex gap-24 mb-12 mt-6 px-12 py-6 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg">
                <div className="flex flex-col items-center">
                  <span className="text-7xl font-extrabold text-primary drop-shadow-xl">{playerStats.matches}</span>
                  <span className="text-2xl text-white/80 mt-2 tracking-wide">Matches</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-7xl font-extrabold text-primary drop-shadow-xl">{playerStats.runs_scored}</span>
                  <span className="text-2xl text-white/80 mt-2 tracking-wide">Runs</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-7xl font-extrabold text-primary drop-shadow-xl">{playerStats.wickets}</span>
                  <span className="text-2xl text-white/80 mt-2 tracking-wide">Wickets</span>
                </div>
              </div>
            )}
          </div>
          {/* Current Bid & Team Bidding */}
          <div className="flex items-end justify-between mt-8">
            <div>
              <p className="text-2xl text-white/70 mb-2 uppercase tracking-widest font-semibold">Current Bid</p>
              <p className="text-7xl font-extrabold text-green-400 animate-bid-update drop-shadow-2xl transition-all duration-300">
                ${liveAuction?.current_bid?.toLocaleString() || 0}
              </p>
              {increment > 0 && (
                <div className="flex items-center gap-4 mt-2">
                  <TrendingUp className="w-8 h-8 text-green-400 animate-bounce" />
                  <span className="text-3xl text-green-400 font-bold animate-bounce">+${increment.toLocaleString()}</span>
                </div>
              )}
            </div>
            {/* Team Bidding Section */}
            {currentBiddingTeam && (
              <div className="flex flex-col items-center bg-white/10 rounded-2xl px-12 py-8 border-4 border-primary/30 shadow-2xl animate-fade-in">
                {currentBiddingTeam.logo_url ? (
                  <img
                    src={currentBiddingTeam.logo_url}
                    alt={currentBiddingTeam.name}
                    className="w-24 h-24 rounded-xl object-cover shadow-xl mb-2"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold shadow-xl mb-2"
                    style={{
                      backgroundColor: currentBiddingTeam.primary_color,
                      color: currentBiddingTeam.secondary_color,
                    }}
                  >
                    {currentBiddingTeam.short_name}
                  </div>
                )}
                <span className="text-xl text-primary font-bold mt-2 tracking-wide">Team Bidding</span>
              </div>
            )}
          </div>
            {/* GCNPL logo and name just below Team Bidding */}
            <div className="flex flex-col items-center opacity-90 mb-4">
              <span className="inline-flex items-center justify-center rounded-xl bg-white w-20 h-20 shadow-lg mb-2">
                <img src="/gcnpl-logo.png" alt="GCNPL" className="w-16 h-16 drop-shadow-xl" />
              </span>
              <span className="text-white/70 text-lg font-semibold tracking-widest text-center whitespace-nowrap">Gold Coast Nepalese Premier League Season 2</span>
            </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes bid-update {
          0% { color: #fff; transform: scale(1.1); }
          60% { color: #4ade80; transform: scale(1.2); }
          100% { color: #22c55e; transform: scale(1); }
        }
        .animate-bid-update {
          animation: bid-update 0.5s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}
