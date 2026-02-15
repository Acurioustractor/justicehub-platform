interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  theme?: "dark" | "light";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  theme = "dark",
}: SectionHeadingProps) {
  const alignment = {
    left: "items-start text-left",
    center: "items-center text-center",
  }[align];

  const palette =
    theme === "light"
      ? {
          eyebrow: "text-[rgba(44,62,80,0.75)]",
          title: "text-[#0c1218]",
          description: "text-[rgba(12,18,24,0.75)]",
        }
      : {
          eyebrow: "text-color-warning-orange/90",
          title: "text-white",
          description: "text-white/85",
        };

  return (
    <header className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow && (
        <span
          className={`text-xs font-semibold uppercase tracking-[0.25em] ${palette.eyebrow}`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-display text-4xl uppercase tracking-tight sm:text-5xl ${palette.title}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`max-w-2xl text-base sm:text-lg ${palette.description}`}>
          {description}
        </p>
      )}
    </header>
  );
}
