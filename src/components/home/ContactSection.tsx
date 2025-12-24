import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";

export function ContactSection() {
  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Mail className="w-4 h-4" />
              Get in Touch
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground mb-8">
              Have questions about GCNPL? Want to sponsor or participate? We'd love to hear from you!
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Location</h4>
                  <p className="text-muted-foreground text-sm">Gold Coast, Queensland, Australia</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Email</h4>
                  <p className="text-muted-foreground text-sm">info@gcnpl.com.au</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Phone</h4>
                  <p className="text-muted-foreground text-sm">+61 XXX XXX XXX</p>
                </div>
              </div>
            </div>

            <Button variant="hero" size="lg" asChild>
              <Link to="/contact" className="gap-2">
                Send Message
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-8">
            <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <p className="text-center text-muted-foreground text-sm">
              Visit our contact page for detailed information and inquiry form
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
