import type { Metadata } from 'next';
import { ActContent } from './act-content';

export const metadata: Metadata = {
  title: 'Take Action — CONTAINED Tour 2026 | JusticeHub',
  description:
    'Share, nominate, donate, and spread the word. Everything you need to make the CONTAINED campaign successful.',
  openGraph: {
    title: 'Take Action — CONTAINED Tour 2026',
    description:
      'Share, nominate, donate, and spread the word for youth justice reform.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/act',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Take Action — CONTAINED Tour 2026',
    description:
      'Share, nominate, donate, and spread the word for youth justice reform.',
  },
};

export default function ActPage() {
  return <ActContent />;
}
