import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Vision | JusticeHub',
  description: 'The youth justice system is a secret society. We\'re opening the gates. Community organisations learning from each other. Young people in the process. Open evidence. National connection.',
  openGraph: {
    title: 'The Future of Youth Justice in Australia | JusticeHub',
    description: 'Community organisations learning from each other. Young people in the process. 981 verified interventions. 18,000+ organisations. Open evidence infrastructure for revolution.',
    url: 'https://www.justicehub.com.au/vision',
    siteName: 'JusticeHub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Future of Youth Justice in Australia | JusticeHub',
    description: 'The system is a secret society. We\'re opening the gates.',
  },
};

export default function VisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
