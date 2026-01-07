import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Calendar, MapPin, Star, Award, Activity } from "lucide-react";
import { formatLocalTime, calculateCricketEconomy } from "@/lib/utils";

interface PlayerStat {
  id: string;
  player_id: string;
  runs_scored: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  overs_bowled: number;
  runs_conceded: number;
  wickets: number;
  maidens: number;
  catches: number;
  stumpings: number;
  run_outs: number;
  dismissal_type: string | null;
  bowler_id: string | null;
  fielder_id: string | null;
  runout_by_id: string | null;
  dismissal_other_text: string | null;
  player: {
    id: string;
    full_name: string;
    role: string;
    team_id?: string | null;
  };
  bowler?: {
    id: string;
    full_name: string;
  } | null;
  fielder?: {
    id: string;
    full_name: string;
  } | null;
  runout_by?: {
    id: string;
    full_name: string;
  } | null;
}

const MatchScorecard = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  // Fetch match details
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match-detail", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          winner:teams!matches_winner_team_id_fkey(*),
          toss_winner:teams!matches_toss_winner_id_fkey(*),
          man_of_match:players!matches_man_of_match_id_fkey(*)
        `)
        .eq("id", matchId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  // Fetch innings data (live or completed)
  const { data: liveInnings } = useQuery({
    queryKey: ["live-innings", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_innings")
        .select("*")
        .eq("match_id", matchId!)
        .order("innings_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
    refetchInterval: match?.status === 'live' ? 2000 : false,
  });

  // New live/complete innings data (with batting/bowling teams)
  const { data: inningsData } = useQuery({
    queryKey: ["match-innings-v2", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_innings")
        .select("*, batting_team:batting_team_id(name, logo_url), bowling_team:bowling_team_id(name, logo_url)")
        .eq("match_id", matchId!)
        .order("innings_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
    refetchInterval: match?.status === 'live' ? 2000 : false,
  });

  const inningsIds = inningsData?.map((i: any) => i.id) || [];

  const { data: battingInningsV2 } = useQuery({
    queryKey: ["batting-innings-v2", inningsIds],
    queryFn: async () => {
      if (inningsIds.length === 0) return [];
      const { data, error } = await supabase
        .from("batting_innings")
        .select("*, players(full_name)")
        .in("innings_id", inningsIds);
      if (error) throw error;
      return data;
    },
    enabled: inningsIds.length > 0,
    refetchInterval: match?.status === 'live' ? 2000 : false,
  });

  const { data: bowlingInningsV2 } = useQuery({
    queryKey: ["bowling-innings-v2", inningsIds],
    queryFn: async () => {
      if (inningsIds.length === 0) return [];
      const { data, error } = await supabase
        .from("bowling_innings")
        .select("*, players(full_name)")
        .in("innings_id", inningsIds);
      if (error) throw error;
      return data;
    },
    enabled: inningsIds.length > 0,
    refetchInterval: match?.status === 'live' ? 2000 : false,
  });

  // Fetch recent balls for live match
  const currentInnings = liveInnings?.find(i => i.status === 'in_progress');
  const { data: recentBalls } = useQuery({
    queryKey: ["live-balls", currentInnings?.id],
    queryFn: async () => {
      if (!currentInnings?.id) return [];
      const { data, error } = await supabase
        .from("balls")
        .select(`
          *,
          batter:players!balls_batter_id_fkey(id, full_name),
          bowler:players!balls_bowler_id_fkey(id, full_name),
          dismissed_batter:players!balls_dismissed_batter_id_fkey(id, full_name),
          fielder:players!balls_fielder_id_fkey(id, full_name)
        `)
        .eq("innings_id", currentInnings.id)
        .order("sequence", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
    enabled: !!currentInnings?.id,
    refetchInterval: match?.status === 'live' ? 2000 : false,
  });

  // Fetch all balls for all innings (for detailed scorecard)
  const liveInningsIds = liveInnings?.map(i => i.id) || [];
  const { data: allLiveBalls } = useQuery({
    queryKey: ["all-live-balls", liveInningsIds],
    queryFn: async () => {
      if (liveInningsIds.length === 0) return [];
      const { data, error } = await supabase
        .from("balls")
        .select(`
          *,
          striker:players!balls_striker_id_fkey(id, full_name),
          bowler:players!balls_bowler_id_fkey(id, full_name),
          dismissed_player:players!balls_dismissed_player_id_fkey(id, full_name),
          fielder:players!balls_fielder_id_fkey(id, full_name)
        `)
        .in("innings_id", liveInningsIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: liveInningsIds.length > 0 && match?.status === 'live',
    refetchInterval: match?.status === 'live' ? 2000 : false,
  });

  // Fetch player stats for match
  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: ["match-player-stats", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select(`
          id,
          player_id,
          match_id,
          season_id,
          runs_scored,
          balls_faced,
          fours,
          sixes,
          overs_bowled,
          runs_conceded,
          wickets,
          maidens,
          catches,
          stumpings,
          run_outs,
          dismissal_type,
          bowler_id,
          fielder_id,
          runout_by_id,
          dismissal_other_text,
          created_at,
          player:players!player_stats_player_id_fkey(id, full_name, role)
        `)
        .eq("match_id", matchId!);
      
      if (error) {
        throw error;
      }
      
      // Get team info from player_season_registrations for this season
      if (data && data.length > 0) {
        const seasonId = data[0].season_id;
        const playerIds = [...new Set(data.map(s => s.player_id))];
        
        const { data: registrations } = await supabase
          .from("player_season_registrations")
          .select("player_id, team_id")
          .eq("season_id", seasonId)
          .in("player_id", playerIds);
        
        // Create a map of player_id -> team_id
        const playerTeamMap = new Map();
        registrations?.forEach(reg => {
          playerTeamMap.set(reg.player_id, reg.team_id);
        });
        
        // Get all unique bowler, fielder, and runout_by IDs
        const allPlayerIdsForNames = new Set<string>();
        data.forEach(stat => {
          if (stat.bowler_id) allPlayerIdsForNames.add(stat.bowler_id);
          if (stat.fielder_id) allPlayerIdsForNames.add(stat.fielder_id);
          if (stat.runout_by_id) allPlayerIdsForNames.add(stat.runout_by_id);
        });
        
        // Fetch names for bowlers, fielders, runout_by players
        let playerNamesMap = new Map();
        if (allPlayerIdsForNames.size > 0) {
          const { data: playerNames } = await supabase
            .from("players")
            .select("id, full_name")
            .in("id", Array.from(allPlayerIdsForNames));
          
          playerNames?.forEach(p => {
            playerNamesMap.set(p.id, p.full_name);
          });
        }
        
        // Add team_id and dismissal player names to each stat
        const enrichedData = data.map(stat => {
          const enrichedStat: any = { ...stat };
          
          if (stat.player) {
            enrichedStat.player = {
              ...stat.player,
              team_id: playerTeamMap.get(stat.player_id) || null
            };
          }
          
          // Add bowler, fielder, runout_by objects
          if (stat.bowler_id) {
            enrichedStat.bowler = {
              id: stat.bowler_id,
              full_name: playerNamesMap.get(stat.bowler_id) || ''
            };
          }
          if (stat.fielder_id) {
            enrichedStat.fielder = {
              id: stat.fielder_id,
              full_name: playerNamesMap.get(stat.fielder_id) || ''
            };
          }
          if (stat.runout_by_id) {
            enrichedStat.runout_by = {
              id: stat.runout_by_id,
              full_name: playerNamesMap.get(stat.runout_by_id) || ''
            };
          }
          
          return enrichedStat;
        });
        
        return enrichedData as PlayerStat[];
      }
      
      return data as unknown as PlayerStat[];
    },
    enabled: !!matchId,
  });

  // Fetch match awards
  const { data: matchAwards } = useQuery({
    queryKey: ["match-awards", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_awards")
        .select(`
          *,
          award_type:award_types(*),
          player:players(id, full_name)
        `)
        .eq("match_id", matchId!);
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  // Helper functions for live scorecard
  const getInningsBalls = (inningsId: string) => {
    return allLiveBalls?.filter(b => b.innings_id === inningsId) || [];
  };

  const calculateBatsmanStats = (balls: any[], playerId: string) => {
    const playerBalls = balls.filter(b => b.striker_id === playerId);
    const runs = playerBalls.reduce((sum, b) => sum + (b.runs_off_bat || 0), 0);
    const ballsFaced = playerBalls.filter(b => b.is_legal_delivery && b.extras_type !== 'wide').length;
    const fours = playerBalls.filter(b => b.runs_off_bat === 4).length;
    const sixes = playerBalls.filter(b => b.runs_off_bat === 6).length;
    const strikeRate = ballsFaced > 0 ? (runs / ballsFaced) * 100 : 0;
    const dismissal = balls.find(b => b.is_wicket && b.dismissed_player_id === playerId);
    return { runs, ballsFaced, fours, sixes, strikeRate, dismissal };
  };

  const calculateBowlerStats = (balls: any[], bowlerId: string) => {
    const bowlerBalls = balls.filter(b => b.bowler_id === bowlerId);
    const legalBalls = bowlerBalls.filter(b => b.is_legal_delivery).length;
    const overs = Math.floor(legalBalls / 6) + (legalBalls % 6) / 10;
    const runs = bowlerBalls.reduce((sum, b) => {
      if (b.extras_type === 'bye' || b.extras_type === 'legbye') return sum;
      return sum + (b.runs_off_bat || 0) + (b.extras_runs || 0);
    }, 0);
    const wickets = bowlerBalls.filter(b => b.is_wicket && b.dismissal_type !== 'run_out').length;
    const maidens = 0;
    const economy = legalBalls > 0 ? (runs / legalBalls) * 6 : 0;
    return { overs, runs, wickets, maidens, economy };
  };

  const getCurrentPlayers = (innings: any, balls: any[]) => {
    if (!innings || innings.status !== 'in_progress' || balls.length === 0) return null;
    const lastBall = balls[balls.length - 1];
    const dismissedBatters = balls.filter(b => b.is_wicket && b.dismissed_player_id).map(b => b.dismissed_player_id);
    const battersInInnings = Array.from(new Set(balls.map(b => b.striker_id)))
      .filter(id => !dismissedBatters.includes(id))
      .map(id => {
        const ball = balls.find(b => b.striker_id === id);
        return { id, name: ball?.striker?.full_name, lastBall: balls.filter(b => b.striker_id === id).slice(-1)[0] };
      })
      .sort((a, b) => (b.lastBall?.created_at || 0) - (a.lastBall?.created_at || 0))
      .slice(0, 2);
    const currentBowler = { id: lastBall.bowler_id, name: lastBall.bowler?.full_name };
    return {
      batsmen: battersInInnings.map(b => ({ ...b, stats: calculateBatsmanStats(balls, b.id) })),
      bowler: { ...currentBowler, stats: calculateBowlerStats(balls, currentBowler.id) }
    };
  };

  const getBatsmenInOrder = (balls: any[]) => {
    const seen = new Set();
    const batsmen: any[] = [];
    balls.forEach(ball => {
      if (!seen.has(ball.striker_id)) {
        seen.add(ball.striker_id);
        batsmen.push({ id: ball.striker_id, name: ball.striker?.full_name, stats: calculateBatsmanStats(balls, ball.striker_id) });
      }
    });
    return batsmen;
  };

  const getBowlersInOrder = (balls: any[]) => {
    const seen = new Set();
    const bowlers: any[] = [];
    balls.forEach(ball => {
      if (!seen.has(ball.bowler_id)) {
        seen.add(ball.bowler_id);
        bowlers.push({ id: ball.bowler_id, name: ball.bowler?.full_name, stats: calculateBowlerStats(balls, ball.bowler_id) });
      }
    });
    return bowlers;
  };

  const calculateExtras = (balls: any[]) => {
    const wides = balls.filter(b => b.extras_type === 'wide').reduce((sum, b) => sum + (b.extras_runs || 0), 0);
    const noBalls = balls.filter(b => b.extras_type === 'noball').reduce((sum, b) => sum + (b.extras_runs || 0), 0);
    const byes = balls.filter(b => b.extras_type === 'bye').reduce((sum, b) => sum + (b.extras_runs || 0), 0);
    const legByes = balls.filter(b => b.extras_type === 'legbye').reduce((sum, b) => sum + (b.extras_runs || 0), 0);
    const total = wides + noBalls + byes + legByes;
    return { wides, noBalls, byes, legByes, total };
  };

  const isLoading = matchLoading || statsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto max-w-5xl space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Match not found</h1>
            <Link to="/fixtures">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Fixtures
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const inningsList = inningsData || [];
  const battingByInnings = (id: string) => (battingInningsV2 || []).filter((b: any) => b.innings_id === id);
  const bowlingByInnings = (id: string) => (bowlingInningsV2 || []).filter((b: any) => b.innings_id === id);

  const homeInnings = inningsList.find((i: any) => i.batting_team_id === match.home_team_id);
  const awayInnings = inningsList.find((i: any) => i.batting_team_id === match.away_team_id);

  // Separate stats by team
  const homeTeamStats = playerStats?.filter((s) => s.player?.team_id === match.home_team_id) || [];
  const awayTeamStats = playerStats?.filter((s) => s.player?.team_id === match.away_team_id) || [];

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "-";
    return ((runs / balls) * 100).toFixed(1);
  };

  const calculateEconomy = (runs: number, overs: number) => {
    return calculateCricketEconomy(runs, overs);
  };

  const formatDismissal = (stat: PlayerStat) => {
    if (!stat.dismissal_type || stat.dismissal_type === "not_out") {
      return <span className="text-emerald-500 font-medium">not out</span>;
    }

    const bowlerName = stat.bowler?.full_name || "";
    const fielderName = stat.fielder?.full_name || "";
    const runoutByName = stat.runout_by?.full_name || "";
    
    switch (stat.dismissal_type) {
      case "caught":
        // Format: c fielder b bowler
        if (fielderName && bowlerName) {
          return (
            <span className="text-muted-foreground text-xs">
              c {fielderName} b {bowlerName}
            </span>
          );
        } else if (bowlerName) {
          return (
            <span className="text-muted-foreground text-xs">
              c & b {bowlerName}
            </span>
          );
        }
        return (
          <span className="text-muted-foreground text-xs">
            caught
          </span>
        );
      case "bowled":
        // Format: b bowler
        return (
          <span className="text-muted-foreground text-xs">
            {bowlerName ? `b ${bowlerName}` : "bowled"}
          </span>
        );
      case "lbw":
        // Format: lbw bowler
        return (
          <span className="text-muted-foreground text-xs">
            {bowlerName ? `lbw ${bowlerName}` : "lbw"}
          </span>
        );
      case "runout":
        // Format: run out (fielder)
        return (
          <span className="text-muted-foreground text-xs">
            {runoutByName ? `run out (${runoutByName})` : "run out"}
          </span>
        );
      case "stumped":
        // Format: st fielder b bowler
        if (fielderName && bowlerName) {
          return (
            <span className="text-muted-foreground text-xs">
              st {fielderName} b {bowlerName}
            </span>
          );
        }
        return (
          <span className="text-muted-foreground text-xs">
            {fielderName ? `st ${fielderName}` : "stumped"}
          </span>
        );
      case "mankad":
        return (
          <span className="text-muted-foreground text-xs">
            {bowlerName ? `mankad ${bowlerName}` : "mankad"}
          </span>
        );
      case "retired_hurt":
        return (
          <span className="text-amber-500 text-xs">
            retired hurt
          </span>
        );
      case "other":
        return (
          <span className="text-muted-foreground text-xs">
            {stat.dismissal_other_text || "out"}
          </span>
        );
      default:
        return null;
    }
  };

  const oversToDecimal = (oversVal?: number | null) => {
    if (oversVal === null || oversVal === undefined || Number.isNaN(oversVal)) return 0;
    const whole = Math.floor(oversVal);
    const balls = Math.round((oversVal - whole) * 10);
    return whole + balls / 6;
  };

  // Get total runs, wickets for each team
  const getTeamTotals = (stats: PlayerStat[]) => {
    const totalRuns = stats.reduce((sum, s) => sum + s.runs_scored, 0);
    const totalWickets = stats.reduce((sum, s) => sum + s.wickets, 0);
    const totalCatches = stats.reduce((sum, s) => sum + s.catches, 0);
    const totalStumpings = stats.reduce((sum, s) => sum + s.stumpings, 0);
    const totalRunOuts = stats.reduce((sum, s) => sum + s.run_outs, 0);
    return { totalRuns, totalWickets, totalCatches, totalStumpings, totalRunOuts };
  };

  const renderLiveScorecard = () => {
    if (!(match.status === 'live' && liveInnings && liveInnings.length > 0 && allLiveBalls)) return null;

    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 px-6 py-4 border-b border-border">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-500 animate-pulse" />
            Live Scorecard
          </h2>
        </div>

        <div className="p-6">
          {liveInnings.map((innings) => {
            if (innings.status !== 'in_progress') return null;

            const balls = getInningsBalls(innings.id);
            const currentPlayers = getCurrentPlayers(innings, balls);
            const inningsTotals = inningsList.find((i: any) => i.id === innings.id);
            const oversDecimal = oversToDecimal(inningsTotals?.total_overs);
            const runRate = oversDecimal > 0 ? (inningsTotals?.total_runs || 0) / oversDecimal : 0;
            const battingTeam = innings.batting_team_id === match.home_team_id ? match.home_team : match.away_team;
            const bowlingTeam = innings.batting_team_id === match.home_team_id ? match.away_team : match.home_team;

            if (!currentPlayers || balls.length === 0) return null;

            return (
              <div key={innings.id} className="space-y-6">
                {innings.innings_number === 2 && liveInnings.length > 0 && (
                  <div className="p-6 bg-muted/40 rounded-lg border border-border">
                    {(() => {
                      const firstInnings = liveInnings[0];
                      const target = (firstInnings.total_runs || 0) + 1;
                      const oversLimit = match?.overs_per_side || 20;
                      const oversVal = inningsTotals?.total_overs || 0;
                      const ballsBowled = Math.floor(oversVal) * 6 + Math.round((oversVal % 1) * 10);
                      const totalBalls = oversLimit * 6;
                      const remainingBalls = Math.max(totalBalls - ballsBowled, 0);
                      const runsNeeded = target - (inningsTotals?.total_runs || 0);
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="font-semibold">Target: {target} runs</div>
                          <div className="font-semibold">Runs Needed: <span className="text-green-600 font-bold">{runsNeeded > 0 ? runsNeeded : 'Won!'}</span></div>
                          <div className="font-semibold">Remaining Balls: {remainingBalls}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Innings Snapshot */}
                <div className="bg-muted/40 rounded-xl p-5 border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {battingTeam.logo_url && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                          style={{ backgroundColor: battingTeam.primary_color || '#1e3a8a' }}
                        >
                          <img src={battingTeam.logo_url} alt={battingTeam.name} className="w-6 h-6 object-contain" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground">Innings {innings.innings_number}</div>
                        <div className="text-lg font-semibold">{battingTeam.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{inningsTotals?.total_runs}/{inningsTotals?.total_wickets}</div>
                      <div className="text-sm text-muted-foreground">
                        {inningsTotals?.total_overs?.toFixed?.(1) || inningsTotals?.total_overs} ov • RR {runRate.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Batsmen */}
                <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-5 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    {battingTeam.logo_url && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: battingTeam.primary_color || '#1e3a8a' }}
                      >
                        <img src={battingTeam.logo_url} alt={battingTeam.name} className="w-6 h-6 object-contain" />
                      </div>
                    )}
                    <h4 className="text-base font-bold text-green-600 dark:text-green-400">{battingTeam.short_name} Batting</h4>
                  </div>
                  <div className="space-y-3">
                    {currentPlayers.batsmen.map((batsman, idx) => (
                      <div
                        key={batsman.id}
                        className="flex items-center justify-between bg-background/50 backdrop-blur px-4 py-3 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {batsman.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {batsman.name}
                              {idx === 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                                >
                                  on strike
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {batsman.stats.fours} fours • {batsman.stats.sixes} sixes • SR: {batsman.stats.strikeRate.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{batsman.stats.runs}</div>
                          <div className="text-sm text-muted-foreground">({batsman.stats.ballsFaced})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Bowler */}
                <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-5 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    {bowlingTeam.logo_url && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: bowlingTeam.primary_color || '#dc2626' }}
                      >
                        <img src={bowlingTeam.logo_url} alt={bowlingTeam.name} className="w-6 h-6 object-contain" />
                      </div>
                    )}
                    <h4 className="text-base font-bold text-blue-600 dark:text-blue-400">{bowlingTeam.short_name} Bowling</h4>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 backdrop-blur px-4 py-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {currentPlayers.bowler.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{currentPlayers.bowler.name}</div>
                        <div className="text-xs text-muted-foreground">Economy: {currentPlayers.bowler.stats.economy.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {currentPlayers.bowler.stats.wickets}/{currentPlayers.bowler.stats.runs}
                      </div>
                      <div className="text-sm text-muted-foreground">({currentPlayers.bowler.stats.overs.toFixed(1)} ov)</div>
                    </div>
                  </div>
                </div>

                {/* Recent Balls */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Recent Balls
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {balls.slice(-12).reverse().map((ball, idx) => {
                      const totalRuns = ball.runs_batter + ball.runs_extras;
                      let bgColor = 'bg-muted';
                      let textColor = 'text-foreground';

                      if (ball.wicket_type) {
                        bgColor = 'bg-red-500';
                        textColor = 'text-white';
                      } else if (totalRuns === 6) {
                        bgColor = 'bg-green-500';
                        textColor = 'text-white';
                      } else if (totalRuns === 4) {
                        bgColor = 'bg-green-500';
                        textColor = 'text-white';
                      }

                      return (
                        <div
                          key={`${ball.id}-${idx}`}
                          className={`min-w-[48px] h-12 rounded-lg flex items-center justify-center font-bold text-base ${bgColor} ${textColor} shadow-md border border-white/10`}
                        >
                          {ball.wicket_type ? 'W' : totalRuns}
                          {ball.extras_type && !ball.wicket_type && <span className="text-xs ml-0.5">*</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Innings Tabs */}
        <div className="border-t border-border">
          <Tabs defaultValue="innings1" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
              {(liveInnings || inningsData || []).map((inning, idx) => (
                <TabsTrigger
                  key={inning.id}
                  value={`innings${idx + 1}`}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-8 py-4 font-semibold"
                >
                  {idx === 0 ? '1st' : '2nd'} Innings
                </TabsTrigger>
              ))}
            </TabsList>

            {(liveInnings || inningsData || []).map((inning, inningIdx) => {
              const inningBalls = getInningsBalls(inning.id);
              if (inningBalls.length === 0) return null;

              const batsmen = getBatsmenInOrder(inningBalls);
              const bowlers = getBowlersInOrder(inningBalls);
              const extras = calculateExtras(inningBalls);
              const inningBattingTeam = inning.batting_team_id === match.home_team_id ? match.home_team : match.away_team;
              const inningBowlingTeam = inning.batting_team_id === match.home_team_id ? match.away_team : match.home_team;

              return (
                <TabsContent key={inning.id} value={`innings${inningIdx + 1}`} className="space-y-6 p-6">
                  {inningIdx === 1 && liveInnings.length > 0 && (
                    <div className="p-6 bg-muted/40 rounded-lg border border-border">
                      {(() => {
                        const firstInnings = liveInnings[0];
                        const target = (firstInnings.total_runs || 0) + 1;
                        const oversLimit = match?.overs_per_side || 20;
                        const oversValue = inning.total_overs || 0;
                        const ballsBowled = Math.floor(oversValue) * 6 + Math.round((oversValue % 1) * 10);
                        const totalBalls = oversLimit * 6;
                        const remainingBalls = Math.max(totalBalls - ballsBowled, 0);
                        const runsNeeded = target - (inning.total_runs || 0);
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="font-semibold">Target: {target} runs</div>
                            <div className="font-semibold">Runs Needed: <span className="text-green-600 font-bold">{runsNeeded > 0 ? runsNeeded : 'Won!'}</span></div>
                            <div className="font-semibold">Remaining Balls: {remainingBalls}</div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                    {/* Innings Header with Target for 2nd Inning */}
                    <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">
                          {inningBattingTeam?.name} vs {inningBowlingTeam?.name}
                          {inningIdx === 1 && ` (2nd Innings)`}
                        </h3>
                        {inningIdx === 1 && liveInnings.length > 0 && (
                          <div className="text-right">
                            {(() => {
                              const firstInnings = liveInnings[0];
                              const target = (firstInnings.total_runs || 0) + 1;
                              const oversLimit = match?.overs_per_side || 20;
                              const ballsBowled = Math.floor((inning.total_overs || 0) * 6) + ((inning.total_overs || 0) % 1) * 10;
                              const totalBalls = oversLimit * 6;
                              const remainingBalls = totalBalls - ballsBowled;
                              const runsNeeded = target - (inning.total_runs || 0);
                              return (
                                <div className="space-y-1 text-sm">
                                  <div><span className="font-semibold">Target:</span> {target} runs</div>
                                  <div><span className="font-semibold">Runs Needed:</span> <span className="text-green-600 font-bold">{runsNeeded > 0 ? runsNeeded : 'Won!'}</span></div>
                                  <div><span className="font-semibold">Remaining Balls:</span> {remainingBalls}</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                  {/* Batting Scorecard */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      {inningBattingTeam && inningBattingTeam.logo_url && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                          style={{ backgroundColor: inningBattingTeam.primary_color || '#1e3a8a' }}
                        >
                          <img
                            src={inningBattingTeam.logo_url}
                            alt={inningBattingTeam.name}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                      )}
                      <h4 className="font-bold text-lg">{inningBattingTeam?.name} Batting</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="grid grid-cols-7 gap-2 font-semibold text-muted-foreground border-b pb-2">
                        <div className="col-span-2">Batsman</div>
                        <div className="text-center">R</div>
                        <div className="text-center">B</div>
                        <div className="text-center">4s</div>
                        <div className="text-center">6s</div>
                        <div className="text-center">S/R</div>
                      </div>
                      {batsmen.map((batsman) => (
                        <div key={batsman.id} className="border-b border-border/50 py-2">
                          <div className="grid grid-cols-7 gap-2">
                            <div className="col-span-2 font-medium">
                              {batsman.name}
                              {!batsman.stats.dismissal && inning.status === 'in_progress' && (
                                <span className="text-green-500 ml-1">*</span>
                              )}
                            </div>
                            <div className="text-center">{batsman.stats.runs}</div>
                            <div className="text-center text-muted-foreground">{batsman.stats.ballsFaced}</div>
                            <div className="text-center text-muted-foreground">{batsman.stats.fours}</div>
                            <div className="text-center text-muted-foreground">{batsman.stats.sixes}</div>
                            <div className="text-center text-muted-foreground">{batsman.stats.strikeRate.toFixed(1)}</div>
                          </div>
                          {batsman.stats.dismissal && (
                            <div className="text-xs text-muted-foreground mt-1 ml-2">
                              {formatDismissal(batsman.stats.dismissal)}
                            </div>
                          )}
                          {!batsman.stats.dismissal && inning.status !== 'in_progress' && (
                            <div className="text-xs text-green-500 mt-1 ml-2">not out</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extras and Total */}
                  <div className="text-sm space-y-2 border-t pt-4">
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Extras</span>
                      <span className="text-muted-foreground">
                        {extras.total} (wd {extras.wides}, nb {extras.noBalls}, b {extras.byes}, lb {extras.legByes})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-t font-bold text-base">
                      <span>Total</span>
                      <span>
                        {inning.total_runs}/{inning.wickets} - {inning.overs_float?.toFixed(1)} Overs
                      </span>
                    </div>
                  </div>

                  {/* Bowling Scorecard */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      {inningBowlingTeam && inningBowlingTeam.logo_url && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                          style={{ backgroundColor: inningBowlingTeam.primary_color || '#dc2626' }}
                        >
                          <img
                            src={inningBowlingTeam.logo_url}
                            alt={inningBowlingTeam.name}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                      )}
                      <h4 className="font-bold text-lg">{inningBowlingTeam?.name} Bowling</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="grid grid-cols-6 gap-2 font-semibold text-muted-foreground border-b pb-2">
                        <div className="col-span-2">Bowler</div>
                        <div className="text-center">O</div>
                        <div className="text-center">R</div>
                        <div className="text-center">W</div>
                        <div className="text-center">Econ</div>
                      </div>
                      {bowlers.map((bowler) => (
                        <div key={bowler.id} className="grid grid-cols-6 gap-2 py-2 border-b border-border/50">
                          <div className="col-span-2 font-medium">{bowler.name}</div>
                          <div className="text-center">{bowler.stats.overs.toFixed(1)}</div>
                          <div className="text-center">{bowler.stats.runs}</div>
                          <div className="text-center">{bowler.stats.wickets}</div>
                          <div className="text-center text-muted-foreground">{bowler.stats.economy.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Back Button */}
          <Link to="/fixtures" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Fixtures
          </Link>

          {/* Match Header - Cricket Style */}
          <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
            {/* Match Info Bar */}
            <div className="bg-primary/10 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-primary border-primary">Match {match.match_number}</Badge>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatLocalTime(match.match_date, "EEEE, MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {match.venue}
                </span>
              </div>
              {match.status === 'live' && (
                <Badge variant="default" className="bg-green-600 text-white">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>

            {/* Teams & Score */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Home Team */}
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-lg"
                    style={{ backgroundColor: match.home_team?.primary_color || "#1e3a8a" }}
                  >
                    {match.home_team?.logo_url ? (
                      <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-16 h-16 object-contain" />
                    ) : (
                      match.home_team?.short_name?.substring(0, 2)
                    )}
                  </div>
                  <h2 className="font-display text-xl tracking-wide">{match.home_team?.name}</h2>
                  <div className="mt-2">
                    {homeInnings ? (
                      <>
                        <span className="text-3xl font-bold text-green-500">
                          {homeInnings.total_runs}/{homeInnings.total_wickets}
                        </span>
                        {homeInnings.total_overs && (
                          <span className="text-muted-foreground ml-2">({homeInnings.total_overs?.toFixed?.(1) || homeInnings.total_overs} ov)</span>
                        )}
                        {match.status === 'live' && homeInnings.status === 'in_progress' && (
                          <Badge variant="outline" className="ml-2 text-xs">Batting</Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-primary">{match.home_team_score || "-"}</span>
                        {match.home_team_overs && (
                          <span className="text-muted-foreground ml-2">({match.home_team_overs} ov)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* VS / Result */}
                <div className="text-center py-4">
                  <div className="text-2xl font-display text-muted-foreground mb-2">VS</div>
                  {match.winner && (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Trophy className="w-5 h-5" />
                      <span className="font-medium">{match.winner.short_name} Won</span>
                    </div>
                  )}
                  {match.toss_winner && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Toss: {match.toss_winner.short_name} ({match.toss_decision})
                    </p>
                  )}
                </div>

                {/* Away Team */}
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-lg"
                    style={{ backgroundColor: match.away_team?.primary_color || "#dc2626" }}
                  >
                    {match.away_team?.logo_url ? (
                      <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-16 h-16 object-contain" />
                    ) : (
                      match.away_team?.short_name?.substring(0, 2)
                    )}
                  </div>
                  <h2 className="font-display text-xl tracking-wide">{match.away_team?.name}</h2>
                  <div className="mt-2">
                    {awayInnings ? (
                      <>
                        <span className="text-3xl font-bold text-green-500">
                          {awayInnings.total_runs}/{awayInnings.total_wickets}
                        </span>
                        {awayInnings.total_overs && (
                          <span className="text-muted-foreground ml-2">({awayInnings.total_overs?.toFixed?.(1) || awayInnings.total_overs} ov)</span>
                        )}
                        {match.status === 'live' && awayInnings.status === 'in_progress' && (
                          <Badge variant="outline" className="ml-2 text-xs">Batting</Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-primary">{match.away_team_score || "-"}</span>
                        {match.away_team_overs && (
                          <span className="text-muted-foreground ml-2">({match.away_team_overs} ov)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Live chase info where match result normally shows */}
              {match.status === 'live' && liveInnings?.length > 1 && liveInnings[1]?.status === 'in_progress' && (
                <div className="text-center mt-6 pt-4 border-t border-border">
                  {(() => {
                    const first = liveInnings[0];
                    const second = liveInnings[1];
                    const target = (first?.total_runs || 0) + 1;
                    const oversLimit = match?.overs_per_side || 20;
                    const oversVal = second?.total_overs || 0;
                    const ballsBowled = Math.floor(oversVal) * 6 + Math.round((oversVal % 1) * 10);
                    const totalBalls = oversLimit * 6;
                    const remainingBalls = Math.max(totalBalls - ballsBowled, 0);
                    const runsNeeded = target - (second?.total_runs || 0);
                    return (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground">Target: {target} runs</div>
                        <div className="font-semibold text-foreground">
                          Runs Needed: <span className="text-green-600 font-bold">{runsNeeded > 0 ? runsNeeded : 'Won!'}</span>
                        </div>
                        <div className="font-semibold text-foreground">Remaining Balls: {remainingBalls}</div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Match Summary */}
              {match.match_summary && (
                <div className="text-center mt-6 pt-4 border-t border-border">
                  <p className="text-muted-foreground">{match.match_summary}</p>
                </div>
              )}
            </div>

            {/* Man of the Match */}
            {match.man_of_match && (
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 px-6 py-4 border-t border-border">
                <div className="flex items-center justify-center gap-3">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Player of the Match</p>
                    <p className="font-display text-lg text-yellow-500">{match.man_of_match.full_name}</p>
                  </div>
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            )}

            {/* Other Awards */}
            {matchAwards && matchAwards.length > 0 && (
              <div className="px-6 py-4 border-t border-border">
                <div className="flex flex-wrap justify-center gap-4">
                  {matchAwards.map((award: any) => (
                    <div key={award.id} className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full">
                      <Trophy className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-xs text-muted-foreground">{award.award_type?.name}: </span>
                        <span className="font-medium">{award.player?.full_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {match.status === 'completed' && (match as any).scorecard_pdf_url && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="bg-primary/10 px-6 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">Official Scorecard (PDF)</h3>
                <a
                  className="text-sm text-primary hover:underline"
                  href={(match as any).scorecard_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </div>
              <div className="p-4">
                <object data={(match as any).scorecard_pdf_url} type="application/pdf" className="w-full h-[80vh] rounded">
                  <iframe src={(match as any).scorecard_pdf_url} className="w-full h-[80vh] rounded" />
                </object>
              </div>
            </div>
          )}

          <>
            {/* Detailed Live Scorecard */}
            {renderLiveScorecard()}

            {/* Scorecard Tabs */}
            {playerStats && playerStats.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <Tabs defaultValue="home" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                    <TabsTrigger 
                      value="home" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                    >
                      {match.home_team?.short_name}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="away"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                    >
                      {match.away_team?.short_name}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="home" className="mt-0">
                    <TeamScorecard 
                      stats={homeTeamStats} 
                      teamName={match.home_team?.name || ""} 
                      score={match.home_team_score}
                      overs={match.home_team_overs}
                      calculateStrikeRate={calculateStrikeRate}
                      calculateEconomy={calculateEconomy}
                      formatDismissal={formatDismissal}
                    />
                    </TabsContent>

                    <TabsContent value="away" className="mt-0">
                      <TeamScorecard 
                        stats={awayTeamStats} 
                        teamName={match.away_team?.name || ""} 
                        score={match.away_team_score}
                        overs={match.away_team_overs}
                        calculateStrikeRate={calculateStrikeRate}
                        calculateEconomy={calculateEconomy}
                        formatDismissal={formatDismissal}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </>
        </div>
      </div>
    </Layout>
  );
};

// Team Scorecard Component
function TeamScorecard({ 
  stats, 
  teamName, 
  score, 
  overs,
  calculateStrikeRate,
  calculateEconomy,
  formatDismissal
}: { 
  stats: PlayerStat[];
  teamName: string;
  score: string | null;
  overs: string | null;
  calculateStrikeRate: (runs: number, balls: number) => string;
  calculateEconomy: (runs: number, overs: number) => string;
  formatDismissal: (stat: PlayerStat) => React.ReactNode;
}) {
  // Separate batters and bowlers
  const batters = stats.filter((s) => s.balls_faced > 0 || s.runs_scored > 0);
  const bowlers = stats.filter((s) => Number(s.overs_bowled) > 0);
  const fielders = stats.filter((s) => s.catches > 0 || s.stumpings > 0 || s.run_outs > 0);

  const totalRuns = batters.reduce((sum, s) => sum + s.runs_scored, 0);
  const totalBalls = batters.reduce((sum, s) => sum + s.balls_faced, 0);
  const totalFours = batters.reduce((sum, s) => sum + s.fours, 0);
  const totalSixes = batters.reduce((sum, s) => sum + s.sixes, 0);

  return (
    <div className="divide-y divide-border">
      {/* Batting Card */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Batting</h3>
          {score && (
            <div className="text-right">
              <span className="text-xl font-bold text-primary">{score}</span>
              {overs && <span className="text-muted-foreground ml-1">({overs} ov)</span>}
            </div>
          )}
        </div>
        
        {batters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Batter</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">R</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">B</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">4s</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">6s</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">SR</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((stat) => (
                  <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">
                      <div className="flex flex-col">
                        <span>{stat.player?.full_name}</span>
                        <span className="text-xs text-muted-foreground">{formatDismissal(stat)}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">{stat.runs_scored}</td>
                    <td className="text-center py-3 px-2">{stat.balls_faced}</td>
                    <td className="text-center py-3 px-2">{stat.fours}</td>
                    <td className="text-center py-3 px-2">{stat.sixes}</td>
                    <td className="text-center py-3 px-2 text-muted-foreground">{calculateStrikeRate(stat.runs_scored, stat.balls_faced)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-3 px-2">Total</td>
                  <td className="text-center py-3 px-2">{totalRuns}</td>
                  <td className="text-center py-3 px-2">{totalBalls}</td>
                  <td className="text-center py-3 px-2">{totalFours}</td>
                  <td className="text-center py-3 px-2">{totalSixes}</td>
                  <td className="text-center py-3 px-2 text-muted-foreground">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No batting data available</p>
        )}
      </div>

      {/* Bowling Card */}
      <div className="p-4">
        <h3 className="font-display text-lg mb-4">Bowling</h3>
        
        {bowlers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Bowler</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">O</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">M</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">R</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">W</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Econ</th>
                </tr>
              </thead>
              <tbody>
                {bowlers.map((stat) => (
                  <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{stat.player?.full_name}</td>
                    <td className="text-center py-3 px-2">{stat.overs_bowled}</td>
                    <td className="text-center py-3 px-2">{stat.maidens}</td>
                    <td className="text-center py-3 px-2">{stat.runs_conceded}</td>
                    <td className="text-center py-3 px-2 font-bold">{stat.wickets}</td>
                    <td className="text-center py-3 px-2 text-muted-foreground">{calculateEconomy(stat.runs_conceded, Number(stat.overs_bowled))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No bowling data available</p>
        )}
      </div>

      {/* Fielding Card */}
      {fielders.length > 0 && (
        <div className="p-4">
          <h3 className="font-display text-lg mb-4">Fielding</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Player</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Catches</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Stumpings</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Run Outs</th>
                </tr>
              </thead>
              <tbody>
                {fielders.map((stat) => (
                  <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{stat.player?.full_name}</td>
                    <td className="text-center py-3 px-2">{stat.catches}</td>
                    <td className="text-center py-3 px-2">{stat.stumpings}</td>
                    <td className="text-center py-3 px-2">{stat.run_outs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchScorecard;
