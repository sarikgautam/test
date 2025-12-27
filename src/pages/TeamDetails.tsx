import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Crown, 
  Users, 
  Trophy, 
  Calendar, 
  Target,
  User,
  CheckCircle2,
  XCircle,
  Minus,
  Building2,
  ExternalLink
} from "lucide-react";

interface Owner {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  business_name: string | null;
  business_description: string | null;
  business_logo_url: string | null;
  business_website: string | null;
}

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  owner_name: string | null;
  owner_id: string | null;
  remaining_budget: number;
  budget: number;
  description: string | null;
  captain_id: string | null;
  manager_name: string | null;
}

interface PlayerRegistration {
  jersey_number: number | null;
  sold_price: number | null;
  player: {
    id: string;
    full_name: string;
    photo_url: string | null;
    role: string;
    batting_style: string | null;
    bowling_style: string | null;
  };
}

interface PlayerStats {
  player_id: string;
  runs_scored: number;
  wickets: number;
  matches?: number;
}

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_score: string | null;
  away_team_score: string | null;
  winner_team_id: string | null;
  match_date: string;
  status: string;
  match_number: number;
  venue: string;
  match_stage?: string | null;
  home_team?: { id: string; name: string; short_name: string; primary_color: string; logo_url: string | null };
  away_team?: { id: string; name: string; short_name: string; primary_color: string; logo_url: string | null };
}

