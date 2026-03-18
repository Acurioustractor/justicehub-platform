import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Justice Funding Tracker — Where the Money Goes | JusticeHub',
  description:
    'Search $9B+ in justice spending across 29,000 organisations. See who gets funded, who misses out, and the inequality gap facing Indigenous communities.',
  openGraph: {
    title: 'Justice Funding Tracker — Where the Money Goes',
    description:
      'Search every dollar of QLD justice spending. 51,000+ grants, 13 years, full transparency.',
  },
};

export default function JusticeFundingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
