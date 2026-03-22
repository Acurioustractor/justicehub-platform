export function TerminalFooter({ label, printLine }: { label: string; printLine?: string }) {
  return (
    <footer className="bg-[#0A0A0A] border-t border-gray-800 px-4 sm:px-6 py-4">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between font-mono text-xs text-gray-600">
        <span>{label}</span>
        <span suppressHydrationWarning>Last updated: {new Date().toISOString().split('T')[0]}</span>
      </div>
      {printLine && (
        <div className="hidden print:block max-w-[1400px] mx-auto mt-2 font-mono text-xs text-gray-500">
          {printLine}
        </div>
      )}
    </footer>
  );
}
