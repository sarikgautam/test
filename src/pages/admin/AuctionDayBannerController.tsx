import { useMemo } from "react";
import BudgetStatusAdmin from "@/components/admin/BudgetStatusAdmin";
import BudgetStatusMini from "@/components/admin/BudgetStatusMini";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeason } from "@/hooks/useSeason";

// This table should exist in Supabase: auction_banner_state (id, season_id, current_slide, is_paused)
// You may need to create it if not present.

export default function AuctionDayBannerController() {
  const { selectedSeasonId } = useSeason();
  const queryClient = useQueryClient();

  // Fetch current banner state
  const { data: bannerState, isLoading } = useQuery({
    queryKey: ["auction-banner-state", selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return null;
      const { data, error } = await supabase
        .from("auction_banner_state")
        .select("*")
        .eq("season_id", selectedSeasonId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSeasonId,
    refetchInterval: 2000,
  });

  // Fetch all data needed for slide previews (mimic AuctionDayBanner)
  const { data: season } = useQuery({
    queryKey: ["active-season-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name")
        .eq("id", selectedSeasonId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSeasonId,
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSeasonId,
  });

  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery({
    queryKey: ["sponsors-showcase", season?.id],
    queryFn: async () => {
      if (!season?.id) return [];
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .eq("season_id", season.id)
        .order("tier", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!season?.id,
  });

  const { data: owners = [], isLoading: ownersLoading } = useQuery({
    queryKey: ["owners-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owners")
        .select("id, name, photo_url, business_name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSeasonId,
  });

  const { data: supportClubs = [], isLoading: supportLoading } = useQuery({
    queryKey: ["support-clubs-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_club")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSeasonId,
  });

  const { data: acquisitions } = useQuery({
    queryKey: ["auction-acquisitions", season?.id],
    enabled: !!season?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(
          `id, team_id, auction_status, sold_price, base_price,
           team:teams(id, name, short_name, logo_url, primary_color),
           player:players(id, full_name, role, photo_url)`
        )
        .eq("season_id", season!.id)
        .in("auction_status", ["sold", "retained"]);
      if (error) throw error;
      return { data };
    },
  });

  const { data: topBids } = useQuery({
    queryKey: ["auction-top-bids", season?.id],
    enabled: !!season?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_season_registrations")
        .select(
          `id, sold_price, auction_status,
           team:teams(id, name, logo_url),
           player:players(id, full_name, role, photo_url)`
        )
        .eq("season_id", season!.id)
        .not("sold_price", "is", null)
        .order("sold_price", { ascending: false })
        .limit(12);
      if (error) throw error;
      return { data };
    },
  });

  // Group acquisitions by team (mimic AuctionDayBanner)
  const teamsWithAcquisitions = useMemo(() => {
    if (!acquisitions?.data) return [];
    const grouped = {};
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

  // Slide sequencing logic (mimic AuctionDayBanner)
  const teamsWithOwners = teams.filter((t) => t.owner_id);
  const ownersCount = teamsWithOwners.length;
  const teamsCount = teams.length;
  const acquisitionsCount = teamsWithAcquisitions.length;
  const sponsorsCount = sponsors.length;
  const totalSlides = 3 + teamsCount + acquisitionsCount + sponsorsCount + ownersCount + 1;

  // Build slide list for preview grid
  const slideList = useMemo(() => {
    const slides = [];
    slides.push({ type: "intro", label: "Intro" });
    slides.push({ type: "support", label: "Support Clubs" });
    slides.push({ type: "all-teams", label: "All Teams" });
    for (let i = 0; i < teamsCount; i++) {
      slides.push({ type: "team", label: teams[i]?.name || `Team ${i+1}`, team: teams[i] });
    }
    for (let i = 0; i < acquisitionsCount; i++) {
      slides.push({ type: "acquisition", label: teamsWithAcquisitions[i]?.team?.name || `Acquisition ${i+1}`, team: teamsWithAcquisitions[i]?.team });
    }
    for (let i = 0; i < sponsorsCount; i++) {
      slides.push({ type: "sponsors", label: sponsors[i]?.name || `Sponsor ${i+1}`, sponsor: sponsors[i] });
    }
    for (let i = 0; i < ownersCount; i++) {
      slides.push({ type: "owner", label: teamsWithOwners[i]?.name || `Owner ${i+1}`, team: teamsWithOwners[i] });
    }
    slides.push({ type: "top-bids", label: "Top Bids" });
    slides.push({ type: "budget", label: "Team Budgets" });
    return slides;
  }, [teams, sponsors, teamsWithAcquisitions, teamsWithOwners]);

  // Mutations to update state
  const updateState = useMutation({
    mutationFn: async (updates: { current_slide?: number; is_paused?: boolean }) => {
      if (!selectedSeasonId) return;
      const { error } = await supabase
        .from("auction_banner_state")
        .update(updates)
        .eq("season_id", selectedSeasonId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(["auction-banner-state", selectedSeasonId]),
  });


  if (!selectedSeasonId) return <div>Select a season</div>;
  if (isLoading || teamsLoading || sponsorsLoading || ownersLoading || supportLoading) return <div className="p-8 flex justify-center"><Skeleton className="w-96 h-32" /></div>;
  if (!bannerState) return <div>No banner state found for this season.</div>;

  return (
    <>
      <Card className="max-w-5xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-bold mb-4">Auction Day Banner Controller</h2>
      <div className="mb-4">
        <span className="font-semibold">Current Slide:</span> {bannerState.current_slide}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Paused:</span> {bannerState.is_paused ? "Yes" : "No"}
      </div>
      <div className="flex gap-4 mb-4">
        <Button onClick={() => updateState.mutate({ is_paused: !bannerState.is_paused })}>
          {bannerState.is_paused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={() => updateState.mutate({ current_slide: Math.max(0, (bannerState.current_slide || 0) - 1) })}>
          Previous Slide
        </Button>
        <Button onClick={() => updateState.mutate({ current_slide: Math.min(totalSlides - 1, (bannerState.current_slide || 0) + 1) })}>
          Next Slide
        </Button>
        <Button
          variant="secondary"
          onClick={() => updateState.mutate({ is_paused: false, current_slide: 0 })}
        >
          Set On Loop
        </Button>
        <Button
          variant="secondary"
          onClick={() => updateState.mutate({ is_paused: false })}
        >
          Continue Slides
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mb-6">(This controls the AuctionDayBannerTest page in real time.)</div>

      {/* Mini Budget Bar for Slide Controller */}
      <BudgetStatusMini onBudgetClick={() => {
        // Find the index of the budget slide in slideList
        const budgetIdx = slideList.findIndex(slide => slide.type === 'budget');
        if (budgetIdx !== -1) {
          updateState.mutate({ current_slide: budgetIdx });
        }
      }} />
      <div className="mb-2 font-semibold text-lg">Slide Previews</div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {slideList.map((slide, idx) => (
          <button
            key={idx}
            className={`relative group border rounded-xl p-2 flex flex-col items-center justify-center transition-all duration-200 shadow-sm bg-white/80 dark:bg-card/80 hover:ring-2 hover:ring-primary focus:outline-none ${bannerState.current_slide === idx ? 'ring-4 ring-primary scale-105 z-10' : 'ring-1 ring-border'}`}
            style={{ minHeight: 110 }}
            onClick={() => updateState.mutate({ current_slide: idx })}
          >
            {/* Preview content by type */}
            {slide.type === 'intro' && (
              <div className="flex flex-col items-center gap-2">
                <span className="font-bold text-primary text-lg">Intro</span>
                <span className="text-xs text-muted-foreground">GCNPL Auction</span>
              </div>
            )}
            {slide.type === 'support' && (
              <div className="flex flex-col items-center gap-2">
                <span className="font-bold text-secondary text-lg">Support</span>
                <span className="text-xs text-muted-foreground">Support Clubs</span>
              </div>
            )}
            {slide.type === 'all-teams' && (
              <div className="flex flex-col items-center gap-2">
                <span className="font-bold text-amber-600 text-lg">All Teams</span>
                <span className="text-xs text-muted-foreground">Teams Overview</span>
              </div>
            )}
            {slide.type === 'team' && slide.team && (
              <div className="flex flex-col items-center gap-2">
                {slide.team.logo_url ? (
                  <img src={slide.team.logo_url} alt={slide.team.name} className="w-10 h-10 object-contain rounded-full border" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-white">{slide.team.short_name?.substring(0,2)}</div>
                )}
                <span className="font-semibold text-xs text-foreground text-center">{slide.team.name}</span>
                <span className="text-[10px] text-muted-foreground">Team</span>
              </div>
            )}
            {slide.type === 'acquisition' && slide.team && (
              <div className="flex flex-col items-center gap-2">
                {slide.team.logo_url ? (
                  <img src={slide.team.logo_url} alt={slide.team.name} className="w-10 h-10 object-contain rounded-full border" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-amber-500 text-white">{slide.team.short_name?.substring(0,2)}</div>
                )}
                <span className="font-semibold text-xs text-foreground text-center">{slide.team.name}</span>
                <span className="text-[10px] text-muted-foreground">Acquisitions</span>
              </div>
            )}
            {slide.type === 'sponsors' && slide.sponsor && (
              <div className="flex flex-col items-center gap-2">
                {slide.sponsor.logo_url ? (
                  <img src={slide.sponsor.logo_url} alt={slide.sponsor.name} className="w-10 h-10 object-contain rounded-xl border" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold bg-yellow-400 text-white"><span>★</span></div>
                )}
                <span className="font-semibold text-xs text-foreground text-center">{slide.sponsor.name}</span>
                <span className="text-[10px] text-muted-foreground">Sponsor</span>
              </div>
            )}
            {slide.type === 'owner' && slide.team && (
              <div className="flex flex-col items-center gap-2">
                {slide.team.logo_url ? (
                  <img src={slide.team.logo_url} alt={slide.team.name} className="w-10 h-10 object-contain rounded-full border" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white">{slide.team.short_name?.substring(0,2)}</div>
                )}
                <span className="font-semibold text-xs text-foreground text-center">{slide.team.name}</span>
                <span className="text-[10px] text-muted-foreground">Owner</span>
              </div>
            )}
            {slide.type === 'top-bids' && (
              <div className="flex flex-col items-center gap-2">
                <span className="font-bold text-green-700 text-lg">Top Bids</span>
                <span className="text-xs text-muted-foreground">Live Stats</span>
              </div>
            )}
            {/* Slide number badge */}
            <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold rounded-full px-2 py-0.5 shadow">{idx+1}</span>
            {/* Current indicator */}
            {bannerState.current_slide === idx && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">Current</span>
            )}
          </button>
        ))}
      </div>
      </Card>
    </>
  );
}
