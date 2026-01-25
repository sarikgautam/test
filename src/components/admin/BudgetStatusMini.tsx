import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSeason } from "@/hooks/useSeason";

export default function BudgetStatusMini({ onBudgetClick }: { onBudgetClick?: () => void } = {}) {
  const { selectedSeasonId } = useSeason();
  const { data: teams, isLoading } = useQuery({
    queryKey: ["auction-budget-mini", selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return [];
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, short_name, budget, remaining_budget, logo_url")
        .order("name");
      if (teamsError) throw teamsError;
      const { data: soldPlayers, error: soldError } = await supabase
        .from("player_season_registrations")
        .select("team_id, sold_price, residency_type")
        .eq("season_id", selectedSeasonId)
        .eq("auction_status", "sold")
        .not("team_id", "is", null);
      if (soldError) throw soldError;
      return teamsData.map((team) => {
        let teamSpent = 0;
        soldPlayers?.forEach((p) => {
          if (p.team_id === team.id) {
            teamSpent += p.sold_price || 0;
          }
        });
        return {
          ...team,
          spent: teamSpent,
          remaining: team.budget - teamSpent,
        };
      });
    },
    enabled: !!selectedSeasonId,
    refetchInterval: 3000,
  });

  return (
    <div className="w-full mb-2">
      <div className="flex flex-wrap gap-2 justify-center">
        {isLoading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-muted rounded animate-pulse" />
            ))
          : (
            <button
              className="flex items-center gap-1 px-2 py-1 bg-card rounded border border-primary/20 text-xs hover:bg-primary/10 transition cursor-pointer"
              onClick={onBudgetClick}
              style={{ outline: 'none', border: '2px solid #f59e0b', fontWeight: 700 }}
              title="Show Budget Slide"
            >
              <span className="font-bold text-primary">Show Budgets</span>
            </button>
          )}
        {teams?.map((team: any) => (
          <div key={team.id} className="flex items-center gap-1 px-2 py-1 bg-card rounded border border-primary/20 text-xs">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-5 h-5 object-contain rounded-full bg-white border border-primary/30 mr-1" />
            ) : (
              <div className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-[10px] font-bold text-primary mr-1">
                {team.short_name?.substring(0, 2) || team.name[0]}
              </div>
            )}
            <span className="font-bold text-primary">{team.short_name || team.name}</span>
            <span className="ml-1 text-muted-foreground">${team.remaining?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
