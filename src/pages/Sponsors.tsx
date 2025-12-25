import { Layout } from "@/components/layout/Layout";
import { Handshake, Mail, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Sponsors = () => {
  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const platinumSponsors = sponsors?.filter(s => s.tier === 'platinum') || [];
  const goldSponsors = sponsors?.filter(s => s.tier === 'gold') || [];
  const silverSponsors = sponsors?.filter(s => s.tier === 'silver') || [];
  const bronzeSponsors = sponsors?.filter(s => s.tier === 'bronze') || [];

  const SponsorCard = ({ sponsor, size = 'md' }: { sponsor: any; size?: 'lg' | 'md' | 'sm' }) => (
    <div
      className={`group relative bg-card rounded-xl border ${
        size === 'lg' ? 'border-2 border-accent/30 p-8 hover:border-accent' :
        size === 'md' ? 'border-primary/20 p-6 hover:border-primary/40' :
        'border-border/50 p-4 hover:border-muted'
      } text-center transition-all duration-300`}
    >
      <div className={`mx-auto ${
        size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-20 h-20' : 'w-14 h-14'
      } bg-muted/20 rounded-xl flex items-center justify-center mb-4 overflow-hidden`}>
        {sponsor.logo_url ? (
          <img 
            src={sponsor.logo_url} 
            alt={sponsor.name} 
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <Handshake className={`${size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-10 h-10' : 'w-7 h-7'} text-muted-foreground`} />
        )}
      </div>
      <h3 className={`font-bold text-foreground mb-2 ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-xl'}`}>
        {sponsor.name}
      </h3>
      {sponsor.description && size !== 'sm' && (
        <p className="text-muted-foreground text-sm mb-3">{sponsor.description}</p>
      )}
      {sponsor.website && (
        <a 
          href={sponsor.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
        >
          Visit Website <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Handshake className="w-4 h-4" />
              Our Partners
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Our Sponsors
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We are grateful to our sponsors who make GCNPL possible. Their support helps us promote cricket in the Nepalese community of Gold Coast.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-48 rounded-xl" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Platinum Sponsors */}
              {platinumSponsors.length > 0 && (
                <div className="mb-16">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">Platinum Sponsors</h2>
                    <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {platinumSponsors.map((sponsor) => (
                      <SponsorCard key={sponsor.id} sponsor={sponsor} size="lg" />
                    ))}
                  </div>
                </div>
              )}

              {/* Gold Sponsors */}
              {goldSponsors.length > 0 && (
                <div className="mb-16">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">Gold Sponsors</h2>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {goldSponsors.map((sponsor) => (
                      <SponsorCard key={sponsor.id} sponsor={sponsor} size="md" />
                    ))}
                  </div>
                </div>
              )}

              {/* Silver Sponsors */}
              {silverSponsors.length > 0 && (
                <div className="mb-16">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">Silver Sponsors</h2>
                    <div className="w-24 h-1 bg-muted mx-auto rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    {silverSponsors.map((sponsor) => (
                      <SponsorCard key={sponsor.id} sponsor={sponsor} size="sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Bronze Sponsors */}
              {bronzeSponsors.length > 0 && (
                <div className="mb-16">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">Bronze Sponsors</h2>
                    <div className="w-24 h-1 bg-muted/50 mx-auto rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    {bronzeSponsors.map((sponsor) => (
                      <SponsorCard key={sponsor.id} sponsor={sponsor} size="sm" />
                    ))}
                  </div>
                </div>
              )}

              {sponsors?.length === 0 && (
                <div className="text-center py-12">
                  <Handshake className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No sponsors to display yet</p>
                </div>
              )}
            </>
          )}

          {/* Become a Sponsor CTA */}
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Become a Sponsor
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join us in promoting cricket and community spirit. Various sponsorship packages are available to suit your needs.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact" className="gap-2">
                <Mail className="w-4 h-4" />
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sponsors;
