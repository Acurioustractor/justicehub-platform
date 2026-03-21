import type { Metadata } from 'next';
import { TourIntelligenceContent } from './intel-content';

export const metadata: Metadata = {
  title: 'Tour Intelligence Map | CONTAINED',
  description: 'Interactive intelligence map of the CONTAINED national tour — data, demand signals, and community intelligence for every stop.',
};

export default function TourIntelligencePage() {
  return <TourIntelligenceContent />;
}
