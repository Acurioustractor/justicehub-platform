import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Queensland Youth Justice Tracker - Real Government Data',
  description: 'Live tracking: 338 youth detained (73.4% Indigenous), $1.2M wasted daily. All statistics from official Queensland Government reports.',
  keywords: 'Queensland youth justice, Indigenous overrepresentation, government data, youth detention, budget waste, official statistics',
  authors: [{ name: 'Queensland Youth Justice Tracker' }],
  openGraph: {
    title: 'Queensland Youth Justice Crisis - The Facts',
    description: '73.4% of detained youth are Indigenous. $1.2M wasted daily. 58% reoffend. See verified government data.',
    type: 'website',
    locale: 'en_AU',
    siteName: 'QLD Youth Justice Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QLD Youth Justice Crisis',
    description: '73.4% Indigenous | $1.2M/day wasted | 58% reoffend | Verified gov data',
  },
  manifest: '/manifest.json'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#7c2d12'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QLD Justice" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={inter.className}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}