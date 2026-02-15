import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";

const coreBuilders = [
  {
    name: "Benjamin Knight",
    role: "Co-founder, A Curious Tractor",
    title: "The Insomniac Calculator",
    bio: "Following paper trails that lead to kids in cages, transforming data into moral urgency. The one who stood in Madrid's sunset-colored rooms and felt the weight of Australia's failure in his bones.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/benjamin-knight.jpg",
    quote: "Every statistic represents a child whose future hangs in the balance. We can't unknow what we know about what works.",
    expertise: ["Data Analysis", "Policy Research", "International Relations", "Systemic Change"],
    contact: "ben@acurioustractor.com"
  },
  {
    name: "Nicholas Marchesi",
    role: "Co-founder, A Curious Tractor",
    title: "The Hands That Built Revolution",
    bio: "Strategic architect who transformed shipping containers into transformation chambers - personally constructing the majority of the rooms, wiring the electronics that make fluorescent despair tangible, embedding technology that bridges experience to action. When vision needed to become physical reality, Nicholas made it happen with power tools and profound intention.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/nicholas-marchesi.jpg",
    quote: "Revolution is built with hands, not just hearts. Every wire, every wall, every detail matters when you're building someone's future.",
    expertise: ["Construction", "Electronics", "Spatial Design", "Project Management"],
    contact: "nicholas@acurioustractor.com"
  }
];

export function ArchitectsSection() {
  return (
    <section id="architects" className="bg-color-container-steel py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="The Core Builders"
          title="The Architects of Alternative Futures"
          description="Revolution doesn't happen in boardrooms. It happens when builders, dreamers, and survivors converge at the intersection of moral urgency and practical possibility."
          align="center"
        />

        <div className="mt-16 space-y-16">
          {coreBuilders.map((builder, index) => (
            <div
              key={builder.name}
              className={`grid gap-8 lg:gap-12 items-center ${
                index % 2 === 0 ? "lg:grid-cols-[1fr,400px]" : "lg:grid-cols-[400px,1fr]"
              }`}
            >
              {/* Image */}
              <div className={`${index % 2 === 0 ? "lg:order-2" : "lg:order-1"}`}>
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={builder.image}
                    alt={`Portrait of ${builder.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Quote overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <blockquote className="text-sm italic leading-relaxed">
                      "{builder.quote}"
                    </blockquote>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={`space-y-6 ${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}>
                <div className="space-y-2">
                  <h3 className="font-display text-3xl uppercase tracking-tight text-white">
                    {builder.name}
                  </h3>
                  <p className="text-color-hope-green font-semibold uppercase tracking-[0.2em] text-sm">
                    {builder.title}
                  </p>
                  <p className="text-white/80 text-sm uppercase tracking-[0.3em]">
                    {builder.role}
                  </p>
                </div>

                <p className="text-white/90 leading-relaxed text-lg">
                  {builder.bio}
                </p>

                {/* Expertise tags */}
                <div className="space-y-3">
                  <p className="text-white/70 text-sm uppercase tracking-[0.3em]">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {builder.expertise.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full bg-color-hope-green/20 text-color-hope-green text-sm border border-color-hope-green/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="pt-4">
                  <a
                    href={`mailto:${builder.contact}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-color-warning-orange/20 text-color-warning-orange border border-color-warning-orange/30 hover:bg-color-warning-orange/30 transition-colors"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Connect with {builder.name.split(' ')[0]}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ACT info box */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-color-container-black/60 to-color-container-black/80 border border-white/10">
          <div className="text-center space-y-4">
            <h4 className="font-display text-xl uppercase tracking-tight text-color-hope-green">
              A Curious Tractor (ACT)
            </h4>
            <p className="text-white/90 leading-relaxed max-w-3xl mx-auto">
              A collective that refuses to accept that some children are recyclable waste.
              We build infrastructure for transformation, not charity for problems.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <a
                href="mailto:partnerships@acurioustractor.com"
                className="px-4 py-2 rounded-lg bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30 hover:bg-color-hope-green/30 transition-colors"
              >
                Partnership Inquiries
              </a>
              <a
                href="mailto:funding@acurioustractor.com"
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Investment Opportunities
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}