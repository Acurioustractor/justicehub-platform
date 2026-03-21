'use client';

interface Program {
  name: string;
  total: number;
  count: number;
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function ProgramSpotlight({ programs }: { programs: Program[] }) {
  if (!programs.length) return null;

  // Top programs by total funding
  const topPrograms = programs.slice(0, 12);
  const maxTotal = Math.max(...topPrograms.map((p) => p.total));

  return (
    <section className="py-12 px-6 bg-[#F5F0E8]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Program Spotlight
        </h2>
        <p className="font-mono text-xs text-gray-500 mb-6">
          Named programs by total funding allocated
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topPrograms.map((program) => {
            const pct = maxTotal > 0 ? (program.total / maxTotal) * 100 : 0;
            return (
              <div
                key={program.name}
                className="bg-white border border-gray-200 p-4 relative overflow-hidden"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-50"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative">
                  <h3 className="font-bold text-sm truncate" title={program.name}>
                    {program.name}
                  </h3>
                  <div className="flex justify-between items-baseline mt-2">
                    <span
                      className="text-lg font-bold"
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {formatDollars(program.total)}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {program.count} grant{program.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
