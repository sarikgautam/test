import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock } from "lucide-react";
import { formatAESTShort } from "@/lib/utils";

const Fixtures = () => {
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
                <div key={match.id} className="bg-card rounded-xl border border-border overflow-hidden card-hover">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Match {match.match_number}</span>
                        {getStatusBadge(match.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatAESTShort(match.match_date, "MMM d, yyyy")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatAESTShort(match.match_date, "h:mm a")} AEST</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{match.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-6">
                      <div className="flex-1 text-center">
                        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center font-bold mb-2" style={{ backgroundColor: match.home_team?.primary_color || "#1e3a8a" }}>
                          {match.home_team?.short_name?.substring(0, 2)}
                        </div>
                        <p className="font-medium">{match.home_team?.name}</p>
                        {match.home_team_score && <p className="text-xl font-bold text-primary mt-1">{match.home_team_score}</p>}
                      </div>
                      <div className="text-3xl font-display text-muted-foreground">VS</div>
                      <div className="flex-1 text-center">
                        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center font-bold mb-2" style={{ backgroundColor: match.away_team?.primary_color || "#dc2626" }}>
                          {match.away_team?.short_name?.substring(0, 2)}
                        </div>
                        <p className="font-medium">{match.away_team?.name}</p>
                        {match.away_team_score && <p className="text-xl font-bold text-primary mt-1">{match.away_team_score}</p>}
                      </div>
                    </div>
                    {match.winner && <p className="text-center mt-4 text-sm text-emerald-400">Winner: {match.winner.name}</p>}
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
