import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Activity, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  full_name: string;
}

interface Match {
  id: string;
  match_number: number;
  venue: string;
  status: string;
  overs_per_side: number;
  home_team_id: string;
  away_team_id: string;
  season_id: string | null;
  home_team: { id: string; name: string; logo_url: string | null };
  away_team: { id: string; name: string; logo_url: string | null };
}

interface Innings {
  id: string;
  innings_number: number;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  extras_wides: number;
  extras_noballs: number;
  extras_byes: number;
  extras_legbyes: number;
  is_completed: boolean;
}

export default function LiveScoring() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [multipleLiveNotice, setMultipleLiveNotice] = useState(false);
  
  // Toss
  const [showTossDialog, setShowTossDialog] = useState(false);
  const [tossWinner, setTossWinner] = useState("");
  const [electedTo, setElectedTo] = useState<'bat' | 'field'>('bat');
  
  // Innings
  const [currentInnings, setCurrentInnings] = useState<Innings | null>(null);
  const [battingPlayers, setBattingPlayers] = useState<Player[]>([]);
  const [bowlingPlayers, setBowlingPlayers] = useState<Player[]>([]);
  
  // Current players
  const [striker, setStriker] = useState<Player | null>(null);
  const [nonStriker, setNonStriker] = useState<Player | null>(null);
  const [bowler, setBowler] = useState<Player | null>(null);
  const [ballCount, setBallCount] = useState(0);
  const [overNumber, setOverNumber] = useState(0);
  const [scoringStarted, setScoringStarted] = useState(false);
  
  // Wicket
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [dismissalType, setDismissalType] = useState('bowled');
  const [fielder, setFielder] = useState<Player | null>(null);
  
  // Stats
  const [battingStats, setBattingStats] = useState<any[]>([]);
  const [bowlingStats, setBowlingStats] = useState<any[]>([]);
  const [recentBalls, setRecentBalls] = useState<any[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('id, match_number, venue, status, overs_per_side, season_id, home_team_id, away_team_id, home_team:home_team_id(id, name, logo_url), away_team:away_team_id(id, name, logo_url)')
        .order('match_date', { ascending: true });
      
      if (error) throw error;
      console.log('All matches:', data);
      
      // Filter to upcoming or live matches
      const filteredMatches = data?.filter(m => ['upcoming', 'live'].includes(m.status)) || [];
      console.log('Filtered matches (upcoming/live):', filteredMatches);
      setMatches(filteredMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast({ title: "Error", description: "Failed to load matches", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async (teamId: string, seasonId: string | null, isBatting: boolean) => {
    try {
      let query = supabase
        .from('player_season_registrations')
        .select('players(id, full_name)')
        .eq('team_id', teamId)
        .eq('registration_status', 'approved');

      // Filter by season if available
      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      const players = data?.map((r: any) => r.players) || [];
      isBatting ? setBattingPlayers(players) : setBowlingPlayers(players);
      console.log(`Loaded ${players.length} players for team (season: ${seasonId || 'all'})`);
      return players as Player[];
    } catch (error) {
      console.error('Error loading players:', error);
      toast({ title: "Error", description: "Failed to load players", variant: "destructive" });
      return [];
    }
  };

  const loadRecentBalls = async (inningsId: string) => {
    const { data, error } = await supabase
      .from('balls')
      .select('over_number, ball_number, runs_off_bat, extras_type, extras_runs, total_runs, is_wicket, is_legal_delivery, created_at')
      .eq('innings_id', inningsId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setRecentBalls(data);
    }
  };

  const handleStartMatch = (match: Match) => {
    console.log("Starting match:", match.id);
    setSelectedMatch(match);
    setTossWinner("");
    setElectedTo("bat");
    setShowTossDialog(true);
  };

  const handleTossComplete = async () => {
    if (!tossWinner || !selectedMatch) {
      toast({ title: "Error", description: "Select toss winner and choice", variant: "destructive" });
      return;
    }
    
    try {
      console.log("Saving toss...");
      await supabase
        .from('match_toss')
        .upsert(
          {
            match_id: selectedMatch.id,
            toss_won_by: tossWinner,
            elected_to: electedTo
          },
          { onConflict: 'match_id' }
        );

      await supabase.from('matches').update({ status: 'live' }).eq('id', selectedMatch.id);

      const battingTeamId = electedTo === 'bat' ? tossWinner : 
        (tossWinner === selectedMatch.home_team_id ? selectedMatch.away_team_id : selectedMatch.home_team_id);
      const bowlingTeamId = battingTeamId === selectedMatch.home_team_id ? selectedMatch.away_team_id : selectedMatch.home_team_id;

      console.log("Ensuring innings exists for team:", battingTeamId);
      const { data: existingInnings, error: fetchInningsError } = await supabase
        .from('match_innings')
        .select('*')
        .eq('match_id', selectedMatch.id)
        .eq('innings_number', 1)
        .maybeSingle();

      if (fetchInningsError) throw fetchInningsError;

      let inningsRow = existingInnings;

      if (!inningsRow) {
        const { data, error } = await supabase
          .from('match_innings')
          .upsert(
            {
              match_id: selectedMatch.id,
              innings_number: 1,
              batting_team_id: battingTeamId,
              bowling_team_id: bowlingTeamId
            },
            { onConflict: 'match_id, innings_number' }
          )
          .select()
          .single();

        if (error) throw error;
        inningsRow = data;
      }

      setCurrentInnings(inningsRow);
      setShowTossDialog(false);
      await loadPlayers(battingTeamId, selectedMatch.season_id, true);
      await loadPlayers(bowlingTeamId, selectedMatch.season_id, false);
      toast({ title: "Match Started", description: "Select opening batsmen and bowler" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to start match", variant: "destructive" });
    }
  };

  const startScoring = () => {
    if (!striker || !nonStriker || !bowler) {
      toast({ title: "Error", description: "Select all players", variant: "destructive" });
      return;
    }
    setScoringStarted(true);
    loadStats();
  };

  const loadStats = async () => {
    if (!currentInnings) return;
    const { data: batting } = await supabase
      .from('batting_innings')
      .select('*, players(full_name)')
      .eq('innings_id', currentInnings.id);
    
    const { data: bowling } = await supabase
      .from('bowling_innings')
      .select('*, players(full_name)')
      .eq('innings_id', currentInnings.id);
    
    setBattingStats(batting || []);
    setBowlingStats(bowling || []);
  };

  const recordBall = async (runsOffBat: number, extrasType: string | null = null, extrasRuns: number = 0) => {
    if (!currentInnings || !striker || !nonStriker || !bowler) return;

    const isLegal = extrasType !== 'wide' && extrasType !== 'noball';
    const totalRuns = runsOffBat + extrasRuns;
    const willCompleteOver = isLegal && (ballCount + 1 === 6);

    try {
      await supabase.from('balls').insert({
        innings_id: currentInnings.id,
        over_number: overNumber,
        ball_number: ballCount + 1,
        striker_id: striker.id,
        non_striker_id: nonStriker.id,
        bowler_id: bowler.id,
        runs_off_bat: runsOffBat,
        extras_type: extrasType,
        extras_runs: extrasRuns,
        total_runs: totalRuns,
        is_legal_delivery: isLegal,
        is_boundary: runsOffBat === 4 || runsOffBat === 6,
        boundary_type: runsOffBat === 4 ? 'four' : runsOffBat === 6 ? 'six' : null,
        is_wicket: false
      });

      if (isLegal) {
        const newBallCount = ballCount + 1;
        if (newBallCount === 6) {
          setOverNumber(overNumber + 1);
          setBallCount(0);
          setBowler(null);
          setScoringStarted(false);
          toast({ title: "Over Complete", description: `${overNumber + 1} overs done` });
        } else {
          setBallCount(newBallCount);
        }
        // Swap strike on odd runs except when last ball of the over with 1 run (keep strike per custom rule)
        if (totalRuns % 2 === 1 && !(willCompleteOver && totalRuns === 1)) {
          const temp = striker;
          setStriker(nonStriker);
          setNonStriker(temp);
        }
      }

      await recomputeInningsData();
      await loadInnings();
      await loadStats();
      await loadRecentBalls(currentInnings.id);
      await syncScoresToMatch();
      await ensureInningsProgression();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to record ball", variant: "destructive" });
    }
  };

  const recomputeInningsData = async (activeInnings?: Innings | null) => {
    const inningsRef = activeInnings || currentInnings;
    if (!inningsRef) return;
    const { data: ballsData, error: ballsError } = await supabase
      .from('balls')
      .select('striker_id, bowler_id, runs_off_bat, extras_type, extras_runs, total_runs, is_wicket, dismissal_type, dismissed_player_id, is_legal_delivery')
      .eq('innings_id', inningsRef.id)
      .order('created_at', { ascending: true });

    if (ballsError) {
      console.error('Error fetching balls for recompute:', ballsError);
      return;
    }

    const balls = ballsData || [];

    const legalDeliveries = balls.filter(b => b.is_legal_delivery).length;
    const overNum = Math.floor(legalDeliveries / 6);
    const ballNum = legalDeliveries % 6;
    const totalRuns = balls.reduce((sum, b) => sum + (b.total_runs || 0), 0);
    const extrasTotal = balls.reduce((sum, b) => sum + (b.extras_runs || 0), 0);
    const extrasWides = balls.reduce((sum, b) => sum + (b.extras_type === 'wide' ? b.extras_runs || 0 : 0), 0);
    const extrasNoBalls = balls.reduce((sum, b) => sum + (b.extras_type === 'noball' ? 1 : 0), 0);
    const extrasByes = balls.reduce((sum, b) => sum + (b.extras_type === 'bye' ? b.extras_runs || 0 : 0), 0);
    const extrasLegByes = balls.reduce((sum, b) => sum + (b.extras_type === 'legbye' ? b.extras_runs || 0 : 0), 0);
    const wickets = balls.filter(b => b.is_wicket).length;

    await supabase
      .from('match_innings')
      .update({
        total_runs: totalRuns,
        total_wickets: wickets,
        total_overs: parseFloat(`${overNum}.${ballNum}`),
        extras_total: extrasTotal,
        extras_wides: extrasWides,
        extras_noballs: extrasNoBalls,
        extras_byes: extrasByes,
        extras_legbyes: extrasLegByes,
        updated_at: new Date().toISOString()
      })
      .eq('id', inningsRef.id);

    // Recompute batting stats
    const battingMap: Record<string, { runs: number; balls: number; fours: number; sixes: number }> = {};
    const outBatsmen = new Set<string>();
    balls.forEach(b => {
      const batterId = b.striker_id;
      if (!battingMap[batterId]) battingMap[batterId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      battingMap[batterId].runs += b.runs_off_bat || 0;
      if (b.is_legal_delivery) battingMap[batterId].balls += 1;
      if (b.runs_off_bat === 4) battingMap[batterId].fours += 1;
      if (b.runs_off_bat === 6) battingMap[batterId].sixes += 1;
      if (b.is_wicket) {
        if (b.dismissed_player_id) outBatsmen.add(b.dismissed_player_id);
        else if (batterId) outBatsmen.add(batterId);
      }
    });

    await supabase.from('batting_innings').delete().eq('innings_id', inningsRef.id);
    const battingRows = Object.entries(battingMap).map(([batsman_id, stats]) => ({
      innings_id: inningsRef.id,
      batsman_id,
      runs_scored: stats.runs,
      balls_faced: stats.balls,
      fours: stats.fours,
      sixes: stats.sixes,
      strike_rate: stats.balls > 0 ? (stats.runs / stats.balls) * 100 : 0,
      is_out: outBatsmen.has(batsman_id),
      position: 1
    }));
    if (battingRows.length) {
      await supabase.from('batting_innings').insert(battingRows);
    }

    // Recompute bowling stats
    const bowlingMap: Record<string, { balls: number; runs: number; wickets: number; wides: number; noballs: number }> = {};
    balls.forEach(b => {
      const bowlerId = b.bowler_id;
      if (!bowlingMap[bowlerId]) bowlingMap[bowlerId] = { balls: 0, runs: 0, wickets: 0, wides: 0, noballs: 0 };
      if (b.is_legal_delivery) bowlingMap[bowlerId].balls += 1;
      bowlingMap[bowlerId].runs += b.total_runs || 0;
      if (b.is_wicket && b.dismissal_type !== 'run_out') bowlingMap[bowlerId].wickets += 1;
      if (b.extras_type === 'wide') bowlingMap[bowlerId].wides += 1;
      if (b.extras_type === 'noball') bowlingMap[bowlerId].noballs += 1;
    });

    await supabase.from('bowling_innings').delete().eq('innings_id', inningsRef.id);
    const bowlingRows = Object.entries(bowlingMap).map(([bowler_id, stats]) => {
      const oversDecimal = `${Math.floor(stats.balls / 6)}.${stats.balls % 6}`;
      const oversFloat = Math.floor(stats.balls / 6) + (stats.balls % 6) / 10;
      const economy = stats.balls > 0 ? stats.runs / (stats.balls / 6) : 0;
      return {
        innings_id: inningsRef.id,
        bowler_id,
        overs_bowled: parseFloat(oversDecimal),
        maidens: 0,
        runs_conceded: stats.runs,
        wickets: stats.wickets,
        wides: stats.wides,
        noballs: stats.noballs,
        economy_rate: economy
      };
    });
    if (bowlingRows.length) {
      await supabase.from('bowling_innings').insert(bowlingRows);
    }

    setBallCount(ballNum);
    setOverNumber(overNum);
    await loadRecentBalls(inningsRef.id);
    await syncScoresToMatch();
    await ensureInningsProgression();
  };

  const syncScoresToMatch = async () => {
    if (!selectedMatch) return;

    // Get all innings for this match
    const { data: innings } = await supabase
      .from('match_innings')
      .select('*')
      .eq('match_id', selectedMatch.id)
      .order('innings_number', { ascending: true });

    if (!innings || innings.length === 0) return;

    // Format scores as "runs/wickets" and overs
    const homeTeamInnings = innings.find(i => i.batting_team_id === selectedMatch.home_team_id);
    const awayTeamInnings = innings.find(i => i.batting_team_id === selectedMatch.away_team_id);

    const homeScore = homeTeamInnings 
      ? `${homeTeamInnings.total_runs}/${homeTeamInnings.total_wickets}`
      : null;
    
    const awayScore = awayTeamInnings 
      ? `${awayTeamInnings.total_runs}/${awayTeamInnings.total_wickets}`
      : null;

    const homeOvers = homeTeamInnings?.total_overs?.toString() || null;
    const awayOvers = awayTeamInnings?.total_overs?.toString() || null;

    // Update matches table with current scores and overs
    await supabase
      .from('matches')
      .update({
        home_team_score: homeScore,
        away_team_score: awayScore,
        home_team_overs: homeOvers,
        away_team_overs: awayOvers
      })
      .eq('id', selectedMatch.id);
  };

  const finishMatch = async (winnerTeamId: string | null, summary: string) => {
    await supabase
      .from('matches')
      .update({ status: 'completed', winner_team_id: winnerTeamId, match_summary: summary })
      .eq('id', selectedMatch!.id);
    toast({ title: "Match Completed", description: summary });
  };

    const getTeamName = (teamId?: string | null) => {
      if (!teamId || !selectedMatch) return 'Team';
      if (teamId === selectedMatch.home_team_id) return selectedMatch.home_team.name;
      if (teamId === selectedMatch.away_team_id) return selectedMatch.away_team.name;
      return 'Team';
    };

  const ensureInningsProgression = async () => {
    if (!currentInnings || !selectedMatch) return;

    // Refresh latest innings totals
    const { data: latestInnings, error } = await supabase
      .from('match_innings')
      .select('*')
      .eq('id', currentInnings.id)
      .maybeSingle();

    if (error || !latestInnings) return;

    // Check chase before completion so second innings can end early when target is reached
    const { data: inningsList } = await supabase
      .from('match_innings')
      .select('*')
      .eq('match_id', selectedMatch.id)
      .order('innings_number', { ascending: true });

    const wickets = latestInnings.total_wickets || 0;
    const oversLimit = selectedMatch.overs_per_side || 20;
    const oversVal = latestInnings.total_overs || 0;
    const oversDone = oversVal;
    const latestNumber = latestInnings.innings_number || 1;

    const first = inningsList?.find(i => i.innings_number === 1);
    const second = inningsList?.find(i => i.innings_number === 2) || (latestNumber === 2 ? latestInnings : null);
    const firstRuns = first?.total_runs || 0;
    const secondRuns = second?.total_runs || 0;
    const target = firstRuns + 1;

    if (latestNumber === 2 && target > 0 && secondRuns >= target) {
      const wicketsRemaining = 10 - (latestInnings.total_wickets || 0);
      const winnerTeamId = latestInnings.batting_team_id;
      await finishMatch(winnerTeamId, `${getTeamName(winnerTeamId)} won by ${wicketsRemaining} wickets`);
      return;
    }

    const inningsComplete = wickets >= 10 || oversDone >= oversLimit || latestInnings.is_completed === true;
    if (!inningsComplete) return;

    // Mark current innings completed
    await supabase
      .from('match_innings')
      .update({ is_completed: true })
      .eq('id', latestInnings.id);

    const completedInnings = (inningsList || []).filter(i => i.is_completed === true);

    if (latestNumber >= 2) {
      if (secondRuns >= target) {
        const wicketsRemaining = 10 - (latestInnings.total_wickets || 0);
        await finishMatch(latestInnings.batting_team_id, `${getTeamName(latestInnings.batting_team_id)} won by ${wicketsRemaining} wickets`);
        return;
      }

      if (secondRuns < target) {
        const winnerTeamId = first?.batting_team_id || null;
        const runMargin = target - 1 - secondRuns;
        await finishMatch(winnerTeamId, `${getTeamName(winnerTeamId)} won by ${runMargin} runs`);
        return;
      }
    }

    if (latestNumber >= 2 || completedInnings.length >= 2) {
      await finishMatch(null, "Match tied");
      return;
    }

    // Prepare next innings number
    const nextInningsNumber = latestNumber + 1;

    // Ensure next innings exists
    const { data: existing, error: fetchNextErr } = await supabase
      .from('match_innings')
      .select('*')
      .eq('match_id', selectedMatch.id)
      .eq('innings_number', nextInningsNumber)
      .maybeSingle();

    if (fetchNextErr) return;

    let nextInnings = existing as Innings | null;
    if (!nextInnings) {
      const { data: inserted, error: insertErr } = await supabase
        .from('match_innings')
        .insert({
          match_id: selectedMatch.id,
          innings_number: nextInningsNumber,
          batting_team_id: latestInnings.bowling_team_id,
          bowling_team_id: latestInnings.batting_team_id,
          is_completed: false
        })
        .select()
        .single();

      if (insertErr) return;
      nextInnings = inserted as unknown as Innings;
    }

    // Reset state for second innings
    setCurrentInnings(nextInnings);
    setStriker(null);
    setNonStriker(null);
    setBowler(null);
    setBallCount(0);
    setOverNumber(0);
    setScoringStarted(false);
    await loadPlayers(nextInnings.batting_team_id, selectedMatch?.season_id || null, true);
    await loadPlayers(nextInnings.bowling_team_id, selectedMatch?.season_id || null, false);
    toast({ title: "Innings Complete", description: "Second innings ready. Select openers and bowler." });
  };

  const handleUndoLastBall = async () => {
    if (!currentInnings) return;
    try {
      const { data: lastBall, error: lastError } = await supabase
        .from('balls')
        .select('*')
        .eq('innings_id', currentInnings.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastError || !lastBall) {
        toast({ title: "Nothing to undo", description: "No deliveries recorded yet" });
        return;
      }

      await supabase.from('balls').delete().eq('id', lastBall.id);
      await recomputeInningsData();
      await loadInnings();
      await loadStats();
      await loadRecentBalls(currentInnings.id);
      await syncScoresToMatch();
      await ensureInningsProgression();
      toast({ title: "Last ball undone", description: "Scores recalculated" });
    } catch (error) {
      console.error('Undo error:', error);
      toast({ title: "Error", description: "Failed to undo last ball", variant: "destructive" });
    }
  };

  const handleEndInningsEarly = async () => {
    if (!currentInnings) return;
    await recomputeInningsData();
    await supabase.from('match_innings').update({ is_completed: true }).eq('id', currentInnings.id);
    await syncScoresToMatch();
    await ensureInningsProgression();
    toast({ title: "Innings ended", description: "Innings closed manually" });
  };

  const loadInnings = async () => {
    if (!currentInnings) return;
    const { data } = await supabase.from('match_innings').select('*').eq('id', currentInnings.id).single();
    if (data) setCurrentInnings(data);
  };

  // Rehydrate state after reload so we don't lose progress
  const hydrateMatchState = async (match: Match) => {
    try {
      setSelectedMatch(match);

      // Grab the current innings (latest by innings_number)
      const { data: innings, error: inningsError } = await supabase
        .from('match_innings')
        .select('*')
        .eq('match_id', match.id)
        .order('innings_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inningsError || !innings) {
        toast({ title: "No innings", description: "Live innings not found for this match" });
        return;
      }

      setCurrentInnings(innings as Innings);

      // Load player lists for batting/bowling sides (capture for lookup)
      const battingList = await loadPlayers(innings.batting_team_id, selectedMatch?.season_id || null, true);
      const bowlingList = await loadPlayers(innings.bowling_team_id, selectedMatch?.season_id || null, false);

      // Recompute totals/overs and derive ball/over counts
      await recomputeInningsData(innings as Innings);
      await loadRecentBalls(innings.id);

      // Derive current striker/non-striker/bowler from ball log
      const { data: balls } = await supabase
        .from('balls')
        .select('*')
        .eq('innings_id', innings.id)
        .order('created_at', { ascending: true });

      if (!balls || balls.length === 0) {
        setScoringStarted(false);
        setBallCount(0);
        setOverNumber(0);
        return;
      }

      const deriveStateFromBalls = (ballEvents: any[]) => {
        let strikerId = ballEvents[0]?.striker_id || null;
        let nonStrikerId = ballEvents[0]?.non_striker_id || null;
        let bowlerId = ballEvents[0]?.bowler_id || null;
        let localBallCount = 0;
        let localOver = 0;

        ballEvents.forEach((b) => {
          const isLegal = b.is_legal_delivery;
          const totalRuns = b.total_runs || 0;
          const willCompleteOver = isLegal && (localBallCount + 1 === 6);

          // Apply strike swap rule
          if (totalRuns % 2 === 1 && !(willCompleteOver && totalRuns === 1)) {
            const temp = strikerId;
            strikerId = nonStrikerId;
            nonStrikerId = temp;
          }

          if (isLegal) {
            const newCount = localBallCount + 1;
            if (newCount === 6) {
              localOver += 1;
              localBallCount = 0;
              bowlerId = null; // force new bowler selection after an over
            } else {
              localBallCount = newCount;
              if (b.bowler_id) bowlerId = b.bowler_id;
            }
          } else {
            // Illegal deliveries keep same ball count but still track bowler
            if (b.bowler_id) bowlerId = b.bowler_id;
          }

          // If wicket, pause play to pick new batter
          if (b.is_wicket) {
            strikerId = null;
          }
        });

        return { strikerId, nonStrikerId, bowlerId, localBallCount, localOver, lastBall: ballEvents[ballEvents.length - 1] };
      };

      const { strikerId, nonStrikerId, bowlerId, localBallCount, localOver, lastBall } = deriveStateFromBalls(balls);

      // Resolve player objects from loaded lists
      const findPlayer = (id: string | null) =>
        (battingList.concat(bowlingList)).find(p => p.id === id) || null;

      setBallCount(localBallCount);
      setOverNumber(localOver);
      setStriker(findPlayer(strikerId));
      setNonStriker(findPlayer(nonStrikerId));
      setBowler(findPlayer(bowlerId));

      // If last ball was a wicket or over ended without bowler, require selections again
      const needNewSelections = lastBall?.is_wicket || !findPlayer(strikerId) || !findPlayer(nonStrikerId) || !findPlayer(bowlerId);
      setScoringStarted(!needNewSelections);
    } catch (err) {
      console.error('Failed to resume live session:', err);
    }
  };

  useEffect(() => {
    const resumeLiveSession = async () => {
      try {
        const { data: liveMatches, error: liveError } = await supabase
          .from('matches')
          .select('*, home_team:home_team_id(id, name, logo_url), away_team:away_team_id(id, name, logo_url)')
          .eq('status', 'live')
          .order('match_date', { ascending: false });

        if (liveError || !liveMatches || liveMatches.length === 0) return; // nothing live to resume

        if (liveMatches.length === 1) {
          await hydrateMatchState(liveMatches[0] as Match);
        } else {
          setMultipleLiveNotice(true);
        }
      } catch (err) {
        console.error('Failed to resume live session:', err);
      }
    };

    resumeLiveSession();
  }, []);

  const handleResumeMatch = async (match: Match) => {
    await hydrateMatchState(match);
  };

  const handleWicket = async () => {
    if (!currentInnings || !striker || !bowler) return;

    try {
      await supabase.from('balls').insert({
        innings_id: currentInnings.id,
        over_number: overNumber,
        ball_number: ballCount + 1,
        striker_id: striker.id,
        non_striker_id: nonStriker!.id,
        bowler_id: bowler.id,
        runs_off_bat: 0,
        total_runs: 0,
        is_legal_delivery: true,
        is_wicket: true,
        dismissal_type: dismissalType,
        dismissed_player_id: striker.id,
        fielder_id: fielder?.id
      });

      await supabase.from('fall_of_wickets').insert({
        innings_id: currentInnings.id,
        wicket_number: currentInnings.total_wickets + 1,
        runs_at_fall: currentInnings.total_runs,
        overs_at_fall: overNumber + (ballCount / 10),
        batsman_out_id: striker.id,
        dismissal_type: dismissalType,
        bowler_id: dismissalType !== 'run_out' ? bowler.id : null,
        fielder_id: fielder?.id
      });

      await supabase.from('batting_innings')
        .update({ is_out: true, dismissal_type: dismissalType })
        .eq('innings_id', currentInnings.id)
        .eq('batsman_id', striker.id);

      const newBallCount = ballCount + 1;
      if (newBallCount === 6) {
        setOverNumber(overNumber + 1);
        setBallCount(0);
        setBowler(null);
      } else {
        setBallCount(newBallCount);
      }

      setStriker(null);
      setShowWicketDialog(false);
      setScoringStarted(false);
      await recomputeInningsData();
      await loadInnings();
      await loadStats();
      await loadRecentBalls(currentInnings.id);
      await syncScoresToMatch();
      await ensureInningsProgression();
      toast({ title: "Wicket!", description: "Select new batsman" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to record wicket", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (currentInnings?.id) {
      loadRecentBalls(currentInnings.id);
    }
  }, [currentInnings?.id]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Player Selection
  if (selectedMatch && currentInnings && !scoringStarted) {
    const availableBatters = battingPlayers.filter(p => !battingStats.some((s: any) => s.batsman_id === p.id && s.is_out));

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-2xl mx-auto">
          <Button onClick={() => { setSelectedMatch(null); setCurrentInnings(null); }} variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Select Players - Innings {currentInnings.innings_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-400 mb-2 block">Striker</Label>
                <Select value={striker?.id || ""} onValueChange={(id) => setStriker(availableBatters.find(p => p.id === id) || null)}>
                  <SelectTrigger><SelectValue placeholder="Select striker" /></SelectTrigger>
                  <SelectContent>
                    {availableBatters.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-400 mb-2 block">Non-Striker</Label>
                <Select value={nonStriker?.id || ""} onValueChange={(id) => setNonStriker(availableBatters.find(p => p.id === id) || null)}>
                  <SelectTrigger><SelectValue placeholder="Select non-striker" /></SelectTrigger>
                  <SelectContent>
                    {availableBatters.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-400 mb-2 block">Bowler</Label>
                <Select value={bowler?.id || ""} onValueChange={(id) => setBowler(bowlingPlayers.find(p => p.id === id) || null)}>
                  <SelectTrigger><SelectValue placeholder="Select bowler" /></SelectTrigger>
                  <SelectContent>
                    {bowlingPlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={startScoring} className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                Start Scoring
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Live Scoring
  if (selectedMatch && currentInnings && scoringStarted) {
    const battingTeam = selectedMatch.home_team_id === currentInnings.batting_team_id ? selectedMatch.home_team : selectedMatch.away_team;
    const getBattingStat = (playerId?: string) => battingStats.find(s => s.batsman_id === playerId);
    const getBowlingStat = (playerId?: string) => bowlingStats.find(s => s.bowler_id === playerId);
    const strikerStat = getBattingStat(striker?.id);
    const nonStrikerStat = getBattingStat(nonStriker?.id);
    const bowlerStat = getBowlingStat(bowler?.id);

    const latestOver = recentBalls.at(-1)?.over_number;
    const ballsThisOver = recentBalls
      .filter(b => b.over_number === latestOver)
      .sort((a, b) => a.ball_number - b.ball_number)
      .slice(-6);

    const describeBall = (b: any) => {
      if (b.is_wicket) return 'W';
      switch (b.extras_type) {
        case 'wide':
          return `${b.extras_runs || 1}wd`;
        case 'noball':
          return b.runs_off_bat ? `nb+${b.runs_off_bat}` : 'nb';
        case 'bye':
          return `${b.extras_runs || 0}b`;
        case 'legbye':
          return `${b.extras_runs || 0}lb`;
        default:
          return `${b.runs_off_bat || 0}`;
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <AlertDialog open={showWicketDialog} onOpenChange={setShowWicketDialog}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Record Wicket</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">{striker?.full_name} is out</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2 block">Dismissal Type</Label>
                <Select value={dismissalType} onValueChange={setDismissalType}>
                  <SelectTrigger className="bg-slate-800"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bowled">Bowled</SelectItem>
                    <SelectItem value="caught">Caught</SelectItem>
                    <SelectItem value="lbw">LBW</SelectItem>
                    <SelectItem value="run_out">Run Out</SelectItem>
                    <SelectItem value="stumped">Stumped</SelectItem>
                    <SelectItem value="hit_wicket">Hit Wicket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(dismissalType === 'caught' || dismissalType === 'run_out' || dismissalType === 'stumped') && (
                <div>
                  <Label className="text-slate-300 mb-2 block">Fielder</Label>
                  <Select value={fielder?.id || ""} onValueChange={(id) => setFielder(bowlingPlayers.find(p => p.id === id) || null)}>
                    <SelectTrigger className="bg-slate-800"><SelectValue placeholder="Select fielder" /></SelectTrigger>
                    <SelectContent>
                      {bowlingPlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleWicket} className="bg-red-600">Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <Button onClick={() => setScoringStarted(false)} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />Change
            </Button>
            <Badge className="bg-red-500/20 text-red-300 px-4 py-2">
              <Activity className="mr-2 h-4 w-4 animate-pulse" />LIVE
            </Badge>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Innings {currentInnings.innings_number}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 rounded-lg p-4 md:p-6 text-center space-y-2 md:space-y-3">
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    {battingTeam?.logo_url && <img src={battingTeam.logo_url} alt="logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full border border-slate-700 object-contain" />}
                    <div className="text-left">
                      <div className="text-xs md:text-sm text-slate-400">Batting</div>
                      <div className="text-base md:text-lg font-semibold text-white">{battingTeam?.name}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-4xl md:text-5xl font-bold text-white">{currentInnings.total_runs}/{currentInnings.total_wickets}</div>
                    <div className="text-xl md:text-2xl text-slate-400">({currentInnings.total_overs?.toFixed(1) || `${overNumber}.${ballCount}`} ov)</div>
                  </div>
                  <div className="mt-3 md:mt-4 text-xs md:text-sm text-slate-400">
                    Extras: {currentInnings.extras_wides}wd {currentInnings.extras_noballs}nb {currentInnings.extras_byes}b {currentInnings.extras_legbyes}lb
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="bg-emerald-900/30 rounded p-2 md:p-3 border border-emerald-500/30">
                    <p className="text-xs text-emerald-400">STRIKER</p>
                    <p className="font-bold text-white text-sm md:text-base">{striker?.full_name} <span className="text-xs md:text-sm text-emerald-200">{strikerStat?.runs_scored || 0} ({strikerStat?.balls_faced || 0})</span></p>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2 md:p-3">
                    <p className="text-xs text-slate-400">NON-STRIKER</p>
                    <p className="font-bold text-white text-sm md:text-base">{nonStriker?.full_name} <span className="text-xs md:text-sm text-slate-300">{nonStrikerStat?.runs_scored || 0} ({nonStrikerStat?.balls_faced || 0})</span></p>
                  </div>
                  <div className="bg-red-900/30 rounded p-2 md:p-3 border border-red-500/30">
                    <p className="text-xs text-red-400">BOWLER</p>
                    <p className="font-bold text-white text-sm md:text-base">{bowler?.full_name} <span className="text-xs md:text-sm text-red-200">{bowlerStat?.wickets || 0}/{bowlerStat?.runs_conceded || 0}</span></p>
                  </div>
                  <div className="flex gap-1">
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} className={`flex-1 h-8 rounded flex items-center justify-center text-sm font-bold ${
                        i < ballCount ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>{i+1}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Runs</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {[0,1,2,3,4,5,6,7].map(r => (
                    <Button key={r} onClick={() => recordBall(r)} className={`h-16 text-xl font-bold ${
                      r === 4 ? 'bg-blue-600 hover:bg-blue-700' : r === 6 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}>{r}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Extras & Wickets</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => recordBall(0, 'wide', 1)} className="w-full bg-orange-600 hover:bg-orange-700" size="lg">Wide</Button>
                <Button onClick={() => recordBall(0, 'noball', 1)} className="w-full bg-orange-600 hover:bg-orange-700" size="lg">No Ball</Button>
                <Button onClick={() => recordBall(0, 'bye', 1)} className="w-full bg-yellow-600 hover:bg-yellow-700" size="lg">Bye</Button>
                <Button onClick={() => recordBall(0, 'legbye', 1)} className="w-full bg-yellow-600 hover:bg-yellow-700" size="lg">Leg Bye</Button>
                <Button onClick={() => setShowWicketDialog(true)} className="w-full bg-red-600 hover:bg-red-700" size="lg">Wicket</Button>
                <Button onClick={handleEndInningsEarly} variant="destructive" className="w-full" size="lg">End Innings Now</Button>
                <Button onClick={handleUndoLastBall} variant="outline" className="w-full" size="lg">Undo Last Ball</Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Recent Balls</CardTitle>
              <p className="text-slate-400 text-sm">Latest over summary</p>
            </CardHeader>
            <CardContent>
              {ballsThisOver.length === 0 ? (
                <p className="text-slate-400 text-sm">No deliveries yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ballsThisOver.map((b: any, idx: number) => (
                    <div
                      key={`${b.over_number}-${b.ball_number}-${idx}`}
                      className={`px-3 py-2 rounded-md text-sm font-semibold ${b.is_wicket ? 'bg-red-600/30 text-red-200 border border-red-500/40' : 'bg-slate-700 text-white border border-slate-600'}`}
                    >
                      {b.over_number}.{b.ball_number}: {describeBall(b)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Full Timeline</CardTitle>
              <p className="text-slate-400 text-sm">All deliveries this innings</p>
            </CardHeader>
            <CardContent>
              {recentBalls.length === 0 ? (
                <p className="text-slate-400 text-sm">No deliveries yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentBalls.map((b: any, idx: number) => (
                    <div
                      key={`${b.over_number}-${b.ball_number}-${idx}`}
                      className={`px-3 py-2 rounded-md text-sm font-semibold ${b.is_wicket ? 'bg-red-600/30 text-red-200 border border-red-500/40' : 'bg-slate-700 text-white border border-slate-600'}`}
                    >
                      {b.over_number}.{b.ball_number}: {describeBall(b)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="batting" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="batting">Batting</TabsTrigger>
              <TabsTrigger value="bowling">Bowling</TabsTrigger>
            </TabsList>
            <TabsContent value="batting">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-white">Batting Stats</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-2">Batsman</th><th className="pb-2 text-right">R</th><th className="pb-2 text-right">B</th>
                      <th className="pb-2 text-right">4s</th><th className="pb-2 text-right">6s</th><th className="pb-2 text-right">SR</th>
                    </tr></thead>
                    <tbody className="text-white">
                      {battingStats.map(s => (
                        <tr key={s.batsman_id} className="border-b border-slate-700/50">
                          <td className="py-2">{s.players.full_name}</td>
                          <td className="text-right">{s.runs_scored}</td>
                          <td className="text-right">{s.balls_faced}</td>
                          <td className="text-right">{s.fours}</td>
                          <td className="text-right">{s.sixes}</td>
                          <td className="text-right">{s.strike_rate.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bowling">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-white">Bowling Stats</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-2">Bowler</th><th className="pb-2 text-right">O</th><th className="pb-2 text-right">M</th>
                      <th className="pb-2 text-right">R</th><th className="pb-2 text-right">W</th><th className="pb-2 text-right">Econ</th>
                    </tr></thead>
                    <tbody className="text-white">
                      {bowlingStats.map(s => (
                        <tr key={s.bowler_id} className="border-b border-slate-700/50">
                          <td className="py-2">{s.players.full_name}</td>
                          <td className="text-right">{s.overs_bowled.toFixed(1)}</td>
                          <td className="text-right">{s.maidens}</td>
                          <td className="text-right">{s.runs_conceded}</td>
                          <td className="text-right">{s.wickets}</td>
                          <td className="text-right">{s.economy_rate.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Match List
  return (
    <div className="p-6">
      <Dialog open={showTossDialog} onOpenChange={setShowTossDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Match Toss</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-slate-300 mb-3 block">Who won the toss?</Label>
              <RadioGroup value={tossWinner} onValueChange={setTossWinner}>
                <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded">
                  <RadioGroupItem value={selectedMatch?.home_team_id || ""} id="home" />
                  <Label htmlFor="home" className="text-white cursor-pointer flex-1">{selectedMatch?.home_team.name}</Label>
                </div>
                <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded">
                  <RadioGroupItem value={selectedMatch?.away_team_id || ""} id="away" />
                  <Label htmlFor="away" className="text-white cursor-pointer flex-1">{selectedMatch?.away_team.name}</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-slate-300 mb-3 block">Elected to?</Label>
              <RadioGroup value={electedTo} onValueChange={(v) => setElectedTo(v as 'bat' | 'field')}>
                <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded">
                  <RadioGroupItem value="bat" id="bat" />
                  <Label htmlFor="bat" className="text-white cursor-pointer flex-1">Bat First</Label>
                </div>
                <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded">
                  <RadioGroupItem value="field" id="field" />
                  <Label htmlFor="field" className="text-white cursor-pointer flex-1">Bowl First</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowTossDialog(false); setSelectedMatch(null); }} variant="outline">Cancel</Button>
            <Button onClick={handleTossComplete} disabled={!tossWinner} className="bg-emerald-600">Start Match</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-2xl">International Cricket Scoring</CardTitle>
            <p className="text-slate-400">ICC Standards • Ball-by-ball tracking</p>
            {multipleLiveNotice && (
              <p className="text-amber-400 text-sm mt-2">Multiple live matches detected. Click "Continue" on the match you want to resume.</p>
            )}
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {matches.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400 mb-4">No matches found</p>
                <Button onClick={loadMatches} variant="outline">Refresh</Button>
              </CardContent>
            </Card>
          ) : (
            matches.map(m => (
              <Card key={m.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Badge className={m.status === 'live' ? 'bg-red-500/20 text-red-300 mb-2' : 'bg-purple-500/20 text-purple-300 mb-2'}>
                        {m.status === 'live' && <Activity className="mr-1 h-3 w-3 animate-pulse" />}
                        {m.status.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-slate-400 mb-2">Match {m.match_number} • {m.venue}</p>
                      <p className="font-semibold text-white">{m.home_team.name} vs {m.away_team.name}</p>
                    </div>
                    <Button
                      onClick={() => (m.status === 'live' ? handleResumeMatch(m) : handleStartMatch(m))}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {m.status === 'live' ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
