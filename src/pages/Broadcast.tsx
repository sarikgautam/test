import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { User, TrendingUp } from "lucide-react";
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
  // Fetch all teams for logo bar
  const { data: allTeams } = useQuery({
    queryKey: ["all-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data;
    },
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
        .select("*, player_season_registrations!inner(residency_type,team_id)")
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
  // Team logo bar logic
  const biddingTeamId = liveAuction?.current_bidding_team_id;
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        background: '#0a0d16',
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'hidden',
      }}
      className="flex items-center justify-center overflow-hidden relative"
    >
      {/* Main Container */}
      <div className="relative z-10 flex flex-col md:flex-row w-full h-full bg-gradient-to-br from-[#181f2e] to-[#0a0d16] rounded-none md:rounded-3xl shadow-2xl border-0 md:border-8 border-primary/40 overflow-hidden" style={{maxWidth:'100vw',maxHeight:'100vh'}}>
        {/* Left: Player Photo */}
        <div className="relative flex flex-col items-center justify-center w-full md:w-[38vw] h-[40vh] md:h-full bg-black/60 p-2 md:p-0">
          {/* GCNPL logo above profile pic */}
          <div className="flex items-center justify-center w-full">
            <span className="inline-flex items-center justify-center w-[30vw] h-[7vw] bg-white rounded-xl shadow-lg border-2 border-primary">
              <img src="/gcnpl-logo.png" alt="GCNPL Logo" className="w-[6vw] h-[6vw] object-contain" />
            </span>
          </div>
          <div className="relative w-[28vw] h-[36vw] md:w-[22vw] md:h-[28vw] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 flex items-center justify-center mb-2 md:mb-4">
            {currentPlayer?.photo_url ? (
              <img
                src={currentPlayer.photo_url}
                alt={currentPlayer.full_name}
                className="w-full h-full object-cover"
                style={{ filter: "drop-shadow(0 0 50px #fff8)" }}
              />
            ) : (
              <User className="w-32 h-32 md:w-48 md:h-48 text-muted-foreground/50" />
            )}
          </div>
          {/* On Auction Badge below profile pic */}
          <span className="bg-green-500 text-white text-lg md:text-2xl font-bold px-4 md:px-8 py-1 md:py-2 rounded-full shadow-lg border-4 border-white/20 animate-fade-in mt-2 md:mt-0">
            ON AUCTION
          </span>
        </div>

        {/* Right: Player Info and Bidding */}
        <div className="flex-1 flex flex-col justify-between p-2 md:p-8 lg:p-16 min-w-0 overflow-x-auto">
          <div>
            {/* Suspense Animation Reveal for Player Name, Stats, Profile */}
            <div className="relative">
              <div className="relative flex flex-row items-center w-full">
                <div className="flex-1 flex items-center">
                  <h2
                    className="text-6xl font-extrabold text-white tracking-tight mb-2 kinetic-name z-10 text-left"
                    style={{ opacity: currentPlayer ? 1 : 0 }}
                  >
                    {currentPlayer?.full_name
                      ? currentPlayer.full_name.split("").map((char, idx) => (
                          <span
                            key={idx}
                            className="inline-block kinetic-letter"
                            style={{ animationDelay: `${idx * 0.06}s` }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </span>
                        ))
                      : <Skeleton className="h-20 w-[600px]" />}
                  </h2>
                </div>
                {currentPlayer?.full_name && (
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[7rem] font-black text-white/10 select-none pointer-events-none whitespace-nowrap z-0 pr-8 tracking-widest font-mono uppercase"
                    style={{ fontFamily: 'monospace, "Fira Mono", "Roboto Mono", "Menlo", "Consolas", "Liberation Mono", "Courier New", monospace' }}
                    aria-hidden="true"
                  >
                    {currentPlayer.full_name.split(" ")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <hr className="w-1/2 mx-auto my-2 border-t-2 border-primary/30" />
              <div className="mb-6" />
              {/* Residency Status - big */}
              {(currentPlayer as any)?.player_season_registrations?.[0]?.residency_type &&
                (currentPlayer as any).player_season_registrations[0].residency_type !== "other-state" && (
                  <div className="mb-6 animate-suspense-reveal-delay1">
                    <span className="text-3xl font-bold text-blue-300 bg-blue-900/30 px-8 py-3 rounded-2xl">
                      {(currentPlayer as any).player_season_registrations[0].residency_type === "gc-tweed"
                        ? "🏆 GC"
                        : "🏘️ QLD"}
                    </span>
                  </div>
                )}
              {/* Player Style - moved down */}
              <div className="flex flex-wrap items-center gap-6 mb-8 animate-suspense-reveal-delay2">
                {currentPlayer?.role && (
                  <span className="text-2xl font-semibold uppercase tracking-widest text-primary/90 bg-white/10 px-6 py-3 rounded-xl">
                    {roleLabels[currentPlayer.role]}
                  </span>
                )}
                {currentPlayer?.batting_style && (
                  <span className="text-xl text-white/80 bg-white/5 px-5 py-2 rounded-xl">
                    {currentPlayer.batting_style}
                  </span>
                )}
                {currentPlayer?.bowling_style && (
                  <span className="text-xl text-white/80 bg-white/5 px-5 py-2 rounded-xl">
                    {currentPlayer.bowling_style}
                  </span>
                )}
              </div>
              {/* Key Player Stats - moved further down */}
              {/* Stats containers removed as requested */}
            </div>
            {/* Team Logo Bar - all teams, highlight and zoom last bidded (moved above current bid) */}
            {/* ...existing code... */}
            {/* Current Team below stats (not bidding team) */}
            {(() => {
              if (!currentPlayer?.current_team) return null;
              const team = allTeams?.find((t: any) => t.name?.toLowerCase() === currentPlayer.current_team?.toLowerCase());
              return (
                <div className="flex flex-col items-center justify-center mt-2 mb-8 px-8 py-6 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg">
                  <div className="flex items-center mb-2">
                    {team?.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-20 h-20 object-contain mr-6" />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center text-3xl font-bold bg-primary/20 text-primary mr-6">
                        {currentPlayer.current_team[0]}
                      </div>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-4xl font-bold text-primary drop-shadow-xl">{currentPlayer.current_team}</span>
                      <span className="text-2xl text-white/80 mt-1">Current Team</span>
                    </div>
                  </div>
                  {/* team_stats and stats block removed */}
                </div>
              );
            })()}
            {/* Current Team below stats */}
            {/* Removed Currently Bidding item as requested */}
          </div>
          {/* Current Bid & Team Bidding - closer together */}
          {/* Team Logo Bar - all teams, highlight and zoom last bidded (moved above current bid) */}
          {/* Team Logo Bar moved to right of current bid */}
          <div className="flex items-end justify-between mt-4">
            <div className="flex flex-row items-center gap-8 w-full">
              <div
                className="rounded-2xl px-10 py-8 shadow-2xl border-0 relative overflow-hidden flex-1"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(34,197,94,0.10) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                  border: '3px solid',
                  borderImage: 'linear-gradient(90deg, #ff416c, #ff4b2b, #22c55e, #3b82f6) 1',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                }}
              >
                <p className="text-3xl text-white/70 mb-2 uppercase tracking-widest font-extrabold">Current Bid</p>
                <p className="text-5xl font-extrabold text-green-400 animate-bid-update drop-shadow-2xl transition-all duration-300">
                  ${liveAuction?.current_bid?.toLocaleString() || 0}
                </p>
                {increment > 0 && (
                  <div className="flex items-center gap-4 mt-2">
                    <TrendingUp className="w-10 h-10 text-green-400 animate-bounce" />
                    <span className="text-4xl text-green-400 font-extrabold animate-bounce">+${increment.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {/* Team Logo Bar - all teams, highlight and zoom last bidded (now to the right of current bid) */}
              {allTeams && allTeams.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 md:gap-6 ml-2 md:ml-8 px-2 md:px-4 py-1 md:py-2 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg" style={{maxHeight:'12vh',overflow:'hidden'}}>
                  {allTeams.map((team: any) => {
                    const isBidding = team.id === biddingTeamId;
                    return (
                      <div
                        key={team.id}
                        className={`flex flex-col items-center transition-all duration-500 ${isBidding ? "scale-125 z-10 shadow-2xl" : "scale-100 opacity-70"}`}
                        style={{
                          background: isBidding ? `linear-gradient(90deg, ${team.primary_color}, ${team.secondary_color})` : "none",
                          borderRadius: "1.5rem",
                          padding: "0.5rem 1rem",
                        }}
                      >
                        {team.logo_url ? (
                          <img
                            src={team.logo_url}
                            alt={team.name}
                            className="w-12 h-12 md:w-16 md:h-16 object-contain mb-1"
                            style={{ boxShadow: isBidding ? `0 0 40px ${team.primary_color}` : "none" }}
                          />
                        ) : (
                          <div
                            className="w-16 h-16 flex items-center justify-center text-xl font-bold"
                            style={{ backgroundColor: team.primary_color, color: team.secondary_color }}
                          >
                            {team.short_name}
                          </div>
                        )}
                        <span className={`text-[10px] md:text-xs font-bold mt-0.5 ${isBidding ? "text-white" : "text-primary"}`}>{team.short_name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
        @keyframes suspense-reveal {
          0% { opacity: 0; transform: scale(0.95) translateY(30px); filter: blur(8px); }
          60% { opacity: 0.7; filter: blur(2px); }
          100% { opacity: 1; transform: none; filter: blur(0); }
        }
        .animate-suspense-reveal {
          animation: suspense-reveal 1.2s cubic-bezier(.4,0,.2,1) both;
        }
        .animate-suspense-reveal-delay1 {
          animation: suspense-reveal 1.6s cubic-bezier(.4,0,.2,1) both;
        }
        .animate-suspense-reveal-delay2 {
          animation: suspense-reveal 2.0s cubic-bezier(.4,0,.2,1) both;
        }
        .animate-suspense-reveal-delay3 {
          animation: suspense-reveal 2.4s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </div>
  );
}
