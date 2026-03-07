import type { Metadata } from 'next';
import { StoryForm } from './story-form';

export const metadata: Metadata = {
  title: 'Share Your Story — CONTAINED Tour 2026 | JusticeHub',
  description:
    'Attended a CONTAINED tour stop? Share your experience. Your story helps build the case for youth justice reform.',
  openGraph: {
    title: 'Share Your Story — CONTAINED Tour 2026',
    description:
      'Attended a CONTAINED tour stop? Share your experience.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/share',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Share Your Story — CONTAINED Tour 2026',
    description:
      'Attended a CONTAINED tour stop? Share your experience.',
  },
};

export default function SharePage() {
  return <StoryForm />;
}
