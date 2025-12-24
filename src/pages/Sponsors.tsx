import { Layout } from "@/components/layout/Layout";
import { Handshake, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const platinumSponsors = [
  { name: "Platinum Sponsor 1", description: "Main event sponsor" },
  { name: "Platinum Sponsor 2", description: "Title sponsor" },
];

const goldSponsors = [
  { name: "Gold Sponsor 1", description: "Match sponsor" },
  { name: "Gold Sponsor 2", description: "Team sponsor" },
  { name: "Gold Sponsor 3", description: "Award sponsor" },
];

const silverSponsors = [
  { name: "Silver Sponsor 1", description: "Supporting partner" },
  { name: "Silver Sponsor 2", description: "Supporting partner" },
  { name: "Silver Sponsor 3", description: "Supporting partner" },
  { name: "Silver Sponsor 4", description: "Supporting partner" },
];

const Sponsors = () => {
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

          {/* Platinum Sponsors */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Platinum Sponsors</h2>
              <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {platinumSponsors.map((sponsor, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl border-2 border-accent/30 p-8 text-center hover:border-accent transition-colors duration-300"
                >
                  <div className="w-24 h-24 mx-auto bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <Handshake className="w-12 h-12 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{sponsor.name}</h3>
                  <p className="text-muted-foreground">{sponsor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Sponsors */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Gold Sponsors</h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {goldSponsors.map((sponsor, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl border border-primary/20 p-6 text-center hover:border-primary/40 transition-colors duration-300"
                >
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Handshake className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{sponsor.name}</h3>
                  <p className="text-muted-foreground text-sm">{sponsor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Silver Sponsors */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Silver Sponsors</h2>
              <div className="w-24 h-1 bg-muted mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {silverSponsors.map((sponsor, index) => (
                <div
                  key={index}
                  className="bg-card rounded-lg border border-border/50 p-4 text-center hover:border-muted transition-colors duration-300"
                >
                  <div className="w-14 h-14 mx-auto bg-muted/20 rounded-lg flex items-center justify-center mb-3">
                    <Handshake className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{sponsor.name}</h3>
                </div>
              ))}
            </div>
          </div>

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
