import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { ChampionsSection } from "@/components/home/ChampionsSection";
import { UpcomingMatches } from "@/components/home/UpcomingMatches";
import { TeamsShowcase } from "@/components/home/TeamsShowcase";
import { StandingsPreview } from "@/components/home/StandingsPreview";
import { StatsPreview } from "@/components/home/StatsPreview";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { NewsSection } from "@/components/home/NewsSection";
import { ContactSection } from "@/components/home/ContactSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <ChampionsSection />
      <TeamsShowcase />
      <UpcomingMatches />
      <StandingsPreview />
      <StatsPreview />
      <GalleryPreview />
      <NewsSection />
      <ContactSection />
      <SponsorsSection />
    </Layout>
  );
};

export default Index;
