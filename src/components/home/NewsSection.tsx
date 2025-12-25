import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
}

export function NewsSection() {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["homepage-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, subtitle, image_url, published_at, created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as NewsItem[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (news.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-3xl text-gradient-gold">Latest News</h2>
              <p className="text-muted-foreground text-sm">Stay updated with GCNPL</p>
            </div>
          </div>
          <Link to="/news">
            <Button variant="outline" className="gap-2">
              View All News <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link key={item.id} to={`/news/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
                {item.image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Newspaper className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3" />
                    {item.published_at
                      ? format(new Date(item.published_at), "MMM d, yyyy")
                      : format(new Date(item.created_at), "MMM d, yyyy")}
                  </div>
                  <h3 className="font-display text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.subtitle}</p>
                  )}
                  <div className="flex items-center gap-1 text-primary mt-3 text-sm font-medium">
                    Read More <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
