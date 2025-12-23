import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

const Standings = () => {
  const { data: standings, isLoading } = useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("standings").select(`*, team:teams(*)`).order("points", { ascending: false }).order("net_run_rate", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">Points <span className="text-gradient-gold">Table</span></h1>
            <p className="text-muted-foreground">Current tournament standings</p>
          </div>

          {isLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : standings && standings.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">#</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Team</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">P</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">W</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">L</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">T</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">NRR</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-primary text-primary-foreground" : i < 4 ? "bg-secondary" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: s.team?.primary_color || "#1e3a8a" }}>{s.team?.short_name?.substring(0, 2)}</div>
                            <span className="font-medium">{s.team?.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">{s.matches_played}</td>
                        <td className="text-center py-4 px-4 text-emerald-400 font-medium">{s.wins}</td>
                        <td className="text-center py-4 px-4 text-destructive font-medium">{s.losses}</td>
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
