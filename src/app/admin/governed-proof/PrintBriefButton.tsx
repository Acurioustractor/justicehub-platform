'use client';

export default function PrintBriefButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black bg-black text-white font-bold hover:bg-gray-800 transition-colors print:hidden"
    >
      Print / Save PDF
    </button>
  );
}