const TeamDetails = () => {
  const { teamId } = useParams();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();
      if (error) throw error;
      return data as Team;
    },
    enabled: !!teamId,
  });

  const { data: owner } = useQuery({
    queryKey: ["team-owner", team?.owner_id],
    queryFn: async () => {
      if (!team?.owner_id) return null;
      const { data, error } = await supabase
        .from("owners")
        .select("*")
        .eq("id", team.owner_id)
        .single();
      if (error) throw error;
      return data as Owner;
    },
    enabled: !!team?.owner_id,
  });

  const { data: allTeams } = useQuery({
    queryKey: ["all-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name, short_name, logo_url, primary_color");
      if (error) throw error;
      return data;
    },
  });

  const { data: playerRegistrations } = useQuery({
    queryKey: ["team-players", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(`
          jersey_number,
          sold_price,
          player:players!inner(id, full_name, photo_url, role, batting_style, bowling_style)
        `)
        .eq("team_id", teamId)
        .eq("auction_status", "sold");
      if (error) throw error;
      return data as unknown as PlayerRegistration[];
    },
    enabled: !!teamId,
  });

  const { data: playerStats } = useQuery({
    queryKey: ["team-player-stats", teamId],
    queryFn: async () => {
      if (!playerRegistrations?.length) return [];
      const playerIds = playerRegistrations.map(p => p.player.id);
      const { data, error } = await supabase
        .from("player_stats")
        .select("player_id, runs_scored, wickets")
        .in("player_id", playerIds);
      if (error) throw error;
      return data as PlayerStats[];
    },
    enabled: !!playerRegistrations?.length,
  });

  const { data: matches } = useQuery({
    queryKey: ["team-matches", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_number,
          match_date,
          venue,
          status,
          match_stage,
          home_team_id,
          away_team_id,
          home_team_score,
          away_team_score,
          winner_team_id,
          home_team:teams!matches_home_team_id_fkey(id, name, short_name, primary_color, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, short_name, primary_color, logo_url)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data as Match[];
    },
    enabled: !!teamId,
  });

  const captain = playerRegistrations?.find(p => p.player.id === team?.captain_id);
  
  // Aggregate stats per player
  const aggregatedStats = playerStats?.reduce((acc, stat) => {
    if (!acc[stat.player_id]) {
      acc[stat.player_id] = { runs: 0, wickets: 0, matches: 0 };
    }
    acc[stat.player_id].runs += stat.runs_scored;
    acc[stat.player_id].wickets += stat.wickets;
    acc[stat.player_id].matches += 1;
    return acc;
  }, {} as Record<string, { runs: number; wickets: number; matches: number }>);

  const topRunScorers = playerRegistrations
    ?.map(p => ({
      ...p.player,
      jersey_number: p.jersey_number,
      runs: aggregatedStats?.[p.player.id]?.runs || 0,
      matches: aggregatedStats?.[p.player.id]?.matches || 0,
    }))
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 3);

  const topWicketTakers = playerRegistrations
    ?.map(p => ({
      ...p.player,
      jersey_number: p.jersey_number,
      wickets: aggregatedStats?.[p.player.id]?.wickets || 0,
      matches: aggregatedStats?.[p.player.id]?.matches || 0,
    }))
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 3);

  const completedMatches = matches?.filter(m => m.status === "completed").slice(0, 5) || [];
  const upcomingMatches = matches?.filter(m => m.status === "upcoming").slice(0, 3) || [];

  const getMatchLabel = (match: Match) => {
    if (match.match_stage === 'final') return 'Final';
    if (match.match_stage === 'eliminator') return 'Eliminator';
    if (match.match_stage === 'qualifier') return 'Qualifier';
    if (match.match_stage === 'group') return `Match ${match.match_number}`;
    return `Match ${match.match_number}`;
  };

  const getOpponentTeam = (match: Match) => {
    const opponentId = match.home_team_id === teamId ? match.away_team_id : match.home_team_id;
    return allTeams?.find(t => t.id === opponentId);
  };

  const getMatchResult = (match: Match) => {
    if (match.winner_team_id === teamId) return "win";
    if (match.winner_team_id && match.winner_team_id !== teamId) return "loss";
    return "draw";
  };

  const getMatchResultDescription = (match: Match, isHome: boolean) => {
    const teamScore = isHome ? match.home_team_score : match.away_team_score;
    const opponentScore = isHome ? match.away_team_score : match.home_team_score;
    
    if (!teamScore || !opponentScore) return "";
    
    const teamRuns = parseInt(teamScore.split("/")[0]);
    const opponentRuns = parseInt(opponentScore.split("/")[0]);
    const teamWickets = parseInt(teamScore.split("/")[1]) || 0;
    const opponentWickets = parseInt(opponentScore.split("/")[1]) || 0;
    
    if (match.winner_team_id === teamId) {
      // Team won
      const runsDiff = teamRuns - opponentRuns;
      if (opponentWickets === 10) {
        // Won by runs (opponent all out)
        return `Won by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
      } else {
        // Won by wickets
        const wicketsRemaining = 10 - opponentWickets;
        return `Won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
      }
    } else if (match.winner_team_id && match.winner_team_id !== teamId) {
      // Team lost
      const runsDiff = opponentRuns - teamRuns;
      if (teamWickets === 10) {
        // Lost by runs (team all out)
        return `Lost by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
      } else {
        // Lost by wickets
        const wicketsRemaining = 10 - teamWickets;
        return `Lost by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
      }
    }
    return "Draw";
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "batsman": return "Batsman";
      case "bowler": return "Bowler";
      case "all_rounder": return "All-Rounder";
      case "wicket_keeper": return "Wicket-Keeper";
      default: return role;
    }
  };

  if (teamLoading) {
    return (
      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto">
            <Skeleton className="h-96 rounded-3xl mb-8" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-display mb-4">Team not found</h2>
            <Link to="/teams">
              <Button>Back to Teams</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div 
          className="relative py-16 md:py-24 px-4 overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${team.primary_color}15, ${team.secondary_color}10, transparent)` 
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-10"
              style={{ backgroundColor: team.primary_color }}
            />
            <div 
              className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
              style={{ backgroundColor: team.secondary_color }}
            />
          </div>

          <div className="container mx-auto relative z-10">
            <Link to="/teams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Teams
            </Link>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Team Logo */}
              <div className="relative">
                {team.logo_url ? (
                  <img 
                    src={team.logo_url} 
                    alt={team.name}
                    className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div 
                    className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center text-6xl md:text-8xl font-bold"
                    style={{ 
                      backgroundColor: team.primary_color,
                      color: 'white',
                      boxShadow: `0 25px 50px -12px ${team.primary_color}80`
                    }}
                  >
                    {team.short_name?.substring(0, 2)}
                  </div>
                )}
                <div 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-3/4 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${team.primary_color}, transparent)` }}
                />
              </div>

              {/* Team Info */}
              <div className="flex-1 text-center lg:text-left">
                <Badge 
                  className="mb-4 text-sm"
                  style={{ backgroundColor: `${team.primary_color}20`, color: team.primary_color }}
                >
                  {team.short_name}
                </Badge>
                <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
                  {team.name}
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mb-8">
                  {team.description || "A passionate franchise competing for glory in the GCNPL."}
                </p>

                {/* Team Leadership */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  {captain && (
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border">
                      <Trophy className="w-5 h-5" style={{ color: team.primary_color }} />
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">Captain</p>
                        <p className="font-medium">{captain.player.full_name}</p>
                      </div>
                    </div>
                  )}
                  {team.manager_name && (
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border">
                      <User className="w-5 h-5" style={{ color: team.primary_color }} />
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">Manager</p>
                        <p className="font-medium">{team.manager_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Owner Section */}
            {owner && (
              <div className="mt-12 bg-card rounded-2xl border border-border p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Crown className="w-6 h-6" style={{ color: team.primary_color }} />
                  <h3 className="font-display text-xl">Team Owner</h3>
                </div>
                
                {/* Owner Photo & Info */}
                <div className="flex items-center gap-4 mb-6">
                  {owner.photo_url ? (
                    <img 
                      src={owner.photo_url} 
                      alt={owner.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2"
                      style={{ borderColor: team.primary_color }}
                    />
                  ) : (
                    <div 
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${team.primary_color}20` }}
                    >
                      <User className="w-10 h-10" style={{ color: team.primary_color }} />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-lg">{owner.name}</h4>
                    {owner.description && (
                      <p className="text-sm text-muted-foreground mt-1">{owner.description}</p>
                    )}
                  </div>
                </div>

                {/* Business Info */}
                {owner.business_name && (
                  <div className="border-t border-border pt-6">
                    <div className="flex items-start gap-4">
                      {owner.business_logo_url ? (
                        <img 
                          src={owner.business_logo_url} 
                          alt={owner.business_name}
                          className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg bg-background p-2 border border-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Business</p>
                          <h5 className="font-semibold text-lg">{owner.business_name}</h5>
                        </div>
                        {owner.business_description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{owner.business_description}</p>
                        )}
                        {owner.business_website && (
                          <a 
                            href={owner.business_website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                            style={{ color: team.primary_color }}
                          >
                            Visit Website
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-16">
          {/* Top Performers */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Top Run Scorers */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${team.primary_color}20` }}
                >
                  <Target className="w-5 h-5" style={{ color: team.primary_color }} />
                </div>
                <h3 className="font-display text-xl">Top Run Scorers</h3>
              </div>
              <div className="space-y-4">
                {topRunScorers?.length ? topRunScorers.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl bg-background/50">
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ 
                        backgroundColor: index === 0 ? team.primary_color : `${team.primary_color}40`,
                        color: index === 0 ? 'white' : team.primary_color
                      }}
                    >
                      {index + 1}
                    </span>
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{player.full_name}</p>
                      <p className="text-sm text-muted-foreground">{player.matches} matches</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl" style={{ color: team.primary_color }}>{player.runs}</p>
                      <p className="text-xs text-muted-foreground">runs</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">No stats available yet</p>
                )}
              </div>
            </div>

            {/* Top Wicket Takers */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${team.primary_color}20` }}
                >
                  <Trophy className="w-5 h-5" style={{ color: team.primary_color }} />
                </div>
                <h3 className="font-display text-xl">Top Wicket Takers</h3>
              </div>
              <div className="space-y-4">
                {topWicketTakers?.length ? topWicketTakers.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl bg-background/50">
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ 
                        backgroundColor: index === 0 ? team.primary_color : `${team.primary_color}40`,
                        color: index === 0 ? 'white' : team.primary_color
                      }}
                    >
                      {index + 1}
                    </span>
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{player.full_name}</p>
                      <p className="text-sm text-muted-foreground">{player.matches} matches</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl" style={{ color: team.primary_color }}>{player.wickets}</p>
                      <p className="text-xs text-muted-foreground">wickets</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">No stats available yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Full Squad */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${team.primary_color}20` }}
              >
                <Users className="w-6 h-6" style={{ color: team.primary_color }} />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl">Full Squad</h2>
                <p className="text-muted-foreground">{playerRegistrations?.length || 0} players</p>
              </div>
            </div>

            {playerRegistrations?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {playerRegistrations.map((reg) => {
                  const stats = aggregatedStats?.[reg.player.id];
                  const isCaptain = reg.player.id === team.captain_id;
                  
                  return (
                    <div 
                      key={reg.player.id} 
                      className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-all duration-300"
                    >
                      {isCaptain && (
                        <div 
                          className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                          style={{ backgroundColor: team.primary_color, color: 'white' }}
                        >
                          <Crown className="w-3 h-3" /> Captain
                        </div>
                      )}
                      
                      <div 
                        className="h-2"
                        style={{ background: `linear-gradient(90deg, ${team.primary_color}, ${team.secondary_color})` }}
                      />
                      
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {reg.player.photo_url ? (
                            <img 
                              src={reg.player.photo_url} 
                              alt={reg.player.full_name}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div 
                              className="w-16 h-16 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${team.primary_color}20` }}
                            >
                              <User className="w-8 h-8" style={{ color: team.primary_color }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {reg.jersey_number && (
                                <span 
                                  className="text-xs font-bold px-2 py-0.5 rounded"
                                  style={{ backgroundColor: `${team.primary_color}20`, color: team.primary_color }}
                                >
                                  #{reg.jersey_number}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium truncate mt-1">{reg.player.full_name}</h4>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {getRoleLabel(reg.player.role)}
                            </Badge>
                          </div>
                        </div>

                        {stats && (
                          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                            <div className="text-center">
                              <p className="font-bold" style={{ color: team.primary_color }}>{stats.matches}</p>
                              <p className="text-xs text-muted-foreground">Matches</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold" style={{ color: team.primary_color }}>{stats.runs}</p>
                              <p className="text-xs text-muted-foreground">Runs</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold" style={{ color: team.primary_color }}>{stats.wickets}</p>
                              <p className="text-xs text-muted-foreground">Wickets</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No players in the squad yet</p>
              </div>
            )}
          </div>

          {/* Matches Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upcoming Matches */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${team.primary_color}20` }}
                >
                  <Calendar className="w-5 h-5" style={{ color: team.primary_color }} />
                </div>
                <h3 className="font-display text-xl">Upcoming Matches</h3>

              </div>
              
              {upcomingMatches.length ? (
                <div className="space-y-4">
                  {upcomingMatches.map((match, index) => {
                    const opponent = getOpponentTeam(match);
                    const isHome = match.home_team_id === teamId;
                    const matchDate = new Date(match.match_date);
                    
                    return (
                      <Link 
                        key={match.id}
                        to={`/fixtures`}
                        className="group relative block overflow-hidden rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                      >
                        {/* Top accent */}
                        <div 
                          className="absolute top-0 left-0 right-0 h-1.5 transition-all"
                          style={{ background: `linear-gradient(90deg, ${team.primary_color}, ${team.secondary_color})` }}
                        />
                        
                        <div className="bg-card p-5 md:p-6">
                          <div className="flex items-start justify-between gap-4">
                            {/* Match Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${team.primary_color}20`, color: team.primary_color }}>
                                  Match #{match.match_number}
                                </span>
                                <span className="text-xs text-muted-foreground">{isHome ? '🏠 Home' : '🏃 Away'}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {opponent?.logo_url ? (
                                  <img src={opponent.logo_url} alt={opponent.name} className="w-12 h-12 object-contain flex-shrink-0" />
                                ) : (
                                  <div 
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ backgroundColor: opponent?.primary_color || '#666', color: 'white' }}
                                  >
                                    {opponent?.short_name?.substring(0, 2)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-base md:text-lg">{isHome ? 'vs' : '@'} {opponent?.name}</p>
                                  <p className="text-xs md:text-sm text-muted-foreground">{match.venue}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Date & Time */}
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm md:text-base">
                                {matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-xs md:text-sm" style={{ color: team.primary_color }}>
                                {matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming matches scheduled</p>
                </div>
              )}
            </div>

            {/* Recent Results */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${team.primary_color}20` }}
                >
                  <Trophy className="w-6 h-6" style={{ color: team.primary_color }} />
                </div>
                <div>
                  <h3 className="font-display text-2xl">Last 5 Results</h3>
                  <p className="text-sm text-muted-foreground">{completedMatches.length} completed matches</p>
                </div>
              </div>
              
              {completedMatches.length ? (
                <div className="grid grid-cols-1 gap-6">
                  {completedMatches.map((match, index) => {
                    const isHome = match.home_team_id === teamId;
                    const opponent = isHome ? match.away_team : match.home_team;
                    const result = getMatchResult(match);
                    const resultDescription = getMatchResultDescription(match, isHome);
                    const teamScore = isHome ? match.home_team_score : match.away_team_score;
                    const opponentScore = isHome ? match.away_team_score : match.home_team_score;
                    
                    const resultColor = result === 'win' ? team.primary_color : result === 'loss' ? '#ef4444' : '#8b5cf6';
                    
                    return (
                      <Link
                        key={match.id}
                        to={`/fixtures/${match.id}`}
                        className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover animate-fade-in-up block"
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: resultColor }} />
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: `${resultColor}22`, color: resultColor }}>
                              {getMatchLabel(match)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex-1 text-center">
                              {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className="w-12 h-12 mx-auto rounded-full object-cover mb-1" />
                              ) : (
                                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold text-white mb-1" style={{ backgroundColor: team.primary_color }}>
                                  {team.short_name.substring(0, 2)}
                                </div>
                              )}
                              <p className="text-sm font-medium text-foreground truncate">{team.short_name}</p>
                              <p className="text-xs text-muted-foreground">{teamScore || "-"}</p>
                            </div>

                            <div className="text-lg font-display text-muted-foreground">vs</div>

                            <div className="flex-1 text-center">
                              {opponent?.logo_url ? (
                                <img src={opponent.logo_url} alt={opponent.name} className="w-12 h-12 mx-auto rounded-full object-cover mb-1" />
                              ) : (
                                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold text-white mb-1" style={{ backgroundColor: opponent?.primary_color }}>
                                  {opponent?.short_name?.substring(0, 2) || "TBA"}
                                </div>
                              )}
                              <p className="text-sm font-medium text-foreground truncate">{opponent?.short_name || "TBA"}</p>
                              <p className="text-xs text-muted-foreground">{opponentScore || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: resultColor }}>
                              {result === 'draw' ? (
                                <Minus className="w-4 h-4" />
                              ) : result === 'win' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span>{resultDescription || "Result pending"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Target className="w-3 h-3" />
                              {match.venue}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No completed matches yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeamDetails;
