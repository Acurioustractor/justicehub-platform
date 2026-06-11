import type { Metadata } from 'next';
import { AskMatrixClient } from './AskMatrixClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ask the Matrix · Justice Matrix',
  description:
    'Ask grounded questions across Justice Matrix cases, campaigns, and evidence with cited records and legal-advice boundaries.',
};

type SP = Record<string, string | string[] | undefined>;

function sp(value: SP[string], def = ''): string {
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? def : def;
}

export default async function AskMatrixPage({ searchParams }: { searchParams: Promise<SP> }) {
  const raw = await searchParams;
  const q = sp(raw.q).trim().slice(0, 500);
  const surfaceParam = sp(raw.surface);
  const surface = surfaceParam === 'refugee' || surfaceParam === 'youth' ? surfaceParam : 'all';

  return <AskMatrixClient initialQuestion={q} initialSurface={surface} />;
}
