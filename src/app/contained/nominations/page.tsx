import type { Metadata } from 'next';
import { NominationsWall } from './nominations-wall';

export const metadata: Metadata = {
  title: 'Nominations Wall — CONTAINED Tour 2026 | JusticeHub',
  description:
    'See who Australians are nominating to experience youth detention reality. Politicians, justice officials, media, and community leaders.',
  openGraph: {
    title: 'Nominations Wall — CONTAINED Tour 2026',
    description:
      'See who Australians are nominating to experience youth detention reality.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/nominations',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nominations Wall — CONTAINED Tour 2026',
    description:
      'See who Australians are nominating to experience youth detention reality.',
  },
};

export default function NominationsPage() {
  return <NominationsWall />;
}
