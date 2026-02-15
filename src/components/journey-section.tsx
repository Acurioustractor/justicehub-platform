import { journeyContainers } from "@/content/campaign";
import clsx from "clsx";
import { SectionHeading } from "./section-heading";

const toneStyles: Record<string, string> = {
  critical: "text-[rgba(192,57,43,0.95)]",
  transitional: "text-[rgba(230,126,34,0.95)]",
  hopeful: "text-[rgba(39,174,96,0.95)]",
};

const titleStyles: Record<string, string> = {
  critical: "text-[rgba(192,57,43,0.85)]",
  transitional: "text-[rgba(230,126,34,0.85)]",
  hopeful: "text-[rgba(39,174,96,0.85)]",
};

export function JourneySection() {
 return (
    <section
      id="journey"
      className="bg-white text-color-container-black"
      style={{
        background: "radial-gradient(circle at 20% 20%, rgba(236,240,241,0.85), rgba(243,246,249,0.95) 45%, rgba(248,250,252,1))",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-12">
        <SectionHeading
          eyebrow="The Journey"
          theme="light"
          title="The Three-Container Experience"
          description="Step inside three realities. Understand the cost of detention, the promise of therapeutic care, and the future Queensland deserves."
          align="left"
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {journeyContainers.map((container) => (
            <article
              key={container.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[rgba(12,18,24,0.06)] bg-white shadow-[0_18px_38px_rgba(12,18,24,0.12)] transition hover:-translate-y-2 hover:shadow-[0_22px_48px_rgba(12,18,24,0.18)]"
            >
              <div className="px-6 py-10 text-center">
                <span
                  className={clsx(
                    "font-display text-4xl uppercase tracking-tight sm:text-5xl",
                    toneStyles[container.tone],
                  )}
                >
                  Container {container.step}
                </span>
                <div
                  className={clsx(
                    "mt-2 text-xs font-semibold uppercase tracking-[0.22em]",
                    titleStyles[container.tone],
                  )}
                >
                  {container.title}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-6 p-8 text-[#0c1218]">
                <h3 className="text-2xl font-semibold">
                  {container.headline}
                </h3>
                <p className="text-base text-[rgba(12,18,24,0.75)]">{container.summary}</p>

                <dl className="grid gap-3 rounded-2xl bg-white p-6 text-sm text-[rgba(12,18,24,0.8)] shadow-[0_10px_24px_rgba(12,18,24,0.08)]">
                  {container.stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between gap-4">
                      <dt className="uppercase tracking-[0.2em] text-xs text-[rgba(44,62,80,0.75)]">
                        {stat.label}
                      </dt>
                      <dd className="text-base font-semibold text-[#0c1218]">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-auto text-sm font-semibold uppercase tracking-[0.3em] text-[rgba(44,62,80,0.75)]">
                  {container.duration}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
