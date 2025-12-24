import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Handshake } from "lucide-react";

const sponsors = [
  { name: "Sponsor 1", tier: "platinum" },
  { name: "Sponsor 2", tier: "platinum" },
  { name: "Sponsor 3", tier: "gold" },
  { name: "Sponsor 4", tier: "gold" },
  { name: "Sponsor 5", tier: "silver" },
  { name: "Sponsor 6", tier: "silver" },
];

export function SponsorsSection() {
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
          {sponsors.map((sponsor, index) => (
            <div
              key={index}
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
                <div className="w-16 h-16 mx-auto bg-muted/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Handshake className="w-8 h-8 text-muted-foreground" />
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
