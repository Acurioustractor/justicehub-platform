import Link from 'next/link';
import { CivicClaim } from '@/lib/civic-intelligence/citation-format';
import { CopyCitationButton } from './CopyCitationButton';
import { ChevronRight } from 'lucide-react';

export function ChapterCitationsPanel({ chapter, claims, liveSources = [] }: {
  chapter: 'access' | 'promises' | 'oversight';
  claims: CivicClaim[];
  liveSources?: { label: string; href: string; count?: number }[];
}) {
  if (claims.length === 0 && liveSources.length === 0) return null;

  return (
    <aside className="mt-12 p-6 bg-stone-100 border border-stone-300 rounded-lg">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-widest text-stone-500 font-mono">Sources for this chapter</p>
        <h3 className="text-xl font-bold text-stone-900 mt-1">
          {chapter === 'access' && 'How we know who gets through the door'}
          {chapter === 'promises' && 'How we know what was promised'}
          {chapter === 'oversight' && 'How we know what was recommended'}
        </h3>
      </header>

      {claims.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Snapshot claims</p>
          <ul className="space-y-2">
            {claims.map((claim) => (
              <li key={claim.claim_id} className="flex items-start gap-3 text-sm">
                <a href={`#${claim.claim_id}`} className="flex-1 text-stone-800 hover:text-stone-900 underline-offset-2 hover:underline">
                  {claim.display_label}
                </a>
                <span className="text-xs font-mono text-stone-500 whitespace-nowrap">computed {claim.computed_at.slice(0, 10)}</span>
                <CopyCitationButton claim={claim} variant="icon" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {liveSources.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Underlying records</p>
          <ul className="space-y-1.5">
            {liveSources.map((src, i) => (
              <li key={i} className="text-sm">
                <Link href={src.href} className="inline-flex items-center gap-1 text-stone-800 hover:text-stone-900 underline underline-offset-2">
                  {src.label}{src.count != null && <span className="text-xs font-mono text-stone-500"> ({src.count.toLocaleString()})</span>}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="pt-3 border-t border-stone-300">
        <Link href="/intelligence/civic/methodology" className="text-xs font-mono uppercase tracking-widest text-stone-700 hover:text-stone-900 inline-flex items-center gap-1">
          Full methodology <ChevronRight className="w-3 h-3" />
        </Link>
      </footer>
    </aside>
  );
}
