import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Camera, Image, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigatePrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateNext();
      } else if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, filteredItems]);

  const navigateNext = () => {
    if (!filteredItems || selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % filteredItems.length);
  };

  const navigatePrevious = () => {
    if (!filteredItems || selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + filteredItems.length) % filteredItems.length);
  };

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
                    onClick={() => setSelectedImageIndex(index)}
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
          {selectedImageIndex !== null && filteredItems[selectedImageIndex] && (
            <div 
              className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedImageIndex(null)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 hover:bg-background/80"
                onClick={() => setSelectedImageIndex(null)}
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Previous Button */}
              {filteredItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 hover:bg-background hover:scale-110 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePrevious();
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              )}

              {/* Next Button */}
              {filteredItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 hover:bg-background hover:scale-110 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateNext();
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              )}

              <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
                {filteredItems[selectedImageIndex].image_url ? (
                  <img 
                    src={filteredItems[selectedImageIndex].image_url} 
                    alt={filteredItems[selectedImageIndex].title} 
                    className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl scale-90"
                  />
                ) : (
                  <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
                    <Image className="w-24 h-24 text-muted-foreground/50" />
                  </div>
                )}
                <div className="mt-6 text-center bg-background/80 backdrop-blur-sm rounded-xl p-4">
                  {filteredItems[selectedImageIndex].event_name && (
                    <span className="text-sm font-medium text-primary mb-2 block">
                      {filteredItems[selectedImageIndex].event_name}
                    </span>
                  )}
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">
                    {filteredItems[selectedImageIndex].title}
                  </h3>
                  {filteredItems[selectedImageIndex].description && (
                    <p className="text-muted-foreground mt-2">
                      {filteredItems[selectedImageIndex].description}
                    </p>
                  )}
                  {filteredItems.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {selectedImageIndex + 1} / {filteredItems.length} {activeCategory !== "All" && `in ${activeCategory}`}
                    </p>
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
