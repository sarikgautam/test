import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

const Teams = () => {
  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: players } = useQuery({
    queryKey: ["players-by-team"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").eq("auction_status", "sold");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">
              GCNPL <span className="text-gradient-gold">Teams</span>
            </h1>
            <p className="text-muted-foreground">Meet the six franchises competing for glory</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : teams && teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => {
                const teamPlayers = players?.filter((p) => p.team_id === team.id) || [];
                return (
                  <div key={team.id} className="bg-card rounded-xl border border-border overflow-hidden card-hover">
                    <div className="h-2" style={{ background: `linear-gradient(90deg, ${team.primary_color}, ${team.secondary_color})` }} />
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: team.primary_color }}>
                          {team.short_name?.substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-display text-xl">{team.name}</h3>
                          <p className="text-sm text-muted-foreground">{team.short_name}</p>
                        </div>
                      </div>
                      {team.owner_name && <p className="text-sm text-muted-foreground mb-2">Owner: {team.owner_name}</p>}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground"><Users className="w-4 h-4 inline mr-1" />{teamPlayers.length} Players</span>
                        <span className="text-sm text-primary font-medium">Budget: ${Number(team.remaining_budget).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Teams will be announced soon</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Teams;
