import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Handshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveSeason } from "@/hooks/useActiveSeason";

export function SponsorsSection() {
  const { activeSeason } = useActiveSeason();

  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['sponsors-preview', activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return [];
      
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .eq('season_id', activeSeason.id)
        .order('display_order', { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!activeSeason?.id,
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-32 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Handshake className="w-4 h-4" />
            Our Partners
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Proud Sponsors
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We thank our sponsors for their continued support in making GCNPL a success
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 mb-10">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="group flex flex-col items-center text-center"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex items-center justify-center p-4 group-hover:scale-105">
                {sponsor.logo_url ? (
                  <img 
                    src={sponsor.logo_url} 
                    alt={sponsor.name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Handshake className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium text-foreground mt-3">{sponsor.name}</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${
                sponsor.tier === 'title'
                  ? 'bg-purple-500/20 text-purple-400'
                  : sponsor.tier === 'platinum' 
                  ? 'bg-accent text-accent-foreground' 
                  : sponsor.tier === 'gold' 
                  ? 'bg-primary/20 text-primary' 
                  : sponsor.tier === 'silver'
                  ? 'bg-gray-400/20 text-gray-400'
                  : 'bg-orange-700/20 text-orange-400'
              }`}>
                {sponsor.tier}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/sponsors" className="gap-2">
              View All Sponsors
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
