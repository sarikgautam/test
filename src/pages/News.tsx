import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  top_content: string | null;
  published_at: string | null;
  created_at: string;
}

export default function News() {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as NewsItem[];
    },
  });

  return (
    <Layout>
      <div className="bg-gradient-to-b from-primary/20 to-background py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-gradient-gold text-center">
            Latest News
          </h1>
          <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
            Stay updated with the latest happenings, match results, and announcements from GCNPL
          </p>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <Skeleton className="h-48 md:h-auto md:w-64 flex-shrink-0" />
                  <CardContent className="flex-1 p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No news articles available yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <Link key={item.id} to={`/news/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="flex flex-col md:flex-row">
                    {item.image_url && (
                      <div className="md:w-64 flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="flex-1 p-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3" />
                        {item.published_at
                          ? format(new Date(item.published_at), "MMMM d, yyyy")
                          : format(new Date(item.created_at), "MMMM d, yyyy")}
                      </div>
                      <h2 className="font-display text-xl md:text-2xl mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h2>
                      {item.subtitle && (
                        <p className="text-muted-foreground font-medium mb-3">{item.subtitle}</p>
                      )}
                      {item.top_content && (
                        <p className="text-muted-foreground line-clamp-3">{item.top_content}</p>
                      )}
                      <div className="flex items-center gap-1 text-primary mt-4 text-sm font-medium">
                        Read More <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
