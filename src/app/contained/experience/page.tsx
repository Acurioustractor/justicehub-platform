import type { Metadata } from 'next';
import { ExperienceContent } from './experience-content';

export const metadata: Metadata = {
  title: 'Experience The Contained — Virtual Exhibition | JusticeHub',
  description:
    'One shipping container. Three rooms. Thirty minutes. Experience the reality of youth detention, the therapeutic alternative, and the community solutions already working — online.',
  openGraph: {
    title: 'Experience The Contained — Virtual Exhibition',
    description:
      'One shipping container. Three rooms. Thirty minutes. The reality of youth detention and what we can do instead.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/experience',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Experience The Contained — Virtual Exhibition',
    description:
      'One shipping container. Three rooms. Thirty minutes. The reality of youth detention and what we can do instead.',
  },
};

export default function ExperiencePage() {
  return <ExperienceContent />;
}
