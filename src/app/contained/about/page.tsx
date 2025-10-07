import {
  AboutHero,
  ArchitectsSection,
  TruthSpeakersSection,
  BuildProcessSection,
  CommunitySection,
  EconomicsSection,
  VisionSection,
  GetInvolvedSection,
  SiteHeader,
  SiteFooter
} from '@/components/contained-app';

export default function ContainedAboutPage() {
  return (
    <div className="min-h-screen bg-color-background text-white">
      <SiteHeader />

      <main className="relative">
        <AboutHero />
        <ArchitectsSection />
        <TruthSpeakersSection />
        <BuildProcessSection />
        <CommunitySection />
        <EconomicsSection />
        <VisionSection />
        <GetInvolvedSection />
      </main>

      <SiteFooter />
    </div>
  );
}

export const metadata = {
  title: 'About CONTAINED - A Curious Tractor',
  description: 'Learn about the architects, vision, and process behind the CONTAINED campaign',
  openGraph: {
    title: 'About CONTAINED - A Curious Tractor',
    description: 'Learn about the architects, vision, and process behind the CONTAINED campaign',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About CONTAINED - A Curious Tractor',
    description: 'Learn about the architects, vision, and process behind the CONTAINED campaign',
  },
};