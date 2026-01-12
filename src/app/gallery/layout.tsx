import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery - JusticeHub',
  description: 'Visual stories of transformation from communities across Australia. Photos, videos, artwork, and stories showcasing youth justice innovation.',
  openGraph: {
    title: 'Gallery - JusticeHub',
    description: 'Visual stories of transformation from communities across Australia.',
    type: 'website',
    images: ['/images/og/gallery.png'],
  },
  alternates: {
    canonical: 'https://justicehub.org.au/gallery',
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
