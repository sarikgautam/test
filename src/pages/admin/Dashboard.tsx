import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Calendar, Trophy, TrendingUp, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [teamsRes, playersRes, matchesRes, registeredRes] = await Promise.all([
        supabase.from("teams").select("id, remaining_budget", { count: "exact" }),
        supabase.from("players").select("id, auction_status, sold_price", { count: "exact" }),
        supabase.from("matches").select("id, status", { count: "exact" }),
        supabase.from("players").select("id").eq("auction_status", "registered"),
      ]);

      const totalBudgetSpent = playersRes.data?.reduce(
        (acc, p) => acc + (p.sold_price || 0),
        0
      ) || 0;

      const soldPlayers = playersRes.data?.filter(p => p.auction_status === "sold").length || 0;
      const completedMatches = matchesRes.data?.filter(m => m.status === "completed").length || 0;

      return {
        teams: teamsRes.count || 0,
        players: playersRes.count || 0,
        matches: matchesRes.count || 0,
        registeredForAuction: registeredRes.data?.length || 0,
        soldPlayers,
        completedMatches,
        totalBudgetSpent,
      };
    },
  });

  const statCards = [
    {
      title: "Total Teams",
      value: stats?.teams || 0,
      icon: Shield,
      color: "text-primary",
      bgColor: "bg-primary/20",
    },
    {
      title: "Registered Players",
      value: stats?.players || 0,
      icon: Users,
      color: "text-cricket-green",
      bgColor: "bg-cricket-green/20",
    },
    {
      title: "Awaiting Auction",
      value: stats?.registeredForAuction || 0,
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-500/20",
    },
    {
      title: "Sold Players",
      value: stats?.soldPlayers || 0,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/20",
    },
    {
      title: "Total Matches",
      value: stats?.matches || 0,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "Completed Matches",
      value: stats?.completedMatches || 0,
      icon: Trophy,
      color: "text-purple-500",
      bgColor: "bg-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-gradient-gold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of the Gold Coast Nepalese Premier League
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
          : statCards.map((stat) => (
              <Card key={stat.title} className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/players"
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">Manage Players</span>
            </a>
            <a
              href="/admin/matches"
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center"
            >
              <Calendar className="w-8 h-8 mx-auto mb-2 text-cricket-green" />
              <span className="text-sm font-medium">Schedule Match</span>
            </a>
            <a
              href="/admin/auction"
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center"
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <span className="text-sm font-medium">Run Auction</span>
            </a>
            <a
              href="/admin/standings"
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center"
            >
              <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <span className="text-sm font-medium">Update Standings</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
