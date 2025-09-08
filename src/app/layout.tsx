import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JusticeHub - Empowering Youth Through Storytelling',
  description: 'A digital platform that transforms how grassroots organizations support young people by providing tools and human support that help youth understand their own stories and connect them to opportunities.',
  keywords: ['youth', 'storytelling', 'mentorship', 'opportunities', 'social impact'],
  authors: [{ name: 'JusticeHub Team' }],
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
      <body className={`${inter.className} h-full antialiased`}>
        <UserProvider>
          <Providers>
            <div className="min-h-full">
              {children}
            </div>
          </Providers>
        </UserProvider>
      </body>
    </html>
  );
}