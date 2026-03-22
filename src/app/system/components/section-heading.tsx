export function SectionHeading({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <h2
          className={`text-xl font-bold tracking-[0.2em] uppercase ${dark ? 'text-[#F5F0E8]' : 'text-[#0A0A0A]'}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </h2>
        <div className={`flex-1 h-px ${dark ? 'bg-gray-700' : 'bg-gray-300'}`} />
      </div>
    </div>
  );
}
