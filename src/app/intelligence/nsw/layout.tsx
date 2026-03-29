import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NSW Youth Justice Sector Report | JusticeHub',
  description:
    'Full sector intelligence report on NSW youth justice — $327M/year, 34% detention surge since bail laws, 22.1x Indigenous overrepresentation, 154 programs mapped.',
  openGraph: {
    title: 'NSW Youth Justice Sector Report',
    description:
      '$327M/year. 34% detention surge. 70%+ on remand. 154 programs mapped. The bail crisis.',
  },
};

export default function NSWLayout({ children }: { children: React.ReactNode }) {
  return children;
}
