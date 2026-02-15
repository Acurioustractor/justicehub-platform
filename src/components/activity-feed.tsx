import { liveActivitySeed } from "@/content/activity";
import { SectionHeading } from "./section-heading";

export function ActivityFeed() {
  return (
    <section id="updates" className="bg-color-container-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-12">
        <SectionHeading
          eyebrow="Happening Now"
          title="Real people taking action"
          description="Use this as a ticker for nominations and bookings. Hook it up to Zapier/Notion later by replacing the seed data in src/content/activity.ts."
          align="left"
        />

        <ol
          className="relative space-y-4 border-l border-white/25 pl-6"
          aria-live="polite"
        >
          {liveActivitySeed.map((item) => (
            <li
              key={item.id}
              className="relative flex flex-col gap-1 rounded-2xl border border-white/20 bg-[rgba(10,16,24,0.92)] p-5 shadow-sm shadow-black/30"
            >
              <span className="absolute -left-3 top-5 h-2 w-2 rounded-full bg-color-hope-green" />
              <div className="text-base font-semibold">{item.actor}</div>
              <div className="text-sm text-white/94">{item.action}</div>
              <time
                className="text-xs uppercase tracking-[0.3em] text-white/78"
                dateTime={`PT${item.timestampMinutesAgo}M`}
              >
                {item.timestampMinutesAgo} minutes ago
              </time>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
