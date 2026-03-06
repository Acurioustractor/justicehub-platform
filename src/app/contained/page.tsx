import type { Metadata } from 'next';
import { TourContent } from './tour/tour-content';

export const metadata: Metadata = {
  title: 'THE CONTAINED: Australian Tour 2026 | JusticeHub',
  description:
    'Three shipping containers. Thirty minutes. The reality of youth detention, the therapeutic alternative, and Australia\'s possible future. Mount Druitt, Adelaide, Perth, Tennant Creek.',
  keywords: [
    'youth justice',
    'youth detention',
    'therapeutic justice',
    'immersive experience',
    'Australian tour',
    'CONTAINED',
    'JusticeHub',
  ],
  openGraph: {
    title: 'THE CONTAINED: Australian Tour 2026',
    description:
      'Three shipping containers reveal the reality of youth detention — and the alternative. Four cities across Australia in 2026.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THE CONTAINED: Australian Tour 2026',
    description:
      'Three shipping containers. Thirty minutes. The reality of youth detention, the therapeutic alternative, and Australia\'s possible future.',
  },
};

export default function ContainedPage() {
  return <TourContent />;
}
