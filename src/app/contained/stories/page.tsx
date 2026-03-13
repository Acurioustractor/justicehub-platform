import type { Metadata } from 'next';
import { ContainedStoriesContent } from './stories-content';

export const metadata: Metadata = {
  title: 'Real Stories of Justice — CONTAINED | JusticeHub',
  description:
    'Community voices, campaign stories, and evidence from THE CONTAINED tour and the organisations building youth justice alternatives.',
  openGraph: {
    title: 'Real Stories of Justice — CONTAINED',
    description:
      'Community voices, campaign stories, and evidence from THE CONTAINED tour.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/stories',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Stories of Justice — CONTAINED',
    description:
      'Community voices, campaign stories, and evidence from THE CONTAINED tour.',
  },
};

export default function ContainedStoriesPage() {
  return <ContainedStoriesContent />;
}
