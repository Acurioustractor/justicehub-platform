import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

import { LOCALES } from '@/lib/civic-intelligence/locales';

export const metadata: Metadata = {
  title: 'Locale-level civic intelligence | JusticeHub',
  description:
    'Place-by-place breakdown of the Tier 1 frontline universe. Indigenous communities running youth justice differently, named place by place.',
};

export default function LocaleIndexPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/intelligence/civic" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Civic Intelligence
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Locales</span>
        </div>
      </nav>

      <section className="bg-stone-900 text-stone-50 px-6 py-20 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">Locale Pages · v1</p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Place by place.
          </h1>
          <p className="mt-5 max-w-2xl text-lg md:text-xl text-stone-300">
            The national numbers are real. The work is local. Each page below names the organisations, the country,
            and where the money flows for one particular place.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOCALES.map((l) => (
              <Link
                key={l.slug}
                href={`/intelligence/civic/locale/${l.slug}`}
                className="block border border-stone-200 bg-white rounded-lg p-6 hover:border-stone-400 hover:shadow-sm transition"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-500" />
                    {l.displayName}
                  </h2>
                  <span className="text-xs font-mono uppercase tracking-widest text-stone-500">{l.state}</span>
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{l.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
