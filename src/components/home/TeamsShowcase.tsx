import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronRight, Trophy, Zap } from "lucide-react";

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
    <section className="py-24 md:py-40 relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
      {/* Advanced background decorations */}
      <div className="absolute inset-0">
        {/* Main gradient blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Corner accents */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        
        {/* Grid overlay for subtle pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent to-primary rounded-full" />
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 backdrop-blur-sm">
              <Trophy className="w-7 h-7 text-primary" />
            </div>
            <div className="h-1 w-12 bg-gradient-to-l from-transparent to-primary rounded-full" />
          </div>
          
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-4 animate-fade-in font-bold" style={{ animationDelay: '100ms' }}>
            Meet the <span className="text-gradient-gold inline-block">Teams</span>
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto animate-fade-in mb-2" style={{ animationDelay: '200ms' }}>
            Six powerhouse franchises competing for supreme glory in the Gold Coast Cricket League
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-primary animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Zap className="w-4 h-4" />
            <span>Click any team to explore</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="w-48 h-72 rounded-3xl" />
            ))}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-7xl mx-auto">
            {teams.map((team, index) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="group relative animate-fade-in flex-shrink-0"
                style={{ animationDelay: `${index * 80 + 300}ms` }}
              >
                {/* Enhanced card with better depth */}
                <div className="relative w-48 md:w-56 h-auto rounded-3xl overflow-hidden transition-all duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-2">
                  
                  {/* Layered background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-xl border border-border/80 group-hover:border-primary/50 transition-all duration-700 rounded-3xl" />
                  
                  {/* Dynamic gradient based on team colors */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"
                    style={{
                      background: `linear-gradient(135deg, ${team.primary_color}15 0%, ${team.secondary_color}15 100%)`,
                    }}
                  />
                  
                  {/* Enhanced top accent - larger */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-700 group-hover:h-2"
                    style={{ background: `linear-gradient(90deg, ${team.primary_color}, ${team.secondary_color})` }}
                  />
                  
                  {/* Side accent line */}
                  <div 
                    className="absolute top-0 right-0 w-1 h-0 transition-all duration-700 group-hover:h-full"
                    style={{ background: `linear-gradient(180deg, ${team.primary_color}, ${team.secondary_color})` }}
                  />
                  
                  {/* Content with enhanced padding */}
                  <div className="relative px-6 pt-8 pb-8 text-center flex flex-col items-center">
                    {/* Enhanced logo container with larger size and glow */}
                    <div className="relative mb-8 group/logo">
                      {/* Glow effect - more prominent */}
                      <div 
                        className="absolute -inset-6 rounded-full blur-2xl opacity-0 group-hover/logo:opacity-70 transition-opacity duration-700 group-hover/logo:animate-pulse"
                        style={{ backgroundColor: team.primary_color }}
                      />
                      
                      {/* Secondary glow */}
                      <div 
                        className="absolute -inset-4 rounded-full blur-lg opacity-0 group-hover/logo:opacity-40 transition-opacity duration-700"
                        style={{ backgroundColor: team.secondary_color }}
                      />
                      
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.name}
                          className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full object-cover shadow-2xl ring-4 ring-border/60 group-hover/logo:ring-primary/60 transition-all duration-700 group-hover/logo:scale-125 group-hover/logo:-rotate-6 backdrop-blur-sm"
                        />
                      ) : (
                        <div
                          className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-2xl ring-4 ring-border/60 group-hover/logo:ring-primary/60 transition-all duration-700 group-hover/logo:scale-125 group-hover/logo:-rotate-6 backdrop-blur-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})` 
                          }}
                        >
                          {team.short_name?.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    
                    {/* Team name - larger and bolder */}
                    <h3 className="font-display font-bold text-xl md:text-2xl text-foreground tracking-wide group-hover:text-primary transition-colors duration-500 leading-tight mb-3">
                      {team.name}
                    </h3>
                    
                    {/* Enhanced short name badge */}
                    <div 
                      className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-500 group-hover:scale-110 shadow-lg"
                      style={{ 
                        backgroundColor: `${team.primary_color}25`,
                        color: team.primary_color,
                        border: `1.5px solid ${team.primary_color}40`
                      }}
                    >
                      {team.short_name}
                    </div>
                    
                    {/* Enhanced view team indicator with better animation */}
                    <div className="flex items-center justify-center gap-2 mt-6 text-sm font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-3 group-hover:translate-y-0">
                      <span className="text-primary">View Team</span>
                      <ChevronRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl border border-border/50 max-w-md mx-auto shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Teams will be announced soon</p>
          </div>
        )}

        {/* Enhanced CTA Button */}
        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '800ms' }}>
          <Button 
            size="lg"
            asChild
            className="group px-10 py-7 text-base font-semibold rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <Link to="/teams" className="flex items-center gap-3">
              Explore All Teams
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
