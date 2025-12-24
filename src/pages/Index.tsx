import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { UpcomingMatches } from "@/components/home/UpcomingMatches";
import { TeamsShowcase } from "@/components/home/TeamsShowcase";
import { StandingsPreview } from "@/components/home/StandingsPreview";
import { RegistrationCTA } from "@/components/home/RegistrationCTA";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <UpcomingMatches />
      <TeamsShowcase />
      <StandingsPreview />
      <RegistrationCTA />
    </Layout>
  );
};

export default Index;
