import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useSeason";

export function useAuctionBannerControl() {
  const { activeSeason } = useActiveSeason();
  const { data: control, isLoading } = useQuery({
    queryKey: ["auction-banner-state", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return null;
      const { data, error } = await supabase
        .from("auction_banner_state")
        .select("current_slide, is_paused")
        .eq("season_id", activeSeason.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeSeason?.id,
    refetchInterval: 2000,
  });
  return { control, isLoading };
}
