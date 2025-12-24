import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Clock } from "lucide-react";
import { formatLocalTime } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Match {
  id: string;
  match_number: number;
  match_date: string;
  venue: string;
  status: string;
  home_team: { id: string; name: string; short_name: string; primary_color: string; logo_url: string | null };
  away_team: { id: string; name: string; short_name: string; primary_color: string; logo_url: string | null };
}

export function UpcomingMatches() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["upcoming-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_number,
          match_date,
          venue,
          status,
          home_team:teams!matches_home_team_id_fkey(id, name, short_name, primary_color, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, short_name, primary_color, logo_url)
        `)
        .eq("status", "upcoming")
        .order("match_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as Match[];
    },
  });

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
              Upcoming <span className="text-gradient-gold">Matches</span>
            </h2>
            <p className="text-muted-foreground mt-2">Don't miss the action</p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link to="/fixtures">View All</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                
                <div className="p-6">
                  {/* Match Number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Match {match.match_number}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatLocalTime(match.match_date, "MMM d, yyyy")}
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex-1 text-center">
                      {match.home_team?.logo_url ? (
                        <img 
                          src={match.home_team.logo_url} 
                          alt={match.home_team.name}
                          className="w-14 h-14 mx-auto rounded-full object-cover mb-2"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-bold text-white mb-2"
                          style={{ backgroundColor: match.home_team?.primary_color || "#1e3a8a" }}
                        >
                          {match.home_team?.short_name?.substring(0, 2) || "TBA"}
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground truncate">
                        {match.home_team?.name || "TBA"}
                      </p>
                    </div>
                    
                    <div className="text-2xl font-display text-muted-foreground">VS</div>
                    
                    <div className="flex-1 text-center">
                      {match.away_team?.logo_url ? (
                        <img 
                          src={match.away_team.logo_url} 
                          alt={match.away_team.name}
                          className="w-14 h-14 mx-auto rounded-full object-cover mb-2"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-bold text-white mb-2"
                          style={{ backgroundColor: match.away_team?.primary_color || "#dc2626" }}
                        >
                          {match.away_team?.short_name?.substring(0, 2) || "TBA"}
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground truncate">
                        {match.away_team?.name || "TBA"}
                      </p>
                    </div>
                  </div>

                  {/* Venue & Time */}
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLocalTime(match.match_date, "h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming matches scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for fixture updates</p>
          </div>
        )}

        <div className="mt-8 sm:hidden text-center">
          <Button variant="outline" asChild>
            <Link to="/fixtures">View All Fixtures</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
