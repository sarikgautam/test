import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export function TeamsShowcase() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
            Meet the <span className="text-gradient-gold">Teams</span>
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Six powerhouse teams competing for the championship
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {teams.map((team, index) => (
              <Link
                key={team.id}
                to={`/teams`}
                className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${team.primary_color} 0%, ${team.secondary_color} 100%)`,
                  }}
                />
                <div className="relative p-6 text-center">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold mb-3 shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: team.primary_color }}
                  >
                    {team.short_name?.substring(0, 2)}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{team.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{team.short_name}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Teams will be announced soon</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Button variant="outline" asChild>
            <Link to="/teams">View All Teams</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
