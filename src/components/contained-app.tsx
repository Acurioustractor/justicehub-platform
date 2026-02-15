import { Hero } from "./hero";
import { StoriesSection } from "./stories-section";
import { EvidenceGrid } from "./evidence-grid";
import { ActionTracks } from "./action-tracks";
import { JourneySection } from "./journey-section";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

interface ContainedAppProps {
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

/**
 * Complete CONTAINED campaign experience
 * Can be embedded into any Next.js application
 */
export function ContainedApp({
  showHeader = true,
  showFooter = true,
  className = ""
}: ContainedAppProps) {
  return (
    <div className={`min-h-screen bg-color-background text-white ${className}`}>
      {showHeader && <SiteHeader />}

      <main className="relative">
        <Hero />
        <StoriesSection />
        <EvidenceGrid />
        <ActionTracks />
        <JourneySection />
      </main>

      {showFooter && <SiteFooter />}
    </div>
  );
}

/**
 * Individual section exports for granular integration
 */
export { Hero } from "./hero";
export { StoriesSection } from "./stories-section";
export { EvidenceGrid } from "./evidence-grid";
export { ActionTracks } from "./action-tracks";
export { JourneySection } from "./journey-section";
export { SiteHeader } from "./site-header";
export { SiteFooter } from "./site-footer";

/**
 * About page components
 */
export { AboutHero } from "./about/about-hero";
export { ArchitectsSection } from "./about/architects-section";
export { TruthSpeakersSection } from "./about/truth-speakers-section";
export { BuildProcessSection } from "./about/build-process-section";
export { CommunitySection } from "./about/community-section";
export { EconomicsSection } from "./about/economics-section";
export { VisionSection } from "./about/vision-section";
export { GetInvolvedSection } from "./about/get-involved-section";
export { AboutNavigation } from "./about/about-navigation";