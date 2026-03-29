import { Metadata } from 'next';
import NetworkExplorer from './NetworkExplorer';

export const metadata: Metadata = {
  title: 'Entity Network Explorer | JusticeHub Intelligence',
  description:
    'Interactive graph visualization showing how organizations, people, funding, and programs are connected across Australian youth justice.',
  openGraph: {
    title: 'Entity Network Explorer',
    description:
      'Follow the connections. See how organizations, board members, funding, and political donations link together.',
  },
};

export default function NetworkPage() {
  return <NetworkExplorer />;
}
