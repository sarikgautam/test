import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, Users, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import gcnplLogo from "@/assets/gcnpl-logo.png";

type SlideType = "intro" | "support" | "team" | "sponsors" | "owner" | "all-teams";

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
        .select("name")
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Calculate total slides: intro + support + teams + sponsors + individual owners + all-teams slide
  const ownersCount = teams?.filter(t => t.owner_id).length || 0;
  const totalSlides = 2 + (teams?.length || 0) + (sponsors?.length || 0) + ownersCount + 1;

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
    
    if (index === 0) {
      setSlideType("intro");
    } else if (index === 1) {
      setSlideType("support");
    } else if (index === 2) {
      setSlideType("all-teams");
    } else if (index <= 2 + teamsCount) {
      setSlideType("team");
    } else if (index <= 2 + teamsCount + sponsorsCount) {
      setSlideType("sponsors");
    } else {
      setSlideType("owner");
    }
  };

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
              className="relative w-16 h-16 md:w-20 md:h-20 object-contain rounded-full ring-2 ring-primary/30 bg-card/50 backdrop-blur-sm p-2"
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
                className="relative w-64 h-64 object-contain drop-shadow-2xl"
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
                        className="absolute -inset-4 rounded-full blur-xl opacity-50 animate-pulse"
                        style={{ backgroundColor: team.primary_color }}
                      />
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="relative w-32 h-32 rounded-full object-cover ring-4 shadow-xl"
                          style={{ boxShadow: `0 0 0 4px ${team.primary_color}` }}
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
        ) : slideType === "sponsors" && sponsors && sponsors.length > 0 ? (
          // Sponsor Slide (individual)
          (() => {
            const sponsorIndex = currentSlideIndex - (teams?.length || 0) - 3; // Adjusted for intro, support, and all-teams slides
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
        ) : slideType === "owner" && teams && teams.length > 0 ? (
          // Individual Owner Slide
          (() => {
            const teamsWithOwners = teams.filter(t => t.owner_id);
            const ownerIndex = currentSlideIndex - (teams?.length || 0) - (sponsors?.length || 0) - 3; // Adjusted for intro, support, and all-teams slides
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
        ) : slideType === "all-teams" && teams && teams.length > 0 ? (
          // All Teams Summary Slide
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
                        className="absolute -inset-4 rounded-full blur-xl opacity-50 animate-pulse"
                        style={{ backgroundColor: team.primary_color }}
                      />
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="relative w-32 h-32 rounded-full object-cover ring-4 shadow-xl"
                          style={{ boxShadow: `0 0 0 4px ${team.primary_color}` }}
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
        ) : teams && teams.length > 0 && currentSlideIndex > 2 && teams[currentSlideIndex - 3] ? (
          // Team Slide
          <div className="flex items-center justify-center gap-12 w-full max-w-7xl animate-fade-in">
            {/* Left - Team Logo */}
            <div className="w-96 flex items-center justify-center">
              <div className="relative">
                {/* Glow effects */}
                <div 
                  className="absolute -inset-12 rounded-full blur-3xl opacity-70 animate-pulse"
                  style={{ 
                    backgroundColor: teams[currentSlideIndex - 3].primary_color,
                  }}
                />
                
                <div 
                  className="absolute -inset-8 rounded-full blur-xl opacity-40 animate-pulse"
                  style={{ 
                    backgroundColor: teams[currentSlideIndex - 3].secondary_color,
                    animationDelay: '1s',
                  }}
                />
                
                {teams[currentSlideIndex - 3].logo_url ? (
                  <img 
                    src={teams[currentSlideIndex - 3].logo_url} 
                    alt={teams[currentSlideIndex - 3].name}
                    className="relative w-96 h-96 mx-auto rounded-3xl object-cover shadow-2xl backdrop-blur-sm"
                  />
                ) : (
                  <div
                    className="relative w-96 h-96 mx-auto rounded-3xl flex items-center justify-center text-9xl font-bold text-white shadow-2xl backdrop-blur-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${teams[currentSlideIndex - 3].primary_color}, ${teams[currentSlideIndex - 3].secondary_color})`,
                    }}
                  >
                    {teams[currentSlideIndex - 3].short_name?.substring(0, 2)}
                  </div>
                )}
              </div>
            </div>

            {/* Right - Team Details */}
            <div className="flex-1">
              <div 
                className="inline-flex items-center justify-center px-6 py-2 rounded-full text-lg font-semibold shadow-lg mb-4"
                style={{ 
                  backgroundColor: `${teams[currentSlideIndex - 3].primary_color}25`,
                  color: teams[currentSlideIndex - 3].primary_color,
                  border: `2px solid ${teams[currentSlideIndex - 3].primary_color}60`
                }}
              >
                {teams[currentSlideIndex - 3].short_name}
              </div>

              <h3 className="font-display font-bold text-5xl md:text-6xl text-primary mb-6 leading-tight">
                {teams[currentSlideIndex - 3].name}
              </h3>

              <div className="space-y-6 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  {teams[currentSlideIndex - 3].description || 
                    `${teams[currentSlideIndex - 3].name} is one of the four competing franchises in the Gold Coast Nepalese Premier League Season 2. With a talented roster and passionate fanbase, they're ready to compete for the championship.`
                  }
                </p>
                
                <div className="pt-4 border-t border-border/50 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground w-32">Team Colors</span>
                    <div className="flex gap-3">
                      <div 
                        className="w-12 h-12 rounded-full ring-2 ring-border shadow-lg"
                        style={{ backgroundColor: teams[currentSlideIndex - 3].primary_color }}
                      />
                      <div 
                        className="w-12 h-12 rounded-full ring-2 ring-border shadow-lg"
                        style={{ backgroundColor: teams[currentSlideIndex - 3].secondary_color }}
                      />
                    </div>
                  </div>
                  
                  {teams[currentSlideIndex - 3].owner_name && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-foreground w-32">Owner</span>
                      <span className="text-lg text-foreground font-medium">{teams[currentSlideIndex - 3].owner_name}</span>
                    </div>
                  )}
                  
                  {teams[currentSlideIndex - 3].manager_name && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-foreground w-32">Manager</span>
                      <span className="text-lg text-foreground font-medium">{teams[currentSlideIndex - 3].manager_name}</span>
                    </div>
                  )}
                </div>
              </div>
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
