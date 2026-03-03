import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OrgSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-50 border-b-2 border-black bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-earth-700 hover:text-ochre-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to JusticeHub
          </Link>
          <Link href="/sites" className="text-sm font-medium text-earth-500 hover:text-ochre-600 transition-colors">
            All Sites
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
