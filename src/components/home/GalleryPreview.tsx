import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, Image } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function GalleryPreview() {
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ['gallery-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(6);
      
      // If no featured images, get the latest ones
      if (!error && (!data || data.length === 0)) {
        const { data: latestData, error: latestError } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (latestError) throw latestError;
        return latestData;
      }
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-32 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className={`aspect-square rounded-xl ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!galleryImages || galleryImages.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Camera className="w-4 h-4" />
            Photo Gallery
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Captured Moments
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Relive the best moments from GCNPL through our photo gallery
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`group relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <div className={`aspect-square ${index === 0 ? 'md:aspect-auto md:h-full' : ''} bg-muted/20 flex items-center justify-center`}>
                {image.image_url ? (
                  <img 
                    src={image.image_url} 
                    alt={image.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="w-12 h-12 text-muted-foreground/50" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div>
                  {image.event_name && (
                    <span className="text-xs font-medium text-primary mb-1 block">{image.event_name}</span>
                  )}
                  <h3 className="text-foreground font-medium">{image.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/gallery" className="gap-2">
              View Full Gallery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
