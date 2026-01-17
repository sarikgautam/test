import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, Users, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import gcnplLogo from "@/assets/gcnpl-logo.png";

type SlideType =
  | "intro"
  | "support"
  | "all-teams"
  | "team"
  | "acquisition"
  | "sponsors"
  | "owner"
  | "top-bids";

type Acquisition = {
  id: string;
  team_id: string | null;
  auction_status: string | null;
  sold_price: number | null;
  base_price: number | null;
  team: {
    id: string;
    name: string;
    short_name: string | null;
    logo_url: string | null;
    primary_color?: string | null;
  } | null;
  player: {
    id: string;
    full_name: string;
    role: string;
    photo_url: string | null;
  } | null;
};

type TopBid = {
  id: string;
  sold_price: number | null;
  auction_status: string | null;
  team: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  player: {
    id: string;
    full_name: string;
    role: string;
    photo_url: string | null;
  } | null;
};

export default function AuctionDayBanner() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideType, setSlideType] = useState<SlideType>("intro");
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<number | null>(null);

  const slideKey = `${slideType}-${currentSlideIndex}`;

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: sponsors, isLoading: sponsorsLoading } = useQuery({
    queryKey: ["sponsors-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .order("tier", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: owners, isLoading: ownersLoading } = useQuery({
    queryKey: ["owners-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owners")
        .select("id, name, photo_url, business_name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: supportClubs, isLoading: supportLoading } = useQuery({
    queryKey: ["support-clubs-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_club")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: activeSeason } = useQuery({
    queryKey: ["active-season-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name")
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: acquisitions } = useQuery<{ data: Acquisition[] | null }>({
    queryKey: ["auction-acquisitions", activeSeason?.id],
    enabled: !!activeSeason?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(
          `id, team_id, auction_status, sold_price, base_price,
           team:teams(id, name, short_name, logo_url, primary_color),
           player:players(id, full_name, role, photo_url)`
        )
        .eq("season_id", activeSeason!.id)
        .in("auction_status", ["sold", "retained"]);
      if (error) throw error;
      return { data };
    },
  });

  const { data: topBids } = useQuery<{ data: TopBid[] | null }>({
    queryKey: ["auction-top-bids", activeSeason?.id],
    enabled: !!activeSeason?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(
          `id, sold_price, auction_status,
           team:teams(id, name, logo_url),
           player:players(id, full_name, role, photo_url)`
        )
        .eq("season_id", activeSeason!.id)
        .not("sold_price", "is", null)
        .order("sold_price", { ascending: false })
        .limit(5);
      if (error) throw error;
      return { data };
    },
  });

  const teamsWithAcquisitions = useMemo(() => {
    if (!acquisitions?.data) return [] as {
      team: Acquisition["team"];
      retained: Acquisition[];
      acquired: Acquisition[];
    }[];

    const grouped: Record<string, { team: Acquisition["team"]; retained: Acquisition[]; acquired: Acquisition[] }> = {};

    for (const entry of acquisitions.data) {
      if (!entry.team || !entry.team.id) continue;
      if (!grouped[entry.team.id]) {
        grouped[entry.team.id] = { team: entry.team, retained: [], acquired: [] };
      }

      if (entry.auction_status === "retained") {
        grouped[entry.team.id].retained.push(entry);
      } else {
        grouped[entry.team.id].acquired.push(entry);
      }
    }

    return Object.values(grouped).sort((a, b) => (a.team?.name || "").localeCompare(b.team?.name || ""));
  }, [acquisitions?.data]);

  // Calculate total slides: intro + support + all-teams + team slides + acquisition slides + sponsors + owners + top-bids
  const ownersCount = teams?.filter(t => t.owner_id).length || 0;
  const teamsCount = teams?.length || 0;
  const acquisitionsCount = teamsWithAcquisitions.length;
  const sponsorsCount = sponsors?.length || 0;
  const totalSlides = 3 + teamsCount + acquisitionsCount + sponsorsCount + ownersCount + 1;

  // Auto-rotate through teams, sponsors, and owners
  useEffect(() => {
    if (!teams || teams.length === 0 || isPaused) return;
    
    const interval = setInterval(() => {
      goToNextSlide();
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [teams, isPaused, currentSlideIndex]);

  // Hide controllers when idle
  useEffect(() => {
    const resetControls = () => {
      setShowControls(true);
      if (hideControlsTimeout.current) window.clearTimeout(hideControlsTimeout.current);
      hideControlsTimeout.current = window.setTimeout(() => setShowControls(false), 2500);
    };

    resetControls();
    window.addEventListener("mousemove", resetControls);
    window.addEventListener("touchstart", resetControls);

    return () => {
      window.removeEventListener("mousemove", resetControls);
      window.removeEventListener("touchstart", resetControls);
      if (hideControlsTimeout.current) window.clearTimeout(hideControlsTimeout.current);
    };
  }, []);

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => {
      const next = (prev + 1) % totalSlides;
      updateSlideType(next);
      return next;
    });
  };

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => {
      const next = prev === 0 ? totalSlides - 1 : prev - 1;
      updateSlideType(next);
      return next;
    });
  };

  const updateSlideType = (index: number) => {
    const teamsCount = teams?.length || 0;
    const sponsorsCount = sponsors?.length || 0;
    const ownersWithIds = teams?.filter(t => t.owner_id) || [];
    const ownersCount = ownersWithIds.length;
    const acquisitionsCount = teamsWithAcquisitions.length;

    const teamStart = 3;
    const acquisitionStart = teamStart + teamsCount;
    const sponsorsStart = acquisitionStart + acquisitionsCount;
    const ownersStart = sponsorsStart + sponsorsCount;
    const topBidStart = ownersStart + ownersCount;
    
    if (index === 0) {
      setSlideType("intro");
    } else if (index === 1) {
      setSlideType("support");
    } else if (index === 2) {
      setSlideType("all-teams");
    } else if (index >= teamStart && index < acquisitionStart) {
      setSlideType("team");
    } else if (index >= acquisitionStart && index < sponsorsStart) {
      setSlideType("acquisition");
    } else if (index >= sponsorsStart && index < ownersStart) {
      setSlideType("sponsors");
    } else if (index >= ownersStart && index < topBidStart) {
      setSlideType("owner");
    } else {
      setSlideType("top-bids");
    }
  };

  const teamsWithOwners = teams?.filter((t) => t.owner_id) || [];

  const teamStartIndex = 3;
  const acquisitionStartIndex = teamStartIndex + teamsCount;
  const sponsorsStartIndex = acquisitionStartIndex + acquisitionsCount;
  const ownersStartIndex = sponsorsStartIndex + sponsorsCount;

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-background flex flex-col">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Advanced background decorations */}
      <div className="absolute inset-0">
        {/* Main gradient blob - always animating */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Corner accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      {/* Center Header */}
      <div className="relative z-10 text-center pt-8 pb-4">
        <div className="flex items-center justify-center gap-4 mb-4 animate-fade-in">
          <div className="h-1 w-12 bg-gradient-to-r from-transparent to-primary rounded-full" />
          
          {/* GCNPL Logo */}
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <img 
              src={gcnplLogo} 
              alt="GCNPL Logo" 
              className="relative w-16 h-16 md:w-20 md:h-20 object-contain bg-white p-2"
            />
          </div>
          
          <div className="h-1 w-12 bg-gradient-to-l from-transparent to-primary rounded-full" />
        </div>
        
        <h1 className="font-display text-3xl md:text-5xl tracking-tight text-foreground font-bold leading-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
          <span className="text-gradient-gold">GCNPL Season 2</span>
        </h1>
        <p className="text-lg md:text-2xl font-semibold text-primary mt-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
          Auction Day
        </p>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-8">
        <div key={slideKey} className="w-full max-w-7xl mx-auto animate-slide-fade">
        {teamsLoading || sponsorsLoading || ownersLoading || supportLoading ? (
          <div className="flex items-center justify-center gap-12 w-full max-w-7xl">
            <Skeleton className="w-96 h-96 rounded-3xl" />
            <Skeleton className="flex-1 h-96 rounded-3xl" />
          </div>
        ) : slideType === "intro" ? (
          // Intro Slide (First)
          <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto animate-fade-in text-center space-y-8">
            <div className="relative">
              {/* Glow effects */}
              <div className="absolute -inset-12 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl opacity-50 animate-pulse" />
              
              <img 
                src={gcnplLogo} 
                alt="GCNPL Logo"
                className="relative w-64 h-64 object-contain drop-shadow-2xl bg-white p-6"
              />
            </div>
            
            <div className="space-y-4">
              <h1 className="font-display text-6xl md:text-7xl font-bold">
                <span className="text-gradient-gold">Gold Coast</span>
              </h1>
              <h2 className="font-display text-5xl md:text-6xl font-bold text-foreground">
                Nepalese Premier League
              </h2>
              
              <div className="pt-6 space-y-3">
                <p className="text-4xl md:text-5xl font-bold text-primary">
                  {activeSeason?.name || "Season 2"}
                </p>
                <p className="text-5xl md:text-6xl font-bold text-gradient-gold">
                  Auction Day
                </p>
              </div>
            </div>
          </div>
        ) : slideType === "support" && supportClubs && supportClubs.length > 0 ? (
          // Support Club Slide (Second)
          <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto animate-fade-in text-center space-y-12">
            <h3 className="font-display text-5xl md:text-6xl font-bold text-foreground">
              Supported By
            </h3>
            
            <div className="flex flex-wrap justify-center items-center gap-12">
              {supportClubs.map((club) => (
                <div key={club.id} className="flex flex-col items-center gap-6">
                  <div className="relative">
                    {/* Glow effects */}
                    <div className="absolute -inset-12 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl opacity-50 animate-pulse" />
                    
                    <div className="relative w-64 h-64 rounded-3xl bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl ring-8 ring-primary/40 flex items-center justify-center p-8">
                      <img 
                        src={club.logo_url} 
                        alt={club.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  
                  <h4 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    {club.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        ) : slideType === "all-teams" && teams && teams.length > 0 ? (
          // All Teams Summary Slide (First)
          <div className="flex items-center justify-center w-full max-w-7xl animate-fade-in">
            <div className="w-full">
              <div className="text-center mb-12">
                <h3 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-4">
                  All <span className="text-gradient-gold">Teams</span>
                </h3>
                <p className="text-muted-foreground text-xl md:text-2xl">
                  Four powerhouse franchises ready to compete
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {teams.map((team, index) => (
                  <div
                    key={team.id}
                    className="flex flex-col items-center p-6 bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-xl border-2 rounded-3xl transition-all duration-500"
                    style={{ 
                      borderColor: `${team.primary_color}40`,
                      animation: 'float 3s ease-in-out infinite',
                      animationDelay: `${index * 0.2}s`,
                    }}
                  >
                    <div className="relative mb-6">
                      <div 
                        className="absolute -inset-4 blur-xl opacity-50 animate-pulse"
                        style={{ backgroundColor: team.primary_color }}
                      />
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="relative w-32 h-32 object-contain shadow-xl"
                        />
                      ) : (
                        <div
                          className="relative w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold text-white ring-4 shadow-xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})`,
                            boxShadow: `0 0 0 4px ${team.primary_color}`
                          }}
                        >
                          {team.short_name?.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-display font-bold text-xl text-center text-foreground mb-2 leading-tight">
                      {team.name}
                    </h4>
                    
                    <div 
                      className="px-4 py-1.5 rounded-full text-sm font-semibold mb-3"
                      style={{ 
                        backgroundColor: `${team.primary_color}20`,
                        color: team.primary_color,
                        border: `1.5px solid ${team.primary_color}40`
                      }}
                    >
                      {team.short_name}
                    </div>

                    {team.owner_name && (
                      <div className="text-center mt-2">
                        <p className="text-xs text-muted-foreground">Owner</p>
                        <p className="text-sm font-semibold text-foreground">{team.owner_name}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : slideType === "team" && teams && teams.length > 0 ? (
          // Team Slide
          (() => {
            const teamIndex = currentSlideIndex - teamStartIndex;
            const team = teams[teamIndex];
            if (!team) return null;

            return (
              <div className="flex items-center justify-center gap-12 w-full max-w-7xl animate-fade-in">
                {/* Left - Team Logo */}
                <div className="w-96 flex items-center justify-center">
                  <div className="relative">
                    {/* Glow effects */}
                    <div 
                      className="absolute -inset-12 rounded-full blur-3xl opacity-70 animate-pulse"
                      style={{ 
                        backgroundColor: team.primary_color,
                      }}
                    />
                    
                    <div 
                      className="absolute -inset-8 rounded-full blur-xl opacity-40 animate-pulse"
                      style={{ 
                        backgroundColor: team.secondary_color,
                        animationDelay: '1s',
                      }}
                    />
                    
                    {team.logo_url ? (
                      <img 
                        src={team.logo_url} 
                        alt={team.name}
                        className="relative w-96 h-96 mx-auto object-contain shadow-2xl"
                      />
                    ) : (
                      <div
                        className="relative w-96 h-96 mx-auto rounded-3xl flex items-center justify-center text-9xl font-bold text-white shadow-2xl backdrop-blur-sm"
                        style={{ 
                          background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})`,
                        }}
                      >
                        {team.short_name?.substring(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right - Team Details */}
                <div className="flex-1">
                  <div 
                    className="inline-flex items-center justify-center px-6 py-2 rounded-full text-lg font-semibold shadow-lg mb-4"
                    style={{ 
                      backgroundColor: `${team.primary_color}25`,
                      color: team.primary_color,
                      border: `2px solid ${team.primary_color}60`
                    }}
                  >
                    {team.short_name}
                  </div>

                  <h3 className="font-display font-bold text-5xl md:text-6xl text-primary mb-6 leading-tight">
                    {team.name}
                  </h3>

                  <div className="space-y-6 text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      {team.description || 
                        `${team.name} is one of the four competing franchises in the Gold Coast Nepalese Premier League Season 2. With a talented roster and passionate fanbase, they're ready to compete for the championship.`
                      }
                    </p>
                    
                    <div className="pt-4 border-t border-border/50 space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-foreground w-32">Team Colors</span>
                        <div className="flex gap-3">
                          <div 
                            className="w-12 h-12 rounded-full ring-2 ring-border shadow-lg"
                            style={{ backgroundColor: team.primary_color }}
                          />
                          <div 
                            className="w-12 h-12 rounded-full ring-2 ring-border shadow-lg"
                            style={{ backgroundColor: team.secondary_color }}
                          />
                        </div>
                      </div>
                      
                      {team.owner_name && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-foreground w-32">Owner</span>
                          <span className="text-lg text-foreground font-medium">{team.owner_name}</span>
                        </div>
                      )}
                      
                      {team.manager_name && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-foreground w-32">Manager</span>
                          <span className="text-lg text-foreground font-medium">{team.manager_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : slideType === "acquisition" && teamsWithAcquisitions.length > 0 ? (
          // Player acquisitions per team (retained + auction wins)
          (() => {
            const acquisitionIndex = currentSlideIndex - acquisitionStartIndex;
            const group = teamsWithAcquisitions[acquisitionIndex];
            if (!group || !group.team) return null;

            // Split auctioned players into chunks of 5 for multiple columns
            const auctionChunks = (() => {
              const list = group.acquired || [];
              const chunks = [] as typeof list[];
              for (let i = 0; i < list.length; i += 5) {
                chunks.push(list.slice(i, i + 5));
              }
              return chunks.length ? chunks : [[]];
            })();

            return (
              <div className="w-full max-w-6xl mx-auto animate-fade-in">
                <div className="flex items-center justify-center gap-4 mb-8 flex-wrap text-center">
                  {group.team.logo_url ? (
                    <img
                      src={group.team.logo_url}
                      alt={group.team.name}
                      className="w-16 h-16 rounded-full object-contain"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ backgroundColor: group.team.primary_color || '#f59e0b' }}
                    >
                      {group.team.short_name?.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Player Acquisition</p>
                    <h3 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-1">
                      {group.team.name}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Retained */}
                  <div className="bg-card/80 border border-border rounded-2xl p-5 shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg text-foreground">Retained</h4>
                      <span className="text-xs uppercase tracking-wide px-3 py-1 rounded-full" style={{ backgroundColor: `#22c55e1A`, color: '#22c55e', border: `1px solid #22c55e55` }}>
                        {group.retained.length} players
                      </span>
                    </div>
                    {group.retained.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Waiting for updates…</p>
                    ) : (
                      <div className="space-y-3">
                        {group.retained.map((acq) => (
                          <div key={acq.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/70">
                            <div className="w-12 h-12 rounded-full bg-white overflow-hidden ring-2 ring-border">
                              {acq.player?.photo_url ? (
                                <img src={acq.player.photo_url} alt={acq.player.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted">{acq.player?.full_name?.[0]}</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground leading-tight">{acq.player?.full_name}</p>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">{acq.player?.role?.replace("_", " ")}</p>
                            </div>
                            <div className="text-right">
                              {acq.base_price ? (
                                <p className="text-sm text-muted-foreground">Base ${acq.base_price.toLocaleString()}</p>
                              ) : null}
                              <span className="text-[10px] px-2 py-1 rounded-full inline-block mt-1" style={{ backgroundColor: `#22c55e1A`, color: '#22c55e', border: `1px solid #22c55e40` }}>Retained</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Auctioned chunks */}
                  {auctionChunks.map((chunk, idx) => (
                    <div key={`auction-${idx}`} className="bg-card/80 border border-border rounded-2xl p-5 shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg text-foreground">Auctioned {auctionChunks.length > 1 ? `#${idx + 1}` : ''}</h4>
                        <span className="text-xs uppercase tracking-wide px-3 py-1 rounded-full" style={{ backgroundColor: `#f59e0b1A`, color: '#f59e0b', border: `1px solid #f59e0b55` }}>
                          {chunk.length} players
                        </span>
                      </div>

                      {chunk.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Waiting for updates…</p>
                      ) : (
                        <div className="space-y-3">
                          {chunk.map((acq) => (
                            <div key={acq.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/70">
                              <div className="w-12 h-12 rounded-full bg-white overflow-hidden ring-2 ring-border">
                                {acq.player?.photo_url ? (
                                  <img src={acq.player.photo_url} alt={acq.player.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted">{acq.player?.full_name?.[0]}</div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground leading-tight">{acq.player?.full_name}</p>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{acq.player?.role?.replace("_", " ")}</p>
                              </div>
                              <div className="text-right">
                                {acq.sold_price ? (
                                  <p className="text-sm font-semibold">${acq.sold_price.toLocaleString()}</p>
                                ) : acq.base_price ? (
                                  <p className="text-sm text-muted-foreground">Base ${acq.base_price.toLocaleString()}</p>
                                ) : null}
                                <span className="text-[10px] px-2 py-1 rounded-full inline-block mt-1" style={{ backgroundColor: `#f59e0b1A`, color: '#f59e0b', border: `1px solid #f59e0b40` }}>Sold</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : slideType === "sponsors" && sponsors && sponsors.length > 0 ? (
          // Sponsor Slide (individual)
          (() => {
            const sponsorIndex = currentSlideIndex - sponsorsStartIndex;
            const currentSponsor = sponsors[sponsorIndex];
            
            if (!currentSponsor) return null;
            
            return (
              <div className="flex items-center justify-center gap-12 w-full max-w-7xl animate-fade-in">
                {/* Left - Sponsor Logo */}
                <div className="w-96 flex items-center justify-center">
                  <div className="relative">
                    {/* Glow effects */}
                    <div 
                      className="absolute -inset-12 rounded-full blur-3xl opacity-50 animate-pulse"
                      style={{ 
                        backgroundColor: '#fbbf24',
                      }}
                    />
                    
                    <div 
                      className="absolute -inset-8 rounded-full blur-xl opacity-30 animate-pulse"
                      style={{ 
                        backgroundColor: '#f59e0b',
                        animationDelay: '1s',
                      }}
                    />
                    
                    {currentSponsor.logo_url ? (
                      <div className="relative w-72 h-72 rounded-3xl bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl ring-8 ring-secondary/40 flex items-center justify-center p-8">
                        <img 
                          src={currentSponsor.logo_url} 
                          alt={currentSponsor.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="relative w-72 h-72 rounded-3xl bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm shadow-2xl ring-8 ring-secondary/40 flex items-center justify-center">
                        <Award className="w-32 h-32 text-secondary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right - Sponsor Details */}
                <div className="flex-1">
                  {currentSponsor.tier && (
                    <div 
                      className="inline-flex items-center justify-center px-6 py-2 rounded-full text-lg font-semibold shadow-lg mb-4"
                      style={{ 
                        backgroundColor: '#fbbf2425',
                        color: '#fbbf24',
                        border: '2px solid #fbbf2460'
                      }}
                    >
                      {currentSponsor.tier}
                    </div>
                  )}

                  <h3 className="font-display font-bold text-5xl md:text-6xl text-secondary mb-6 leading-tight">
                    {currentSponsor.name}
                  </h3>

                  <div className="space-y-6 text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      {currentSponsor.description || 
                        `${currentSponsor.name} is a proud sponsor of the Gold Coast Nepalese Premier League Season 2, supporting the growth of cricket in our community.`
                      }
                    </p>
                    
                    <div className="pt-4 border-t border-border/50 space-y-4">
                      {currentSponsor.tier && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-foreground w-32">Sponsorship Tier</span>
                          <span className="text-lg text-foreground font-medium">{currentSponsor.tier}</span>
                        </div>
                      )}
                      
                      {currentSponsor.website && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-foreground w-32">Website</span>
                          <span className="text-lg text-secondary font-medium">{currentSponsor.website}</span>
                        </div>
                      )}

                      <div className="pt-4">
                        <p className="text-sm text-muted-foreground italic">
                          Thank you for your continued support in making GCNPL Season 2 a success!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : slideType === "owner" && teamsWithOwners.length > 0 ? (
          // Individual Owner Slide
          (() => {
            const ownerIndex = currentSlideIndex - ownersStartIndex;
            const currentTeam = teamsWithOwners[ownerIndex];
            const ownerData = owners?.find(o => o.id === currentTeam?.owner_id);
            
            if (!currentTeam) return null;
            
            return (
              <div className="flex items-center justify-center gap-12 w-full max-w-7xl animate-fade-in">
                {/* Left - Owner Picture + Team Logo */}
                <div className="w-96 flex flex-col items-center justify-center gap-6">
                  {/* Owner Picture/Avatar */}
                  <div className="relative">
                    <div 
                      className="absolute -inset-12 rounded-full blur-3xl opacity-50 animate-pulse"
                      style={{ backgroundColor: currentTeam.primary_color }}
                    />
                    <div 
                      className="absolute -inset-8 rounded-full blur-xl opacity-30 animate-pulse"
                      style={{ 
                        backgroundColor: currentTeam.secondary_color,
                        animationDelay: '1s',
                      }}
                    />
                    
                    {ownerData?.photo_url ? (
                      <img 
                        src={ownerData.photo_url} 
                        alt={ownerData.name || "Owner"}
                        className="relative w-64 h-64 rounded-full object-cover shadow-2xl backdrop-blur-sm"
                      />
                    ) : (
                      <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-sm shadow-2xl flex items-center justify-center">
                        <Users className="w-28 h-28 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {/* Team Logo */}
                  <div className="relative">
                    {currentTeam.logo_url ? (
                      <img 
                        src={currentTeam.logo_url} 
                        alt={currentTeam.name}
                        className="w-48 h-48 rounded-full object-cover shadow-xl"
                      />
                    ) : (
                      <div
                        className="w-48 h-48 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl"
                        style={{ 
                          background: `linear-gradient(135deg, ${currentTeam.primary_color}, ${currentTeam.secondary_color})`
                        }}
                      >
                        {currentTeam.short_name?.substring(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right - Owner Details */}
                <div className="flex-1">
                  <div 
                    className="inline-flex items-center justify-center px-6 py-2 rounded-full text-lg font-semibold shadow-lg mb-4"
                    style={{ 
                      backgroundColor: `${currentTeam.primary_color}25`,
                      color: currentTeam.primary_color,
                      border: `2px solid ${currentTeam.primary_color}60`
                    }}
                  >
                    Team Owner
                  </div>

                  <h3 className="font-display font-bold text-5xl md:text-6xl text-primary mb-4 leading-tight">
                    {ownerData?.name || currentTeam.owner_name}
                  </h3>

                  <p className="text-2xl text-muted-foreground mb-6">
                    Owner of <span className="text-foreground font-semibold">{currentTeam.name}</span>
                  </p>

                  <div className="space-y-6 text-muted-foreground">
                    <p className="text-lg leading-relaxed">
                      {(ownerData?.name || currentTeam.owner_name) ?? "Owner"} leads {currentTeam.name} with passion and dedication, bringing together talented players and building a strong franchise in the Gold Coast Nepalese Premier League Season 2.
                    </p>
                    
                    <div className="pt-4 border-t border-border/50 space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-foreground w-32">Team</span>
                        <span className="text-lg text-foreground font-medium">{currentTeam.name}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-foreground w-32">Short Name</span>
                        <span className="text-lg font-medium" style={{ color: currentTeam.primary_color }}>
                          {currentTeam.short_name}
                        </span>
                      </div>
                      
                      {currentTeam.manager_name && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-foreground w-32">Team Manager</span>
                          <span className="text-lg text-foreground font-medium">{currentTeam.manager_name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-foreground w-32">Team Colors</span>
                        <div className="flex gap-3">
                          <div 
                            className="w-12 h-12 rounded-full ring-2 ring-border shadow-lg"
                            style={{ backgroundColor: currentTeam.primary_color }}
                          />
                          <div 
                            className="w-12 h-12 rounded-full ring-2 ring-border shadow-lg"
                            style={{ backgroundColor: currentTeam.secondary_color }}
                          />
                        </div>
                      </div>

                      {ownerData?.business_name && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-foreground w-32">Business</span>
                          <span className="text-lg text-foreground font-medium">{ownerData.business_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : slideType === "top-bids" && topBids?.data && topBids.data.length > 0 ? (
          // Top bid players live slide
          <div className="w-full max-w-6xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Live Auction Stats</p>
              <h3 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2">Top 5 Bids</h3>
              <p className="text-muted-foreground mt-2">Updates as players get sold</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {topBids.data.map((bid, idx) => (
                <div key={bid.id} className="relative overflow-hidden rounded-2xl border border-border bg-card/85 shadow-lg p-4">
                  <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle at 30% 20%, #f59e0b, transparent 45%)" }} />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-white overflow-hidden ring-2 ring-border">
                      {bid.player?.photo_url ? (
                        <img src={bid.player.photo_url} alt={bid.player.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted">{bid.player?.full_name?.[0]}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground leading-tight">{bid.player?.full_name}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{bid.player?.role?.replace("_", " ")}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-primary">${bid.sold_price?.toLocaleString() || "-"}</span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/40 mt-1">Rank #{idx + 1}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {bid.team?.logo_url ? (
                        <img src={bid.team.logo_url} alt={bid.team.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">{bid.team?.name?.[0]}</div>
                      )}
                      <span className="font-medium text-foreground">{bid.team?.name}</span>
                    </div>
                    <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">{bid.auction_status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-xl font-medium">Content will be announced soon</p>
          </div>
        )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className={`relative z-10 pb-8 flex items-center justify-center gap-6 transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <Button
          variant="outline"
          size="lg"
          onClick={goToPrevSlide}
          className="rounded-full w-14 h-14 p-0 bg-card/80 backdrop-blur-sm border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/60 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsPaused(!isPaused)}
          className="rounded-full w-14 h-14 p-0 bg-card/80 backdrop-blur-sm border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/60 transition-all"
        >
          {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={goToNextSlide}
          className="rounded-full w-14 h-14 p-0 bg-card/80 backdrop-blur-sm border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/60 transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10 transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlideIndex(index);
              updateSlideType(index);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              currentSlideIndex === index 
                ? 'bg-primary w-8' 
                : 'bg-primary/30 hover:bg-primary/50'
            }`}
          />
        ))}
      </div>

      {/* Custom CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes scale-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes slide-fade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-fade {
          animation: slide-fade 450ms ease;
        }
      `}</style>
    </div>
  );
}
