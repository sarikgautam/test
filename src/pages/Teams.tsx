import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trophy, ChevronRight, Crown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  owner_name: string | null;
  remaining_budget: number;
  description: string | null;
  captain_id: string | null;
  manager_name: string | null;
}

const Teams = () => {
  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data as Team[];
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
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto relative z-10">
            <div className="text-center mb-4 animate-slide-up">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Trophy className="w-4 h-4" />
                GCNPL Season 2025
              </span>
              <h1 className="font-display text-5xl md:text-7xl tracking-tight mb-6">
                Meet The <span className="text-gradient-gold">Franchises</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                Six elite teams battling for glory in the Gold Coast Nepalese Premier League
              </p>
            </div>
          </div>
        </div>

        {/* Teams Zig-Zag Section */}
        <div className="container mx-auto px-4 pb-20">
          {isLoading ? (
            <div className="space-y-16">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : teams && teams.length > 0 ? (
            <div className="space-y-16 md:space-y-24">
              {teams.map((team, index) => {
                const teamPlayers = players?.filter((p) => p.team_id === team.id) || [];
                const isEven = index % 2 === 0;
                
                return (
                  <div
                    key={team.id}
                    className={`relative group animate-slide-up`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div 
                      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}
                    >
                      {/* Team Logo/Visual Side */}
                      <div className="w-full lg:w-1/2 relative">
                        <div 
                          className="relative aspect-[4/3] rounded-3xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500"
                          style={{ 
                            background: `linear-gradient(135deg, ${team.primary_color}20, ${team.secondary_color}20)` 
                          }}
                        >
                          {/* Background Pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <div 
                              className="absolute inset-0" 
                              style={{
                                backgroundImage: `radial-gradient(circle at 30% 70%, ${team.primary_color} 0%, transparent 50%), 
                                                  radial-gradient(circle at 70% 30%, ${team.secondary_color} 0%, transparent 50%)`
                              }}
                            />
                          </div>
                          
                          {/* Team Logo */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {team.logo_url ? (
                              <img 
                                src={team.logo_url} 
                                alt={team.name}
                                className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div 
                                className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center text-6xl md:text-8xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-500"
                                style={{ 
                                  backgroundColor: team.primary_color,
                                  color: 'white',
                                  boxShadow: `0 25px 50px -12px ${team.primary_color}80`
                                }}
                              >
                                {team.short_name?.substring(0, 2)}
                              </div>
                            )}
                          </div>

                          {/* Decorative Elements */}
                          <div 
                            className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-30"
                            style={{ backgroundColor: team.secondary_color }}
                          />
                          <div 
                            className="absolute bottom-4 left-4 w-16 h-16 rounded-full opacity-20"
                            style={{ backgroundColor: team.primary_color }}
                          />
                        </div>

                        {/* Color Bar */}
                        <div 
                          className="absolute -bottom-3 left-8 right-8 h-2 rounded-full"
                          style={{ background: `linear-gradient(90deg, ${team.primary_color}, ${team.secondary_color})` }}
                        />
                      </div>

                      {/* Team Info Side */}
                      <div className={`w-full lg:w-1/2 ${isEven ? 'lg:pl-8' : 'lg:pr-8'}`}>
                        <div className="space-y-6">
                          {/* Team Name */}
                          <div>
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
                              style={{ backgroundColor: `${team.primary_color}20`, color: team.primary_color }}
                            >
                              {team.short_name}
                            </span>
                            <h2 className="font-display text-3xl md:text-5xl tracking-tight mb-2">
                              {team.name}
                            </h2>
                          </div>

                          {/* Team Description */}
                          <p className="text-muted-foreground text-lg leading-relaxed">
                            {team.description || `A formidable franchise competing in the GCNPL, bringing passion and skill to every match.`}
                          </p>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-2 gap-4">
                            {team.owner_name && (
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${team.primary_color}20` }}
                                >
                                  <Crown className="w-5 h-5" style={{ color: team.primary_color }} />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Owner</p>
                                  <p className="font-medium truncate">{team.owner_name}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${team.primary_color}20` }}
                              >
                                <Users className="w-5 h-5" style={{ color: team.primary_color }} />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Squad</p>
                                <p className="font-medium">{teamPlayers.length} Players</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${team.primary_color}20` }}
                              >
                                <Star className="w-5 h-5" style={{ color: team.primary_color }} />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
                                <p className="font-medium">${Number(team.remaining_budget).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* View Team Button */}
                          <Link to={`/teams/${team.id}`}>
                            <Button 
                              className="group/btn mt-4 px-8 py-6 text-lg rounded-xl"
                              style={{ 
                                backgroundColor: team.primary_color,
                                color: 'white'
                              }}
                            >
                              View Full Squad
                              <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-border">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl mb-2">Teams Coming Soon</h3>
              <p className="text-muted-foreground">The franchises will be announced shortly</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Teams;
