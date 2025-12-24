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
  Minus
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  owner_name: string | null;
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
        .select("*")
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

  const getOpponentTeam = (match: Match) => {
    const opponentId = match.home_team_id === teamId ? match.away_team_id : match.home_team_id;
    return allTeams?.find(t => t.id === opponentId);
  };

  const getMatchResult = (match: Match) => {
    if (match.winner_team_id === teamId) return "win";
    if (match.winner_team_id && match.winner_team_id !== teamId) return "loss";
    return "draw";
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
                  {team.owner_name && (
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border">
                      <Crown className="w-5 h-5" style={{ color: team.primary_color }} />
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">Owner</p>
                        <p className="font-medium">{team.owner_name}</p>
                      </div>
                    </div>
                  )}
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
                <div className="space-y-3">
                  {upcomingMatches.map((match) => {
                    const opponent = getOpponentTeam(match);
                    const isHome = match.home_team_id === teamId;
                    
                    return (
                      <Link 
                        key={match.id}
                        to={`/fixtures`}
                        className="block p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {opponent?.logo_url ? (
                              <img src={opponent.logo_url} alt={opponent.name} className="w-10 h-10 object-contain" />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: opponent?.primary_color || '#666', color: 'white' }}
                              >
                                {opponent?.short_name?.substring(0, 2)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{isHome ? 'vs' : '@'} {opponent?.name}</p>
                              <p className="text-sm text-muted-foreground">Match #{match.match_number}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(match.match_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground">No upcoming matches</p>
                </div>
              )}
            </div>

            {/* Recent Results */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${team.primary_color}20` }}
                >
                  <Trophy className="w-5 h-5" style={{ color: team.primary_color }} />
                </div>
                <h3 className="font-display text-xl">Last 5 Results</h3>
              </div>
              
              {completedMatches.length ? (
                <div className="space-y-3">
                  {completedMatches.map((match) => {
                    const opponent = getOpponentTeam(match);
                    const result = getMatchResult(match);
                    const isHome = match.home_team_id === teamId;
                    const teamScore = isHome ? match.home_team_score : match.away_team_score;
                    const opponentScore = isHome ? match.away_team_score : match.home_team_score;
                    
                    return (
                      <Link 
                        key={match.id}
                        to={`/fixtures`}
                        className="block p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              result === 'win' ? 'bg-green-500/20' : 
                              result === 'loss' ? 'bg-red-500/20' : 'bg-muted/20'
                            }`}
                          >
                            {result === 'win' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : result === 'loss' ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <Minus className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {opponent?.logo_url ? (
                                <img src={opponent.logo_url} alt={opponent.name} className="w-6 h-6 object-contain" />
                              ) : (
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ backgroundColor: opponent?.primary_color || '#666', color: 'white' }}
                                >
                                  {opponent?.short_name?.substring(0, 2)}
                                </div>
                              )}
                              <p className="font-medium">{isHome ? 'vs' : '@'} {opponent?.short_name}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {teamScore} - {opponentScore}
                            </p>
                          </div>
                          
                          <Badge 
                            variant={result === 'win' ? 'default' : result === 'loss' ? 'destructive' : 'secondary'}
                            className="uppercase"
                          >
                            {result}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-card rounded-xl border border-border">
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
