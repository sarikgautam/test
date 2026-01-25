import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSeason } from "@/hooks/useSeason";

export default function BudgetStatusAdmin() {
  const { selectedSeasonId } = useSeason();
  const { data: teams, isLoading } = useQuery({
    queryKey: ["auction-budget-admin", selectedSeasonId],
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
        let qldSpent = 0;
        soldPlayers?.forEach((p) => {
          if (p.team_id === team.id) {
            teamSpent += p.sold_price || 0;
            if (p.residency_type === "qld-other") {
              qldSpent += p.sold_price || 0;
            }
          }
        });
        return {
          ...team,
          spent: teamSpent,
          remaining: team.budget - teamSpent,
          qld_spent: qldSpent,
        };
      });
    },
    enabled: !!selectedSeasonId,
    refetchInterval: 3000,
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white/90 rounded-2xl shadow mb-8">
      <h3 className="text-xl font-bold text-center mb-4 text-primary">Team Budgets</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 w-full bg-muted rounded-lg animate-pulse" />
            ))
          : teams?.map((team: any) => (
              <div key={team.id} className="bg-card rounded-xl shadow p-2 flex flex-col items-center border border-primary/20">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-10 h-10 object-contain mb-1 rounded-full bg-white border border-primary/30" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted mb-1 text-base font-bold text-primary">
                    {team.short_name?.substring(0, 2) || team.name[0]}
                  </div>
                )}
                <div className="font-bold text-sm text-primary mb-0.5 text-center">{team.name}</div>
                <div className="flex flex-col gap-0.5 w-full text-xs">
                  <div className="flex justify-between"><span>Total:</span> <span>${team.budget?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Spent:</span> <span className="text-red-600">${team.spent?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Rem.:</span> <span className="text-green-700">${team.remaining?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>QLD:</span> <span className="text-blue-700">${team.qld_spent?.toLocaleString()}</span></div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
