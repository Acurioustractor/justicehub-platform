'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-gray-400 hover:text-[#F5F0E8] transition-colors print:hidden"
      title="Export as PDF"
    >
      Export PDF
    </button>
  );
}
