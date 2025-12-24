import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, ChevronRight, Trophy } from "lucide-react";
import { formatLocalTime } from "@/lib/utils";

const Fixtures = () => {
  const navigate = useNavigate();
  
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), winner:teams!matches_winner_team_id_fkey(*)`)
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: "bg-blue-500/20 text-blue-400",
      live: "bg-emerald-500/20 text-emerald-400 animate-pulse",
      completed: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive/20 text-destructive",
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}>{status.toUpperCase()}</span>;
  };

  const handleMatchClick = (matchId: string, status: string) => {
    if (status === "completed") {
      navigate(`/fixtures/${matchId}`);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">Match <span className="text-gradient-gold">Fixtures</span></h1>
            <p className="text-muted-foreground">Complete schedule for GCNPL Season 2025</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : matches && matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <div 
                  key={match.id} 
                  className={`bg-card rounded-xl border border-border overflow-hidden card-hover ${match.status === "completed" ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`}
                  onClick={() => handleMatchClick(match.id, match.status)}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Match {match.match_number}</span>
                        {(match as any).overs_per_side && (
                          <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {(match as any).overs_per_side} Overs
                          </span>
                        )}
                        {getStatusBadge(match.status)}
                        {match.status === "completed" && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ChevronRight className="w-4 h-4" />
                            View Scorecard
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatLocalTime(match.match_date, "MMM d, yyyy")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatLocalTime(match.match_date, "h:mm a")}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{match.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-6">
                      {/* Home Team */}
                      <div className="flex-1 text-center">
                        <div 
                          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center font-bold mb-2 shadow-lg overflow-hidden" 
                          style={{ backgroundColor: match.home_team?.primary_color || "#1e3a8a" }}
                        >
                          {match.home_team?.logo_url ? (
                            <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-12 h-12 object-contain" />
                          ) : (
                            <span className="text-lg">{match.home_team?.short_name?.substring(0, 2)}</span>
                          )}
                        </div>
                        <p className="font-medium">{match.home_team?.name}</p>
                        {match.home_team_score && (
                          <div className="mt-1">
                            <span className="text-xl font-bold text-primary">{match.home_team_score}</span>
                            {match.home_team_overs && <span className="text-sm text-muted-foreground ml-1">({match.home_team_overs} ov)</span>}
                          </div>
                        )}
                      </div>

                      <div className="text-3xl font-display text-muted-foreground">VS</div>

                      {/* Away Team */}
                      <div className="flex-1 text-center">
                        <div 
                          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center font-bold mb-2 shadow-lg overflow-hidden" 
                          style={{ backgroundColor: match.away_team?.primary_color || "#dc2626" }}
                        >
                          {match.away_team?.logo_url ? (
                            <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-12 h-12 object-contain" />
                          ) : (
                            <span className="text-lg">{match.away_team?.short_name?.substring(0, 2)}</span>
                          )}
                        </div>
                        <p className="font-medium">{match.away_team?.name}</p>
                        {match.away_team_score && (
                          <div className="mt-1">
                            <span className="text-xl font-bold text-primary">{match.away_team_score}</span>
                            {match.away_team_overs && <span className="text-sm text-muted-foreground ml-1">({match.away_team_overs} ov)</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {match.winner && (
                      <div className="text-center mt-4">
                        <span className="inline-flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                          <Trophy className="w-4 h-4" />
                          {match.winner.name} Won
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Fixtures will be announced soon</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Fixtures;
