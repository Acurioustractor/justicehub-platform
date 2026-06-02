import type { Metadata } from 'next';
import { CanberraContent } from './canberra-content';

export const metadata: Metadata = {
  title: 'CONTAINED in Canberra — A Standing Invitation to the People Who Set the Rules | JusticeHub',
  description:
    'One shipping container. Three rooms. Thirty minutes. Built for the Children & Young People Commissioner, the National Children\'s Commissioner, the ACT government, federal MPs, and the Press Gallery. What CONTAINED is, why it matters, and how to use your voice to bring it to Canberra.',
  keywords: [
    'Canberra youth justice',
    'ACT youth justice',
    'Bimberi',
    'Children\'s Commissioner',
    'CONTAINED',
    'Parliament House',
    'JusticeHub',
  ],
  openGraph: {
    title: 'CONTAINED in Canberra — A Standing Invitation',
    description:
      'One shipping container. Three rooms. Thirty minutes. Aimed at the people who set the rules. Use your voice to bring it to Canberra.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/canberra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CONTAINED in Canberra — A Standing Invitation',
    description:
      'Thirty minutes inside a shipping container that puts youth detention on the lawns of Parliament House. Built for Commissioners, MPs, and the Press Gallery.',
  },
};

export default function CanberraPage() {
  return <CanberraContent />;
}
