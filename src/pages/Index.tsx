import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { UpcomingMatches } from "@/components/home/UpcomingMatches";
import { TeamsShowcase } from "@/components/home/TeamsShowcase";
import { StandingsPreview } from "@/components/home/StandingsPreview";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { NewsSection } from "@/components/home/NewsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { RegistrationCTA } from "@/components/home/RegistrationCTA";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <UpcomingMatches />
      <TeamsShowcase />
      <StandingsPreview />
      <SponsorsSection />
      <GalleryPreview />
      <NewsSection />
      <ContactSection />
      <RegistrationCTA />
    </Layout>
  );
};

export default Index;
