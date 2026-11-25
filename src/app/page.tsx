import { LandingNavbar } from "@/components/navigation/LandingNavbar";
import { HeroSection } from "@/components/shared/HeroSection";
import { FeaturesSection } from "@/components/shared/FeaturesSection";
import { HowItWorksSection } from "@/components/shared/HowItWorksSection";
import { PlatformShowcaseSection } from "@/components/shared/PlatformShowcaseSection";
import { SecuritySection } from "@/components/shared/SecuritySection";
import { FaqSection } from "@/components/shared/FaqSection";
import { CtaSection } from "@/components/shared/CtaSection";
import { LandingFooter } from "@/components/layout/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PlatformShowcaseSection />
        <SecuritySection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
