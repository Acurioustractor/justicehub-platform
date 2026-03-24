import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Pulse | JusticeHub',
  description: 'Live youth justice intelligence. Government moves, media coverage, new evidence, funding opportunities, and community stories — updated daily.',
  openGraph: {
    title: 'The Pulse — Live Youth Justice Intelligence | JusticeHub',
    description: 'What government is doing. What media is saying. What evidence is emerging. What opportunities exist. Updated daily.',
    url: 'https://www.justicehub.com.au/pulse',
    siteName: 'JusticeHub',
    type: 'website',
  },
};

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
