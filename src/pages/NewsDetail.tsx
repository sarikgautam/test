import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  top_content: string | null;
  body_content: string | null;
  bottom_content: string | null;
  published_at: string | null;
  created_at: string;
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: news, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as NewsItem;
    },
    enabled: !!id,
  });

  const { data: recentNews = [] } = useQuery({
    queryKey: ["recent-news", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, image_url, published_at, created_at")
        .eq("is_published", true)
        .neq("id", id)
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as Pick<NewsItem, "id" | "title" | "image_url" | "published_at" | "created_at">[];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Layout>
    );
  }

  if (!news) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display mb-4">News Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/news">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to News
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-12">
        <Link to="/news" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to News
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            {news.published_at
              ? format(new Date(news.published_at), "MMMM d, yyyy")
              : format(new Date(news.created_at), "MMMM d, yyyy")}
          </div>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4 text-gradient-gold">
            {news.title}
          </h1>

          {news.subtitle && (
            <p className="text-xl text-muted-foreground mb-8">{news.subtitle}</p>
          )}

          {news.image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img
                src={news.image_url}
                alt={news.title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            {news.top_content && (
              <p className="text-lg leading-relaxed font-medium">{news.top_content}</p>
            )}

            {news.body_content && (
              <div className="whitespace-pre-wrap">{news.body_content}</div>
            )}

            {news.bottom_content && (
              <p className="text-muted-foreground italic border-l-4 border-primary pl-4">
                {news.bottom_content}
              </p>
            )}
          </div>
        </div>
      </article>

      {recentNews.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl mb-6">Other Recent News</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentNews.map((item) => (
                <Link key={item.id} to={`/news/${item.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.published_at
                          ? format(new Date(item.published_at), "MMM d, yyyy")
                          : format(new Date(item.created_at), "MMM d, yyyy")}
                      </p>
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 text-primary mt-2 text-xs">
                        Read <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
