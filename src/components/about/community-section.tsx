import { SectionHeading } from "@/components/section-heading";

const communityStats = [
  {
    number: "500+",
    label: "Experiences Delivered",
    description: "Young people, policymakers, and community leaders who've walked through all three containers"
  },
  {
    number: "73%",
    label: "Success Rate",
    description: "Proven outcomes from Diagrama Foundation's approach that inspired our model"
  },
  {
    number: "15",
    label: "Partner Organizations",
    description: "Youth justice centres, universities, and advocacy groups actively using CONTAINED"
  },
  {
    number: "∞",
    label: "Conversations Started",
    description: "Immeasurable dialogue sparked about what's actually possible in youth justice"
  }
];

const testimonials = [
  {
    quote: "I've worked in youth justice for 15 years and I've never seen anything this powerful. It doesn't just tell you what's wrong - it shows you what's possible.",
    author: "Sarah Chen",
    role: "Youth Justice Social Worker",
    organization: "Queensland Government",
    avatar: "/images/testimonials/sarah-chen.jpg"
  },
  {
    quote: "They built the room I lived in. The fluorescent hum, the concrete walls - but then they showed me the alternative. Now I'm studying AutoCAD because I know what dignity looks like.",
    author: "Marcus*",
    role: "Experience Participant",
    organization: "Former Youth Detention",
    avatar: "/images/testimonials/marcus.jpg",
    note: "*Name changed for privacy"
  },
  {
    quote: "This isn't consultation - it's transformation. Every politician, every bureaucrat, every person who makes decisions about young people needs to walk through these containers.",
    author: "Dr. Amanda Foster",
    role: "Professor of Criminology",
    organization: "University of Queensland",
    avatar: "/images/testimonials/amanda-foster.jpg"
  },
  {
    quote: "We've been trying to explain for years why detention doesn't work. CONTAINED makes it undeniable. The data becomes visceral, the statistics become stories.",
    author: "James Robertson",
    role: "Director",
    organization: "Youth Advocacy Centre",
    avatar: "/images/testimonials/james-robertson.jpg"
  }
];

const upcomingEvents = [
  {
    date: "Feb 24, 2025",
    title: "CON|X Platform Launch",
    location: "Brisbane, Australia",
    description: "Container 3 doesn't end - it begins. The physical experience launches into digital architecture.",
    type: "Launch Event",
    link: "https://events.humanitix.com/conx-launch"
  },
  {
    date: "Mar 15, 2025",
    title: "Youth Justice Reform Summit",
    location: "Melbourne, Australia",
    description: "CONTAINED experience integrated into national youth justice reform discussions.",
    type: "Policy Forum",
    link: "/events/reform-summit"
  },
  {
    date: "Apr 2025",
    title: "International Expansion Tour",
    location: "Multiple Cities",
    description: "Bringing CONTAINED to youth justice systems across the Pacific region.",
    type: "Tour",
    link: "/events/international-tour"
  }
];

const partnerLogos = [
  { name: "Interlace Advisory", logo: "/images/partners/interlace-advisory.png" },
  { name: "Diagrama Foundation", logo: "/images/partners/diagrama.png" },
  { name: "Youth Advocacy Centre", logo: "/images/partners/youth-advocacy.png" },
  { name: "University of Queensland", logo: "/images/partners/uq.png" },
  { name: "Bimberi Youth Justice Centre", logo: "/images/partners/bimberi.png" },
  { name: "Queensland Government", logo: "/images/partners/qld-gov.png" }
];

export function CommunitySection() {
  return (
    <section id="community" className="bg-color-container-black py-24">
      <div className="mx-auto max-w-6xl px-6 space-y-20">
        <SectionHeading
          eyebrow="Growing Movement"
          title="The Community of Change"
          description="Revolution spreads through connection. What started with three containers has sparked a movement of people who refuse to accept that some children are disposable."
          align="center"
        />

        {/* Community stats */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {communityStats.map((stat) => (
            <div key={stat.label} className="text-center space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-4xl font-bold text-color-hope-green">
                {stat.number}
              </div>
              <div className="text-sm font-semibold uppercase tracking-wide text-white">
                {stat.label}
              </div>
              <div className="text-xs text-white/70 leading-relaxed">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Voices from the Movement
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20">
                <div className="space-y-4">
                  <blockquote className="text-white/90 leading-relaxed italic">
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-color-hope-green/20 flex items-center justify-center overflow-hidden">
                      {testimonial.avatar ? (
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-color-hope-green font-semibold text-lg">
                          {testimonial.author.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-color-hope-green">
                        {testimonial.role}
                      </div>
                      <div className="text-xs text-white/60">
                        {testimonial.organization}
                      </div>
                      {testimonial.note && (
                        <div className="text-xs text-white/50 italic">
                          {testimonial.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Join the Movement
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-gradient-to-br from-color-warning-orange/10 to-color-hope-green/10 border border-color-warning-orange/20 hover:border-color-warning-orange/40 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-color-warning-orange bg-color-warning-orange/20 px-2 py-1 rounded-full border border-color-warning-orange/30">
                      {event.type}
                    </span>
                    <span className="text-xs text-white/60">
                      {event.date}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-white group-hover:text-color-hope-green transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-sm text-white/60">
                      📍 {event.location}
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <a
                    href={event.link}
                    target={event.link.startsWith('http') ? '_blank' : undefined}
                    rel={event.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 text-sm text-color-hope-green hover:text-color-warning-orange transition-colors"
                  >
                    <span>Learn More</span>
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner organizations */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Partners in Transformation
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {partnerLogos.map((partner) => (
              <div key={partner.name} className="group text-center">
                <div className="aspect-square w-full max-w-20 mx-auto mb-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-color-hope-green/30 transition-all flex items-center justify-center overflow-hidden">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity filter grayscale group-hover:grayscale-0"
                  />
                </div>
                <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                  {partner.name}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <p className="text-white/80 mb-4">
              Want to bring CONTAINED to your organization?
            </p>
            <a
              href="mailto:partnerships@acurioustractor.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30 hover:bg-color-hope-green/30 transition-colors"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Become a Partner
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}