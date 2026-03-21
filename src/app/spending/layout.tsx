import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Youth Justice Spending | JusticeHub',
  description:
    'State-by-state breakdown of youth justice spending across Australia. Detention vs community program expenditure, top recipients, and program analysis.',
};

export default function SpendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
