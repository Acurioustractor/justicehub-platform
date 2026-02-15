import { ContainedApp } from '@/components/contained-app';

export default function ContainedPage() {
  return <ContainedApp />;
}

export const metadata = {
  title: 'CONTAINED - A Curious Tractor',
  description: 'Join the CONTAINED campaign to build a more just and equitable system',
  openGraph: {
    title: 'CONTAINED - A Curious Tractor',
    description: 'Join the CONTAINED campaign to build a more just and equitable system',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CONTAINED - A Curious Tractor',
    description: 'Join the CONTAINED campaign to build a more just and equitable system',
  },
};