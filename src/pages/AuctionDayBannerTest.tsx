import { useEffect, useState, useRef } from "react";
import { useQuery as usePlayerQuery } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useSeason";
import AuctionDayBanner from "./AuctionDayBanner";
import { useAuctionBannerControl } from "@/hooks/useAuctionBannerControl";
import Broadcast from "./Broadcast";
import HighImpactSoldCelebration from "@/components/auction/HighImpactSoldCelebration";
import { useQuery as useTeamQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import BudgetSlide from "./BudgetSlide";

// Celebration animation component

function SoldCelebration({ teamName, amount, onDone }: { teamName: string; amount: number; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 8000); // Show for 8 seconds
    return () => clearTimeout(timer);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 animate-fade-in">
      <div className="text-7xl font-extrabold text-yellow-400 drop-shadow-lg animate-bounce mb-8">SOLD!</div>
      <div className="text-4xl font-bold text-white mb-4">Sold to <span className="text-primary">{teamName}</span></div>
      <div className="text-5xl font-extrabold text-green-400 mb-8">${amount.toLocaleString()}</div>
      <div className="text-2xl text-white/80">Congratulations!</div>
      <div className="absolute inset-0 pointer-events-none">
        {/* Simple confetti effect */}
        <div className="w-full h-full animate-pulse">
          {/* You can add more visual effects here if desired */}
        </div>
      </div>
    </div>
  );
}


