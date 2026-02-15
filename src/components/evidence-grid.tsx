import { evidenceHighlights } from "@/content/campaign";
import { SectionHeading } from "./section-heading";

export function EvidenceGrid() {
  return (
    <section
      id="evidence"
      className="text-color-container-black"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(241,245,249,1), rgba(226,234,244,0.95) 55%, rgba(212,224,236,0.9))",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-12">
        <SectionHeading
          eyebrow="Evidence"
          theme="light"
          title="The data is undeniable"
          description="Every statistic is a young person. Pair these numbers with stories and policy asks in all campaign collateral."
          align="left"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {evidenceHighlights.map((item) => (
            <article
              key={item.label}
              className="panel-light group relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(12,18,24,0.18)]"
            >
              <span className="font-display text-4xl uppercase tracking-tight text-[rgba(192,57,43,0.9)] group-hover:text-color-warning-orange">
                {item.value}
              </span>
              <p className="text-sm font-semibold text-[rgba(12,18,24,0.9)]">{item.label}</p>
              {item.source ? (
                <p className="text-xs uppercase tracking-[0.28em] text-[rgba(44,62,80,0.7)]">
                  {item.source}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
