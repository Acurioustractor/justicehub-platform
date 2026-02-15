import { actionTracks } from "@/content/campaign";
import { CTAButton } from "./cta-button";
import { SectionHeading } from "./section-heading";

export function ActionTracks() {
  return (
    <section id="actions" className="bg-color-background text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-12">
        <SectionHeading
          eyebrow="Take Action"
          title="Two ways to create change"
          description="Politicians follow public pressure. Nominate the people with power or experience the containers yourself and join the alumni network."
          align="left"
        />

        <div className="grid gap-10 md:grid-cols-2">
          {Object.values(actionTracks).map((track) => (
            <article
              key={track.id}
              id={track.id}
              className="panel-darker flex h-full flex-col rounded-3xl p-8"
            >
              <div className="flex flex-col gap-4">
                <h3 className="font-display text-3xl uppercase tracking-tight text-white">
                  {track.title}
                </h3>
                <p className="text-base text-white/90">{track.description}</p>
                <ul className="space-y-2 text-sm text-white/85">
                  {track.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-color-hope-green" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <CTAButton href={`#${track.id}-form`} fullWidth variant="accent">
                  {track.buttonLabel}
                </CTAButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
