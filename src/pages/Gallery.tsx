import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Camera, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: galleryItems, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(() => {
    if (!galleryItems) return ["All"];
    const eventNames = [...new Set(galleryItems.map(item => item.event_name).filter(Boolean))];
    return ["All", ...eventNames];
  }, [galleryItems]);

  const filteredItems = useMemo(() => {
    if (!galleryItems) return [];
    if (activeCategory === "All") return galleryItems;
    return galleryItems.filter(item => item.event_name === activeCategory);
  }, [galleryItems, activeCategory]);

  const selectedItem = galleryItems?.find(item => item.id === selectedImage);

  return (
    <Layout>
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Camera className="w-4 h-4" />
              Photo Gallery
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              GCNPL Gallery
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Relive the best moments from GCNPL through our collection of photos and memories
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category as string)}
                  className={cn(
                    "rounded-full",
                    activeCategory === category && "bg-primary text-primary-foreground"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className={cn("aspect-square rounded-xl", i === 0 && "md:col-span-2 md:row-span-2")} />
              ))}
            </div>
          ) : (
            <>
              {/* Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedImage(item.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl bg-card border border-border/50 cursor-pointer hover:border-primary/30 transition-all duration-300",
                      index % 7 === 0 && "md:col-span-2 md:row-span-2"
                    )}
                  >
                    <div className={cn(
                      "aspect-square bg-muted/20 flex items-center justify-center",
                      index % 7 === 0 && "md:aspect-auto md:h-full"
                    )}>
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-12 h-12 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div>
                        {item.event_name && (
                          <span className="text-xs font-medium text-primary mb-1 block">{item.event_name}</span>
                        )}
                        <h3 className="text-foreground font-medium text-sm">{item.title}</h3>
                        {item.event_date && (
                          <p className="text-muted-foreground text-xs">{new Date(item.event_date).getFullYear()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No photos in this category yet</p>
                </div>
              )}
            </>
          )}

          {/* Lightbox Modal */}
          {selectedImage && selectedItem && (
            <div 
              className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                {selectedItem.image_url ? (
                  <img 
                    src={selectedItem.image_url} 
                    alt={selectedItem.title} 
                    className="w-full max-h-[80vh] object-contain rounded-xl"
                  />
                ) : (
                  <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
                    <Image className="w-24 h-24 text-muted-foreground/50" />
                  </div>
                )}
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-foreground">{selectedItem.title}</h3>
                  {selectedItem.description && (
                    <p className="text-muted-foreground mt-2">{selectedItem.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Gallery;
