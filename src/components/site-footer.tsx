import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-color-container-black px-6 py-12 text-white sm:px-12">
      {/* Back to JusticeHub link */}
      <div className="mx-auto max-w-6xl border-b border-white/10 pb-6 mb-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-white/50 hover:text-white/80 transition-colors"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Return to JusticeHub Platform
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-display text-xl uppercase tracking-[0.35em]">CONTAINED</span>
          <p className="text-sm text-white/60">
            An ACT.place campaign advancing youth justice reform through immersive advocacy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
          <Link href="mailto:hello@act.place" className="hover:text-white">
            hello@act.place
          </Link>
          <Link href="https://act.place" className="hover:text-white">
            act.place
          </Link>
          <span>© {new Date().getFullYear()} CONTAINED Campaign</span>
        </div>
      </div>
    </footer>
  );
}
