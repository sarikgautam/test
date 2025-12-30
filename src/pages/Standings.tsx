import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
const Standings = () => {
  // Get active season
  const { data: activeSeason } = useQuery({
    queryKey: ["active-season"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: standings, isLoading, error: standingsError } = useQuery({
    queryKey: ["standings", activeSeason?.id],
    queryFn: async () => {
      console.log("[Standings] Fetching for season:", activeSeason?.id);
      const { data, error } = await supabase
        .from("standings")
        .select(`*, team:teams(*)`)
        .eq("season_id", activeSeason!.id)
        .order("points", { ascending: false })
        .order("net_run_rate", { ascending: false });
      if (error) {
        console.error("[Standings] Query error:", error);
        throw error;
      }
      console.log("[Standings] Fetched data:", data);
      return data;
    },
    enabled: !!activeSeason?.id,
  });

  // Debug log
  if (standingsError) {
    console.error("[Standings] Error:", standingsError);
  }
  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">Points <span className="text-gradient-gold">Table</span></h1>
            <p className="text-muted-foreground text-lg">Current season standings</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-vibrant-cyan/20 border border-primary/40 shadow-lg shadow-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Live Standings</span>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : standings && standings.length > 0 ? (
            <div className="bg-card rounded-xl border border-primary/20 overflow-hidden shadow-lg shadow-primary/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-vibrant-cyan/10">
                      <th className="text-left py-4 px-4 text-xs font-bold text-primary uppercase">Position</th>
                      <th className="text-left py-4 px-4 text-xs font-bold text-primary uppercase">Team</th>
                      <th className="text-center py-4 px-4 text-xs font-bold text-primary uppercase">Played</th>
                      <th className="text-center py-4 px-4 text-xs font-bold text-emerald-500 uppercase">Won</th>
                      <th className="text-center py-4 px-4 text-xs font-bold text-destructive uppercase">Lost</th>
                      <th className="text-center py-4 px-4 text-xs font-bold text-vibrant-purple uppercase">Tied</th>
                      <th className="text-center py-4 px-4 text-xs font-bold text-vibrant-cyan uppercase">NRR</th>
                      <th className="text-center py-4 px-4 text-xs font-bold bg-gradient-to-r from-primary to-vibrant-orange bg-clip-text text-transparent">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr key={s.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors duration-300">
                        <td className="py-4 px-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${i === 0 ? "bg-gradient-to-r from-primary to-vibrant-orange shadow-lg" : i < 3 ? "bg-gradient-to-r from-vibrant-cyan to-vibrant-purple" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                        </td>
                        <td className="py-4 px-4">
                          <Link to={`/teams/${s.team?.id}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
                            {s.team?.logo_url ? (
                              <img 
                                src={s.team.logo_url} 
                                alt={s.team.name} 
                                className="w-10 h-10 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md" 
                                style={{ backgroundColor: s.team?.primary_color || "#1e3a8a" }}
                              >
                                {s.team?.short_name?.substring(0, 2)}
                              </div>
                            )}
                            <span className="font-bold text-primary group-hover:text-vibrant-orange transition-colors">{s.team?.name}</span>
                          </Link>
                        </td>
                        <td className="text-center py-4 px-4 font-semibold">{s.matches_played}</td>
                        <td className="text-center py-4 px-4 font-bold text-emerald-500">{s.wins}</td>
                        <td className="text-center py-4 px-4 font-bold text-destructive">{s.losses}</td>
                        <td className="text-center py-4 px-4">{s.ties}</td>
                        <td className="text-center py-4 px-4 text-muted-foreground">{Number(s.net_run_rate) >= 0 ? "+" : ""}{Number(s.net_run_rate).toFixed(3)}</td>
                        <td className="text-center py-4 px-4"><span className="font-bold text-primary text-lg">{s.points}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Standings will be updated once the tournament begins</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Standings;
