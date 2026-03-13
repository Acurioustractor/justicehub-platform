import type { Metadata } from 'next';
import { TourContent } from './tour/tour-content';

export const metadata: Metadata = {
  title: 'THE CONTAINED: Australian Tour 2026 | JusticeHub',
  description:
    'One shipping container. Three rooms. Thirty minutes. The reality of youth detention, the therapeutic alternative, and the community-led future already taking shape across Australia.',
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
      'One shipping container. Three rooms. Thirty minutes that make the case for youth justice reform across Australia.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THE CONTAINED: Australian Tour 2026',
    description:
      'One shipping container. Three rooms. Thirty minutes. The reality of youth detention, the therapeutic alternative, and the future communities are already building.',
  },
};

export default function ContainedPage() {
  return <TourContent />;
}
