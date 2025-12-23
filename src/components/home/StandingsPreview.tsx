import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp } from "lucide-react";

export function StandingsPreview() {
  const { data: standings, isLoading } = useQuery({
    queryKey: ["standings-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standings")
        .select(`
          *,
          team:teams(id, name, short_name, primary_color)
        `)
        .order("points", { ascending: false })
        .order("net_run_rate", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
              Points <span className="text-gradient-gold">Table</span>
            </h2>
            <p className="text-muted-foreground mt-2">Current tournament standings</p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link to="/standings">Full Table</Link>
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : standings && standings.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pos</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
                    <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">P</th>
                    <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">W</th>
                    <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">L</th>
                    <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">NRR</th>
                    <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, index) => (
                    <tr
                      key={standing.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? "bg-primary text-primary-foreground" :
                          index === 1 ? "bg-secondary text-foreground" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: standing.team?.primary_color || "#1e3a8a" }}
                          >
                            {standing.team?.short_name?.substring(0, 2)}
                          </div>
                          <span className="font-medium text-foreground">{standing.team?.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 text-foreground">{standing.matches_played}</td>
                      <td className="text-center py-4 px-4 text-primary font-medium">{standing.wins}</td>
                      <td className="text-center py-4 px-4 text-destructive font-medium">{standing.losses}</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">
                        {Number(standing.net_run_rate) >= 0 ? "+" : ""}
                        {Number(standing.net_run_rate).toFixed(3)}
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="font-bold text-primary text-lg">{standing.points}</span>
                      </td>
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

        <div className="mt-8 sm:hidden text-center">
          <Button variant="outline" asChild>
            <Link to="/standings">View Full Table</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
