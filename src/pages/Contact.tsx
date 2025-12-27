import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Mail, MapPin, Phone, Send, Facebook, Instagram, Youtube, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['contact-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const subject = formData.get('subject') as string;
      const message = formData.get('message') as string;

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          subject,
          message,
          status: 'unread'
        });

      if (error) throw error;

      toast.success("Message sent successfully! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error("Failed to send message. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Mail className="w-4 h-4" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Have questions, feedback, or want to get involved? We'd love to hear from you!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl border border-border/50 p-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" placeholder="Doe" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+61 XXX XXX XXX" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="How can we help?" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message"
                    name="message"
                    placeholder="Your message..." 
                    rows={5}
                    required 
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {isLoading ? (
                <Skeleton className="h-64 rounded-2xl" />
              ) : (
                <div className="bg-card rounded-2xl border border-border/50 p-8">
                  <h2 className="text-2xl font-display font-bold text-foreground mb-6">Contact Information</h2>
                  
                  <div className="space-y-6">
                    {contactInfo?.address && (
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Address</h4>
                          <p className="text-muted-foreground whitespace-pre-line">{contactInfo.address}</p>
                        </div>
                      </div>
                    )}

                    {contactInfo?.email && (
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Email</h4>
                          <a href={`mailto:${contactInfo.email}`} className="text-primary hover:underline">
                            {contactInfo.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {contactInfo?.phone && (
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Phone</h4>
                          <a href={`tel:${contactInfo.phone}`} className="text-primary hover:underline">
                            {contactInfo.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {contactInfo?.office_hours && (
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Office Hours</h4>
                          <p className="text-muted-foreground whitespace-pre-line">{contactInfo.office_hours}</p>
                        </div>
                      </div>
                    )}

                    {!contactInfo && (
                      <p className="text-muted-foreground">Contact information will be available soon.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(contactInfo?.facebook_url || contactInfo?.instagram_url || contactInfo?.youtube_url || contactInfo?.tiktok_url) && (
                <div className="bg-card rounded-2xl border border-border/50 p-8">
                  <h2 className="text-2xl font-display font-bold text-foreground mb-6">Follow Us</h2>
                  <p className="text-muted-foreground mb-6">
                    Stay connected with us on social media for the latest updates, highlights, and announcements.
                  </p>
                  <div className="flex gap-4">
                    {contactInfo?.facebook_url && (
                      <a 
                        href={contactInfo.facebook_url} 
                        className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Facebook className="w-6 h-6 text-primary" />
                      </a>
                    )}
                    {contactInfo?.instagram_url && (
                      <a 
                        href={contactInfo.instagram_url} 
                        className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Instagram className="w-6 h-6 text-primary" />
                      </a>
                    )}
                    {contactInfo?.youtube_url && (
                      <a 
                        href={contactInfo.youtube_url} 
                        className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Youtube className="w-6 h-6 text-primary" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                {contactInfo?.map_embed_url ? (
                  <iframe
                    src={contactInfo.map_embed_url}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="aspect-video bg-muted/20 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">Map will be displayed here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
