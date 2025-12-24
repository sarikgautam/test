import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Teams from "./pages/Teams";
import TeamDetails from "./pages/TeamDetails";
import Fixtures from "./pages/Fixtures";
import MatchScorecard from "./pages/MatchScorecard";
import Standings from "./pages/Standings";
import Stats from "./pages/Stats";
import Register from "./pages/Register";
import Auth from "./pages/Auth";
import Auction from "./pages/Auction";
import AuctionStats from "./pages/AuctionStats";
import Sponsors from "./pages/Sponsors";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import TeamsAdmin from "./pages/admin/TeamsAdmin";
import PlayersAdmin from "./pages/admin/PlayersAdmin";
import MatchesAdmin from "./pages/admin/MatchesAdmin";
import StandingsAdmin from "./pages/admin/StandingsAdmin";
import StatsAdmin from "./pages/admin/StatsAdmin";
import MatchResultsAdmin from "./pages/admin/MatchResultsAdmin";
import AwardsAdmin from "./pages/admin/AwardsAdmin";
import AuctionAdmin from "./pages/admin/AuctionAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:teamId" element={<TeamDetails />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/fixtures/:matchId" element={<MatchScorecard />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auction" element={<Auction />} />
              <Route path="/auction/stats" element={<AuctionStats />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="teams" element={<TeamsAdmin />} />
                <Route path="players" element={<PlayersAdmin />} />
                <Route path="matches" element={<MatchesAdmin />} />
                <Route path="results" element={<MatchResultsAdmin />} />
                <Route path="awards" element={<AwardsAdmin />} />
                <Route path="standings" element={<StandingsAdmin />} />
                <Route path="stats" element={<StatsAdmin />} />
                <Route path="auction" element={<AuctionAdmin />} />
                <Route path="settings" element={<SettingsAdmin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
