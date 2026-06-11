import type { Metadata } from 'next';
import { EoiContent } from './eoi-content';

export const metadata: Metadata = {
  title: 'Nominate, EOI or Stand With It — CONTAINED Adelaide 2026 | JusticeHub',
  description:
    'One container. Three rooms. Thirty minutes, one person at a time, on Kaurna Country 23-26 June 2026. Nominate the person who needs to walk through it, express interest, or stand with it.',
  openGraph: {
    title: 'Most people will never get inside — CONTAINED Adelaide 2026',
    description:
      'Nominate the decision-maker who needs the thirty minutes, express your own interest, or stand with it.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/eoi',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Most people will never get inside — CONTAINED Adelaide 2026',
    description:
      'Nominate the decision-maker who needs the thirty minutes, express your own interest, or stand with it.',
  },
};

export default function EoiPage() {
  return <EoiContent />;
}
