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
import AuctionDayBanner from "./pages/AuctionDayBanner";
import Sponsors from "./pages/Sponsors";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import SeasonsAdmin from "./pages/admin/SeasonsAdmin";
import TeamsAdmin from "./pages/admin/TeamsAdmin";
import PlayersAdmin from "./pages/admin/PlayersAdmin";
import PlayersImportAdmin from "./pages/admin/PlayersImportAdmin";
import SeasonMigrationAdmin from "./pages/admin/SeasonMigrationAdmin";
import RegistrationReviewAdmin from "./pages/admin/RegistrationReviewAdmin";
import MatchesAdmin from "./pages/admin/MatchesAdmin";
import StandingsAdmin from "./pages/admin/StandingsAdmin";
import StatsAdmin from "./pages/admin/StatsAdmin";
import MatchResultsAdmin from "./pages/admin/MatchResultsAdmin";
import AwardsAdmin from "./pages/admin/AwardsAdmin";
import AuctionAdmin from "./pages/admin/AuctionAdmin";
import SponsorsAdmin from "./pages/admin/SponsorsAdmin";
import GalleryAdmin from "./pages/admin/GalleryAdmin";
import ContactAdmin from "./pages/admin/ContactAdmin";
import MessagesAdmin from "./pages/admin/MessagesAdmin";
import FooterAdmin from "./pages/admin/FooterAdmin";
import NewsAdmin from "./pages/admin/NewsAdmin";
import OwnersAdmin from "./pages/admin/OwnersAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import LiveScoring from "./pages/admin/LiveScoring";
import Broadcast from "./pages/Broadcast";

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
              <Route path="/auction-day-banner" element={<AuctionDayBanner />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/broadcast" element={<Broadcast />} />
              
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="seasons" element={<SeasonsAdmin />} />
                <Route path="teams" element={<TeamsAdmin />} />
                <Route path="owners" element={<OwnersAdmin />} />
                <Route path="players" element={<PlayersAdmin />} />
                <Route path="players-import" element={<PlayersImportAdmin />} />
                <Route path="registration-review" element={<RegistrationReviewAdmin />} />
                <Route path="season-migration" element={<SeasonMigrationAdmin />} />
                <Route path="matches" element={<MatchesAdmin />} />
                <Route path="results" element={<MatchResultsAdmin />} />
                <Route path="awards" element={<AwardsAdmin />} />
                <Route path="standings" element={<StandingsAdmin />} />
                <Route path="stats" element={<StatsAdmin />} />
                <Route path="auction" element={<AuctionAdmin />} />
                <Route path="live-scoring" element={<LiveScoring />} />
                <Route path="sponsors" element={<SponsorsAdmin />} />
                <Route path="gallery" element={<GalleryAdmin />} />
                <Route path="news" element={<NewsAdmin />} />
                <Route path="contact" element={<ContactAdmin />} />
                <Route path="messages" element={<MessagesAdmin />} />
                <Route path="footer" element={<FooterAdmin />} />
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
