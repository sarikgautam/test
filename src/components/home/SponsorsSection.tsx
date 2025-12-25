import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Handshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function SponsorsSection() {
  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['sponsors-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="group relative bg-card rounded-xl p-6 flex items-center justify-center aspect-square border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="absolute top-2 right-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  sponsor.tier === 'platinum' 
                    ? 'bg-accent text-accent-foreground' 
                    : sponsor.tier === 'gold' 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted/30 text-muted-foreground'
                }`}>
                  {sponsor.tier}
                </span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-muted/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                  {sponsor.logo_url ? (
                    <img 
                      src={sponsor.logo_url} 
                      alt={sponsor.name} 
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Handshake className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{sponsor.name}</p>
              </div>
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
