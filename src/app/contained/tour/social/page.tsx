import type { Metadata } from 'next';
import { SocialKitContent } from './social-kit-content';

export const metadata: Metadata = {
  title: 'Social Media Kit — THE CONTAINED Tour 2026 | JusticeHub',
  description:
    'Ready-to-post social media content for THE CONTAINED Australian Tour 2026. Copy, customise, share.',
  openGraph: {
    title: 'Social Media Kit — THE CONTAINED Tour 2026',
    description:
      'Ready-to-post content, visuals, and talking points for the CONTAINED tour across Australia.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/tour/social',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Media Kit — THE CONTAINED Tour 2026',
    description:
      'Ready-to-post content, visuals, and talking points for the CONTAINED tour across Australia.',
  },
};

export default function SocialKitPage() {
  return <SocialKitContent />;
}