export default function AuctionDayBannerTest() {
    // Type guard for control object
    function isValidControl(obj: any): obj is { current_slide?: number; is_paused?: boolean } {
      return obj && typeof obj === 'object' && (
        ('current_slide' in obj && (typeof obj.current_slide === 'number' || typeof obj.current_slide === 'undefined')) ||
        ('is_paused' in obj && (typeof obj.is_paused === 'boolean' || typeof obj.is_paused === 'undefined'))
      );
    }
  const { control } = useAuctionBannerControl();
  const { activeSeason } = useActiveSeason();
  const [showCelebration, setShowCelebration] = useState(false);
  const [soldInfo, setSoldInfo] = useState<{ team: string; amount: number; playerId: string | null } | null>(null);
  const [soldTeamLogo, setSoldTeamLogo] = useState<string | null>(null);
  const [soldPlayer, setSoldPlayer] = useState<{ photo_url?: string; full_name?: string } | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<{ photo_url?: string; full_name?: string } | null>(null);
  const [debug, setDebug] = useState(false);
  const prevPlayerRef = useRef<string | null>(null);
  // Track last non-null bid/team for the current player
  const lastBidRef = useRef<number | null>(null);
  const lastTeamRef = useRef<string | null>(null);
  const soldTimeout = useRef<NodeJS.Timeout | null>(null);

  // Modern UI background effect (no stats shown)

  // Listen to live auction state
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

  // Detect when a player is sold (current_player_id changes and previous had a bid/team)
  // Fetch all teams for logo lookup
  const { data: allTeams } = useTeamQuery({
    queryKey: ["all-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name, logo_url");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Top Bids Query (12 players)
  const { data: topBids } = useQuery({
    queryKey: ["auction-top-bids-test", activeSeason?.id],
    enabled: !!activeSeason?.id,
    queryFn: async () => {
      if (!activeSeason?.id) return { data: [] };
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(
          `id, sold_price, auction_status,
           team:teams(id, name, logo_url),
           player:players(id, full_name, role, photo_url)`
        )
        .eq("season_id", activeSeason.id)
        .not("sold_price", "is", null)
        .order("sold_price", { ascending: false })
        .limit(12);
      if (error) throw error;
      return { data };
    },
  });

  // Fetch current player info when current_player_id changes
  useEffect(() => {
    if (liveAuction?.current_player_id) {
      supabase
        .from("players")
        .select("photo_url, full_name")
        .eq("id", liveAuction.current_player_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setCurrentPlayer({ photo_url: data.photo_url, full_name: data.full_name });
          else setCurrentPlayer(null);
        });
    } else {
      setCurrentPlayer(null);
    }
  }, [liveAuction?.current_player_id]);

  useEffect(() => {
    // Track last non-null bid/team for the current player
    // Only update lastBidRef and lastTeamRef when current_player_id changes
    if (liveAuction?.current_player_id && liveAuction?.current_player_id !== prevPlayerRef.current) {
      if (liveAuction.current_bid && liveAuction.current_bid > 0) {
        lastBidRef.current = liveAuction.current_bid;
      }
      if (liveAuction.current_bidding_team_id) {
        // Find team name from allTeams
        const foundTeam = allTeams?.find((t: any) => t.id === liveAuction.current_bidding_team_id);
        lastTeamRef.current = foundTeam?.name || "";
      }
    }
    // Only update prevPlayerRef after celebration ends, so we can retrigger for every sale
    const previousPlayerId = prevPlayerRef.current;

    if (
      previousPlayerId &&
      !liveAuction?.current_player_id &&
      lastBidRef.current &&
      lastTeamRef.current &&
      !showCelebration // don't retrigger if already showing
    ) {
      setShowCelebration(true);
      setSoldInfo({ team: lastTeamRef.current, amount: lastBidRef.current, playerId: previousPlayerId });
      // Find team logo
      const foundTeam = allTeams?.find((t: any) => t.name === lastTeamRef.current);
      setSoldTeamLogo(foundTeam?.logo_url || null);
      setSoldPlayer(null); // Reset before fetching
      if (previousPlayerId) {
        // Fetch previous player info
        supabase
          .from("players")
          .select("photo_url, full_name")
          .eq("id", previousPlayerId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setSoldPlayer({ photo_url: data.photo_url, full_name: data.full_name });
          });
      }
      if (soldTimeout.current) clearTimeout(soldTimeout.current);
      soldTimeout.current = setTimeout(() => {
        setShowCelebration(false);
        setSoldInfo(null);
        setSoldTeamLogo(null);
        setSoldPlayer(null);
        prevPlayerRef.current = null;
        lastBidRef.current = null;
        lastTeamRef.current = null;
      }, 8000);
    }
    // Always update prevPlayerRef to the last non-null player, even after a sale
    if (liveAuction?.current_player_id) {
      prevPlayerRef.current = liveAuction.current_player_id;
    } else if (!liveAuction?.current_player_id && previousPlayerId) {
      // After a sale, keep prevPlayerRef as the last sold player until the next player is loaded
      prevPlayerRef.current = previousPlayerId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveAuction?.current_player_id, allTeams]);


  // Track a key to force AuctionDayBanner remount on sale
  const [acquisitionKey, setAcquisitionKey] = useState(0);
  // When a player is sold, increment the key
  useEffect(() => {
    if (showCelebration && soldInfo) {
      setAcquisitionKey((k) => k + 1);
    }
  }, [showCelebration, soldInfo]);

  // Show overlay whenever there is a current player and not celebrating
  const showOverlay = !!liveAuction?.current_player_id && !showCelebration;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Modern UI background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#38bdf8] opacity-90" />
        <div className="absolute inset-0 backdrop-blur-[4px]" />
        {/* Subtle pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      {/* Player Info Card (restored, no stats) */}
      {liveAuction?.current_player_id && (
        <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
          <div className="relative rounded-3xl shadow-2xl p-10 w-full max-w-2xl flex flex-col items-center border-4 border-primary/40 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors ring-1 ring-white/30">
            {/* Player Photo with glow */}
            <div className="relative mb-6">
              {currentPlayer?.photo_url ? (
                <img
                  src={currentPlayer.photo_url}
                  alt={currentPlayer.full_name}
                  className="w-44 h-44 rounded-full object-cover shadow-2xl border-4 border-white/80 animate-glow"
                  style={{ boxShadow: '0 0 40px 8px #38bdf8, 0 0 0 8px #fff8' }}
                />
              ) : (
                <div className="w-44 h-44 rounded-full bg-muted shadow-2xl border-4 border-white/80 animate-pulse" />
              )}
            </div>
            {/* Player Name */}
            <h2 className="text-5xl font-extrabold text-primary drop-shadow-xl mb-2 text-center tracking-tight animate-fade-in-up">
              {currentPlayer?.full_name || "Player Name"}
            </h2>
            {/* Current Bid */}
            <div className="flex flex-row items-center justify-center gap-2 bg-primary/20 border border-primary/40 rounded-2xl px-10 py-6 w-full max-w-md mb-4 animate-fade-in-up delay-400">
              <div className="flex flex-row items-center gap-3">
                <div className="text-5xl font-extrabold text-primary drop-shadow">${liveAuction.current_bid?.toLocaleString() ?? 0}</div>
              </div>
              <div className="text-3xl font-bold text-primary-foreground flex items-center gap-2">
                {(() => {
                  if (!liveAuction.current_bidding_team_id || !allTeams) return "Bidding Team";
                  const team = allTeams.find((t: any) => t.id === liveAuction.current_bidding_team_id);
                  return team?.name || "Bidding Team";
                })()}
              </div>
            </div>
            {/* Residency Status */}
            <div className="text-2xl font-bold text-blue-300 mb-4 text-center animate-fade-in-up delay-100">
              Residency: <span className="text-white">{(currentPlayer as any)?.player_season_registrations?.[0]?.residency_type || "-"}</span>
            </div>
            {/* Player Role */}
            <div className="text-xl font-semibold text-blue-200 mb-2 text-center animate-fade-in-up delay-200">
              {(() => {
                // Try to get role from topBids or currentPlayer if available
                const player = topBids?.data?.find((p: any) => p.player?.id === liveAuction.current_player_id)?.player;
                return player?.role || "Auction Player";
              })()}
            </div>
            {/* All Teams Logo Bar */}
            {allTeams && (
              <div className="flex flex-row items-center justify-center gap-6 mt-6">
                {allTeams.map((team: any) => {
                  const isBidding = team.id === liveAuction.current_bidding_team_id;
                  return (
                    <div key={team.id} className="flex flex-col items-center">
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className={`w-14 h-14 rounded-full object-contain border-4 ${isBidding ? 'border-yellow-400 shadow-lg animate-pulse' : 'border-gray-300 opacity-60'}`}
                        style={isBidding ? { filter: 'brightness(1.2)' } : {}}
                      />
                      {isBidding && (
                        <div className="mt-2 text-lg font-bold text-yellow-400 animate-fade-in">${liveAuction.current_bid?.toLocaleString() ?? 0}</div>
                      )}
                      <div className="mt-1 text-xs text-center text-white max-w-[70px]">{team.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Only pass control if it matches the expected type */}
      {isValidControl(control) ? (
        <AuctionDayBanner key={acquisitionKey} control={control} />
      ) : (
        <AuctionDayBanner key={acquisitionKey} />
      )}
      {/* Debug and Test Celebration buttons removed as requested */}
      {debug && (
        <div className="absolute top-10 right-2 z-50 bg-white text-black p-2 rounded shadow text-xs max-w-xs w-72">
          <div><b>liveAuction.current_player_id:</b> {String(liveAuction?.current_player_id)}</div>
          <div><b>liveAuction.current_bid:</b> {String(liveAuction?.current_bid)}</div>
          <div><b>liveAuction.current_bidding_team_id:</b> {String(liveAuction?.current_bidding_team_id)}</div>
          <div><b>prevPlayerRef:</b> {String(prevPlayerRef.current)}</div>
          <div><b>lastBidRef:</b> {String(lastBidRef.current)}</div>
          <div><b>lastTeamRef:</b> {String(lastTeamRef.current)}</div>
          <div><b>showCelebration:</b> {String(showCelebration)}</div>
          <div><b>soldInfo:</b> {soldInfo ? JSON.stringify(soldInfo) : 'null'}</div>
        </div>
      )}
      {showOverlay && (
        <div className="fixed inset-0 z-40 bg-black/90 flex items-center justify-center">
          <Broadcast />
        </div>
      )}
      {showCelebration && soldInfo && (
        <HighImpactSoldCelebration
          teamLogoUrl={soldTeamLogo || ""}
          teamName={soldInfo.team}
          amount={soldInfo.amount}
          playerPhotoUrl={soldPlayer?.photo_url || ""}
          playerName={soldPlayer?.full_name || ""}
          onDone={() => {
            setShowCelebration(false);
            setSoldInfo(null);
            setSoldTeamLogo(null);
            setSoldPlayer(null);
          }}
        />
      )}
      {/* Top Bids Section removed as requested */}
    </div>
  );
}
