import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useSeason";

export default function BudgetSlide() {
  const { activeSeason } = useActiveSeason();
  const { data: teams, isLoading } = useQuery({
    queryKey: ["auction-budget-slide", activeSeason?.id],
    queryFn: async () => {
      if (!activeSeason?.id) return [];
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, short_name, budget, remaining_budget, logo_url")
        .order("name");
      if (teamsError) throw teamsError;
      const { data: soldPlayers, error: soldError } = await supabase
        .from("player_season_registrations")
        .select("team_id, sold_price, residency_type")
        .eq("season_id", activeSeason.id)
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
    enabled: !!activeSeason?.id,
    refetchInterval: 3000,
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-10 bg-white/95 rounded-3xl shadow-2xl">
      <h2 className="text-4xl font-extrabold text-center mb-10 text-primary tracking-tight">Team Budgets</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {isLoading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 w-full bg-muted rounded-lg animate-pulse" />
            ))
          : teams?.map((team: any) => (
              <div key={team.id} className="bg-card rounded-2xl shadow-xl p-8 flex flex-col items-center border-2 border-primary/30 min-h-[270px]">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-28 h-28 object-contain mb-4 rounded-full bg-white border-2 border-primary/40" />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center rounded-full bg-muted mb-4 text-4xl font-extrabold text-primary">
                    {team.short_name?.substring(0, 2) || team.name[0]}
                  </div>
                )}
                <div className="font-extrabold text-2xl text-primary mb-2 text-center">{team.name}</div>
                <div className="flex flex-col gap-2 w-full text-lg">
                  <div className="flex justify-between"><span>Total:</span> <span>${team.budget?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Spent:</span> <span className="text-red-600">${team.spent?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Remaining:</span> <span className="text-green-700">${team.remaining?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>QLD Spent:</span> <span className="text-blue-700">${team.qld_spent?.toLocaleString()}</span></div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
