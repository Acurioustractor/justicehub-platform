import type { Metadata } from 'next';
import { AskMatrixClient } from './AskMatrixClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ask the Matrix · Justice Matrix',
  description:
    'Ask grounded questions across Justice Matrix cases, campaigns, and evidence with cited records and legal-advice boundaries.',
};

export default function AskMatrixPage() {
  return <AskMatrixClient />;
}
