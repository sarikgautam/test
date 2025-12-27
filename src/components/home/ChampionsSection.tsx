import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export function ChampionsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  const { data: champions, isLoading } = useQuery({
    queryKey: ["champions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_stage,
          status,
          winner_team_id,
          season_id,
          match_date,
          winner:teams!matches_winner_team_id_fkey(id, name, short_name, logo_url, primary_color),
          season:seasons(id, name)
        `)
        .eq("match_stage", "final")
        .eq("status", "completed")
        .order("match_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [champions]);

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || !scrollContainerRef.current || !champions || champions.length <= 1) return;

    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (container) {
        // If at the end, scroll back to start
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 400, behavior: "smooth" });
        }
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [autoScroll, champions]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      setAutoScroll(false);
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(() => checkScroll(), 300);
      // Resume auto-scroll after 10 seconds of inactivity
      setTimeout(() => setAutoScroll(true), 10000);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 md:py-32 bg-gradient-to-br from-background via-background to-background">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="font-display text-4xl md:text-5xl tracking-wide mb-3">
              <span className="text-gradient-gold">Champions</span>
            </h2>
            <p className="text-muted-foreground text-lg">Golden moments - Teams that claimed victory</p>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-80 h-96 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!champions || champions.length === 0) {
    return (
      <section className="py-16 md:py-32 bg-gradient-to-br from-background via-background to-background">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="font-display text-4xl md:text-5xl tracking-wide mb-3">
              <span className="text-gradient-gold">Champions</span>
            </h2>
            <p className="text-muted-foreground text-lg">Golden moments - Teams that claimed victory</p>
          </div>
          <div className="text-center py-20 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 rounded-3xl border border-yellow-500/10">
            <Trophy className="w-16 h-16 text-yellow-600/50 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No champions crowned yet</p>
            <p className="text-sm text-muted-foreground mt-2">Stay tuned for exciting finals!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-32 relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
      {/* Premium background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-b from-yellow-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-t from-amber-500/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.1)_0%,transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight font-bold">
                <span className="text-gradient-gold">Champions</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mt-1">Golden moments - Teams that claimed victory in finals</p>
            </div>
          </div>
        </div>

        {/* Champions Carousel */}
        <div className="relative group">
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className={`flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide ${
              champions.length === 1 ? "justify-center" : ""
            }`}
            style={{
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {champions.map((champion, index) => (
              <div
                key={champion.id}
                className="flex-shrink-0 w-80 snap-start"
              >
                <div className="group/card relative h-full bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent rounded-2xl border border-yellow-500/20 overflow-hidden hover:border-yellow-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/20">
                  {/* Animated gradient border on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-amber-400/0 to-yellow-400/0 group-hover/card:from-yellow-400/20 group-hover/card:via-amber-400/10 group-hover/card:to-yellow-400/20 transition-all duration-500" />

                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 opacity-80 group-hover/card:opacity-100 transition-opacity" />

                  <div className="relative p-8 flex flex-col h-full">
                    {/* Trophy Section */}
                    <div className="flex justify-center mb-8 relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/30 to-transparent rounded-full blur-xl group-hover/card:blur-2xl transition-all" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl group-hover/card:scale-110 transition-transform duration-500">
                        <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Team Logo */}
                    <div className="flex justify-center mb-6">
                      {champion.winner?.logo_url ? (
                        <img
                          src={champion.winner.logo_url}
                          alt={champion.winner.name}
                          className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-yellow-500/30 group-hover/card:ring-yellow-500/50 group-hover/card:scale-110 transition-all duration-500"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-2 ring-yellow-500/30 group-hover/card:ring-yellow-500/50 group-hover/card:scale-110 transition-all duration-500"
                          style={{ backgroundColor: champion.winner?.primary_color || "#fbbf24" }}
                        >
                          {champion.winner?.short_name?.substring(0, 2) || "CH"}
                        </div>
                      )}
                    </div>

                    {/* Team Name */}
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-center text-foreground mb-3 group-hover/card:text-yellow-600 transition-colors">
                      {champion.winner?.name || "Unknown Team"}
                    </h3>

                    {/* Badge */}
                    <div className="flex justify-center mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 group-hover/card:border-yellow-500/60 transition-all">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-600" />
                        </span>
                        <span className="text-xs md:text-sm font-semibold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                          Final Champion
                        </span>
                      </div>
                    </div>

                    {/* Season Info */}
                    <p className="text-center text-sm md:text-base font-medium text-muted-foreground mb-6 flex-grow">
                      {champion.season?.name || "Championship"}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mb-4" />

                    {/* Date */}
                    <p className="text-center text-xs text-muted-foreground">
                      {new Date(champion.match_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          {champions.length > 1 && (
            <>
              {canScrollLeft && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-20 p-2 md:p-3 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 group/btn hover:scale-110"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}

              {canScrollRight && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-20 p-2 md:p-3 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 group/btn hover:scale-110"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}

              {/* Scroll Indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {champions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === 0 ? "w-8 bg-yellow-500" : "w-2 bg-yellow-500/30 hover:bg-yellow-500/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Auto-scroll indicator */}
        {champions.length > 1 && autoScroll && (
          <div className="flex justify-center mt-8 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-600" />
              </span>
              Auto-scrolling champions
            </span>
          </div>
        )}
      </div>

      {/* Hide scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
