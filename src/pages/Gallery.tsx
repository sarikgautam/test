import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Camera, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = ["All", "Matches", "Events", "Teams", "Awards", "Practice", "Fans"];

const galleryItems = [
  { id: 1, title: "Opening Ceremony 2025", category: "Events", year: 2025 },
  { id: 2, title: "Final Match Highlights", category: "Matches", year: 2025 },
  { id: 3, title: "Team Champions Photo", category: "Teams", year: 2025 },
  { id: 4, title: "Best Player Award", category: "Awards", year: 2025 },
  { id: 5, title: "Practice Session", category: "Practice", year: 2025 },
  { id: 6, title: "Fan Support", category: "Fans", year: 2025 },
  { id: 7, title: "Semi Final Action", category: "Matches", year: 2025 },
  { id: 8, title: "Team Registration Day", category: "Events", year: 2025 },
  { id: 9, title: "Auction Night", category: "Events", year: 2025 },
  { id: 10, title: "Net Practice", category: "Practice", year: 2025 },
  { id: 11, title: "Group Stage Match", category: "Matches", year: 2025 },
  { id: 12, title: "Community Gathering", category: "Fans", year: 2025 },
];

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredItems = activeCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

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
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full",
                  activeCategory === category && "bg-primary text-primary-foreground"
                )}
              >
                {category}
              </Button>
            ))}
          </div>

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
                  <Image className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div>
                    <span className="text-xs font-medium text-primary mb-1 block">{item.category}</span>
                    <h3 className="text-foreground font-medium text-sm">{item.title}</h3>
                    <p className="text-muted-foreground text-xs">{item.year}</p>
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

          {/* Lightbox Modal */}
          {selectedImage && (
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
              <div className="max-w-4xl w-full aspect-video bg-card rounded-xl flex items-center justify-center">
                <Image className="w-24 h-24 text-muted-foreground/50" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Gallery;
