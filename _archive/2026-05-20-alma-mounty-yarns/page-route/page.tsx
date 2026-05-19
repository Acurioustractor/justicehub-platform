import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Not Found',
  robots: { index: false, follow: false },
};

export default function Page() {
  notFound();
}
