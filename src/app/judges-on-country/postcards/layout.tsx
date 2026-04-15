import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Judges on Country Postcard Field Kit | JusticeHub',
  description:
    'Printable A6 QR postcards for the Judges on Country trip. Carry the cost, evidence, accountability, and follow-through routes back to chambers.',
  openGraph: {
    title: 'Judges on Country Postcard Field Kit',
    description:
      'Printable A6 QR postcards for the Judges on Country trip, linking to Oonchiumpa, local program search, community proof, and accountability tools.',
    url: 'https://justicehub.com.au/judges-on-country/postcards',
  },
  twitter: {
    title: 'Judges on Country Postcard Field Kit',
    description:
      'Printable A6 QR postcards for the Judges on Country trip, built to carry the proof back to chambers.',
  },
};

export default function JudgesOnCountryPostcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
