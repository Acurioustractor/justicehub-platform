import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For the Judiciary — What\'s Working in Youth Justice | JusticeHub',
  description:
    '1,081 community-led alternatives mapped across Australia. Real stories from young people. Evidence that detention isn\'t the only option. Search programs near your court.',
  keywords: [
    'youth justice',
    'judiciary',
    'magistrates',
    'alternatives to detention',
    'community programs',
    'ALMA',
    'JusticeHub',
    'Indigenous justice',
  ],
  openGraph: {
    title: 'For the Judiciary — What\'s Working in Youth Justice',
    description:
      '1,081 community-led alternatives mapped across Australia. Search programs near your court, hear from young people, and champion what works.',
    type: 'website',
    locale: 'en_AU',
    url: 'https://justicehub.com.au/judges-on-country',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For the Judiciary — What\'s Working in Youth Justice',
    description:
      '1,081 community-led alternatives to detention mapped across Australia. Real stories. Real evidence.',
  },
};

export default function ForJudgesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
