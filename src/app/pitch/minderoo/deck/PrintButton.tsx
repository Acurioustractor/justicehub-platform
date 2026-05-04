'use client';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-[#5a3a2a] bg-[#fbf5e9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5a3a2a] hover:bg-[#5a3a2a] hover:text-[#fbf5e9] transition-colors"
    >
      Save as PDF
    </button>
  );
}
