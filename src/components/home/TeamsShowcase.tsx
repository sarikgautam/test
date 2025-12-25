import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronRight, Trophy } from "lucide-react";

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
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/3 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with trophy icon */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-foreground mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Meet the <span className="text-gradient-gold">Teams</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
            Six powerhouse franchises battling for ultimate glory
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="w-40 h-56 rounded-2xl" />
            ))}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {teams.map((team, index) => (
              <Link
                key={team.id}
                to={`/teams`}
                className="group relative w-[calc(50%-8px)] sm:w-44 md:w-48 lg:w-52 animate-fade-in"
                style={{ animationDelay: `${index * 100 + 300}ms` }}
              >
                {/* Card container */}
                <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden transition-all duration-500 ease-out group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:border-primary/30">
                  
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${team.primary_color}20 0%, ${team.secondary_color}20 100%)`,
                    }}
                  />
                  
                  {/* Top accent line */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 transition-all duration-500 group-hover:h-1.5"
                    style={{ background: `linear-gradient(90deg, ${team.primary_color}, ${team.secondary_color})` }}
                  />
                  
                  {/* Content */}
                  <div className="relative p-6 md:p-8 text-center">
                    {/* Logo container with glow effect */}
                    <div className="relative mb-5">
                      <div 
                        className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 scale-150"
                        style={{ backgroundColor: team.primary_color }}
                      />
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.name}
                          className="relative w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full object-cover shadow-xl ring-2 ring-border/50 group-hover:ring-primary/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                        />
                      ) : (
                        <div
                          className="relative w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-xl ring-2 ring-border/50 group-hover:ring-primary/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                          style={{ 
                            background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})` 
                          }}
                        >
                          {team.short_name?.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    
                    {/* Team name */}
                    <h3 className="font-display font-semibold text-foreground text-base md:text-lg tracking-wide group-hover:text-primary transition-colors duration-300">
                      {team.name}
                    </h3>
                    
                    {/* Short name badge */}
                    <div 
                      className="inline-flex items-center justify-center px-3 py-1 mt-3 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-105"
                      style={{ 
                        backgroundColor: `${team.primary_color}20`,
                        color: team.primary_color 
                      }}
                    >
                      {team.short_name}
                    </div>
                    
                    {/* View team indicator */}
                    <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <span>View Team</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Teams will be announced soon</p>
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center mt-14 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <Button 
            variant="outline" 
            size="lg"
            asChild
            className="group px-8 py-6 text-base rounded-full border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300"
          >
            <Link to="/teams" className="flex items-center gap-2">
              Explore All Teams
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
