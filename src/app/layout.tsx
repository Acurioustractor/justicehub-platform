import type { Metadata } from 'next';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Providers } from '@/components/providers';
import { ALMAChat } from '@/components/ui/alma-chat';
import { PageTracker } from '@/components/ui/page-tracker';
import './globals.css';

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: 'JusticeHub - Empowering Youth Through Storytelling',
  description: 'A digital platform that transforms how grassroots organizations support young people by providing tools and human support that help youth understand their own stories and connect them to opportunities.',
  keywords: ['youth', 'storytelling', 'mentorship', 'opportunities', 'social impact'],
  authors: [{ name: 'JusticeHub Team' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'JusticeHub - Empowering Youth Through Storytelling',
    description: 'Transform your journey into opportunities with JusticeHub',
    type: 'website',
    locale: 'en_AU',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full font-sans antialiased">
        <Providers>
          <div className="min-h-full">
            {children}
          </div>
          <ALMAChat />
        </Providers>
        <PageTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
