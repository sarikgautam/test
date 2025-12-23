import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

const Stats = () => {
  const { data: players, isLoading } = useQuery({
    queryKey: ["players-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select(`*, team:teams(*)`).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      batsman: "bg-blue-500/20 text-blue-400",
      bowler: "bg-emerald-500/20 text-emerald-400",
      all_rounder: "bg-purple-500/20 text-purple-400",
      wicket_keeper: "bg-amber-500/20 text-amber-400",
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role] || ""}`}>{role.replace("_", " ").toUpperCase()}</span>;
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">Player <span className="text-gradient-gold">Stats</span></h1>
            <p className="text-muted-foreground">View all registered players and their statistics</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : players && players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div key={player.id} className="bg-card rounded-xl border border-border p-5 card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{player.full_name}</h3>
                      {player.team ? (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: player.team.primary_color }} />
                          <span className="text-sm text-muted-foreground">{player.team.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                    {getRoleBadge(player.role)}
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                    <span className="text-muted-foreground">{player.batting_style || "N/A"}</span>
                    <span className={`font-medium ${player.auction_status === "sold" ? "text-emerald-400" : player.auction_status === "unsold" ? "text-destructive" : "text-primary"}`}>
                      {player.auction_status === "sold" ? `$${Number(player.sold_price).toLocaleString()}` : player.auction_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No players registered yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
