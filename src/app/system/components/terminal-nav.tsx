import Link from 'next/link';

type NavProps = {
  /** Current page label shown after the slash, e.g. "System Terminal" or "QLD System Map" */
  current: string;
  /** Extra nav links to show (beyond the default set) */
  extraLinks?: { href: string; label: string }[];
  /** Trailing slot — e.g. Export PDF button */
  trailing?: React.ReactNode;
};

const DEFAULT_LINKS = [
  { href: '/journey-map', label: 'Journey Map' },
  { href: '/spending', label: 'National Spending' },
  { href: '/justice-funding', label: 'Funding' },
];

export function TerminalNav({ current, extraLinks, trailing }: NavProps) {
  const links = extraLinks ? [...extraLinks, ...DEFAULT_LINKS] : DEFAULT_LINKS;

  return (
    <nav className="bg-[#0A0A0A] border-b border-gray-800 px-4 sm:px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center gap-4 sm:gap-6 text-sm font-mono">
        <Link href="/" className="text-[#F5F0E8] hover:text-[#DC2626] transition-colors">JusticeHub</Link>
        <span className="text-gray-600">/</span>
        <span className="text-[#DC2626]">{current}</span>
        <div className="ml-auto hidden sm:flex gap-4 print:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-gray-400 hover:text-[#F5F0E8] transition-colors">
              {l.label}
            </Link>
          ))}
          {trailing && (
            <>
              <span className="text-gray-700">|</span>
              {trailing}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
