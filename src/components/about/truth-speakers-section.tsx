import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";

const truthSpeakers = [
  {
    name: "Kate Bjur & G Rangiawha",
    organization: "Interlace Advisory",
    role: "The Bridge Between Lived Experience and Systemic Change",
    description: "Through Interlace Advisory, they ensure young people aren't just consulted but centered - their voices not extracted but elevated, their wisdom not borrowed but honored.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/kate-bjur-g-rangiawha.jpg",
    impact: "Centering young voices in transformation"
  },
  {
    name: "Three Young Architects",
    organization: "Interlace Advisory",
    role: "The Heartbeat of Authenticity",
    description: "Working through Interlace Advisory, these young people who survived the system now design its replacement. Two spent time in rooms identical to the Brisbane Youth Detention Centre recreation - they know the specific frequency of that fluorescent hum because it lives in their skeletal memory.",
    quote: "You can't unknow what you know, but you can choose what you build next.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/young-architects.jpg",
    impact: "Lived experience informing design"
  }
];

const internationalAlliance = [
  {
    name: "Dr. David Maguire",
    organization: "CEO, Diagrama Foundation",
    role: "The Revolutionary Disguised as a Respectable CEO",
    description: "Opened doors to facilities across Spain, guided A Curious Tractor through the sunset-colored rooms where young people learn AutoCAD instead of compliance. His radical belief: dignity is more powerful than detention.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/david-maguire.jpg",
    location: "Spain",
    impact: "73% success rate model"
  },
  {
    name: "Young People of Diagrama",
    organization: "Diagrama Foundation",
    role: "The Teachers Who Never Knew They Were Teaching",
    description: "Every conversation recorded with consent, every insight freely given, every moment of connection proving what's possible when systems choose healing over harm. They showed us their walls covered in family photos, their vocational certificates, their futures being actively constructed.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/diagrama-youth.jpg",
    location: "Spain",
    impact: "Living proof of possibility"
  }
];

const technologyWeavers = [
  {
    name: "Joe Kwon",
    organization: "CON|X",
    role: "Systems Architect",
    description: "Understands technology isn't the solution - connection is. Building the neural network that links young people to mentors, trauma to healing, isolation to community.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/joe-kwon.jpg"
  },
  {
    name: "Georgia Falzon",
    organization: "CON|X",
    role: "Youth Voice Amplifier",
    description: "Ensures the platform speaks the language of those it serves, not those who fund it.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/georgia-falzon.jpg"
  },
  {
    name: "David Cant",
    organization: "CON|X",
    role: "Creative Force",
    description: "Translating policy into possibility, making the abstract visceral, the theoretical touchable.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/david-cant.jpg"
  },
  {
    name: "Michael",
    organization: "CON|X",
    role: "Lived Experience Navigator",
    description: "Another young person with lived expertise who journeyed to the Witta farm where containers became chambers of transformation, ensuring the technology serves the sacred work of human connection.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/team/michael-conx.jpg"
  }
];

function TeamMemberCard({ member, className = "" }: { member: any; className?: string }) {
  return (
    <div className={`group relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/5 to-white/10 border border-white/20 hover:border-color-hope-green/30 transition-all duration-300 ${className}`}>
      <div className="aspect-[4/3] relative overflow-hidden">
        <Image
          src={member.image}
          alt={`Portrait of ${member.name}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Location badge */}
        {member.location && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 rounded-full bg-color-warning-orange/20 text-color-warning-orange text-xs font-semibold border border-color-warning-orange/30">
              {member.location}
            </span>
          </div>
        )}

        {/* Quote overlay */}
        {member.quote && (
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <blockquote className="text-sm italic leading-relaxed">
              "{member.quote}"
            </blockquote>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h4 className="font-display text-lg uppercase tracking-tight text-white">
            {member.name}
          </h4>
          <p className="text-color-hope-green font-semibold text-sm">
            {member.role}
          </p>
          <p className="text-white/70 text-sm uppercase tracking-[0.2em]">
            {member.organization}
          </p>
        </div>

        <p className="text-white/90 text-sm leading-relaxed">
          {member.description}
        </p>

        {member.impact && (
          <div className="pt-2">
            <span className="inline-block px-3 py-1 rounded-full bg-color-hope-green/20 text-color-hope-green text-xs border border-color-hope-green/30">
              {member.impact}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TruthSpeakersSection() {
  return (
    <section id="truth-speakers" className="bg-color-container-black py-24">
      <div className="mx-auto max-w-6xl px-6 space-y-20">
        {/* Truth Speakers */}
        <div>
          <SectionHeading
            eyebrow="Lived Experience"
            title="The Truth Speakers"
            description="The bridge between lived experience and systemic change. Through Interlace Advisory, young people aren't just consulted but centered."
            align="left"
          />

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {truthSpeakers.map((speaker) => (
              <TeamMemberCard key={speaker.name} member={speaker} />
            ))}
          </div>
        </div>

        {/* International Alliance */}
        <div>
          <SectionHeading
            eyebrow="Global Evidence"
            title="The International Alliance"
            description="Revolutionary partnerships that prove dignity is more powerful than detention."
            align="left"
          />

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {internationalAlliance.map((ally) => (
              <TeamMemberCard key={ally.name} member={ally} />
            ))}
          </div>

          {/* Additional international partners */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h5 className="font-semibold text-color-hope-green mb-2">Young Artists</h5>
              <p className="text-sm text-white/80">Bimberi Youth Justice Centre, Canberra - Transforming trauma into art through shoe design workshops</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h5 className="font-semibold text-color-hope-green mb-2">Marketing Team</h5>
              <p className="text-sm text-white/80">Diagrama UK - Translating transformation into irresistible evidence</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h5 className="font-semibold text-color-hope-green mb-2">Global Network</h5>
              <p className="text-sm text-white/80">International youth justice practitioners sharing knowledge and hope</p>
            </div>
          </div>
        </div>

        {/* Technology Weavers */}
        <div>
          <SectionHeading
            eyebrow="CON|X Launch: Feb 24, 2025"
            title="The Technology Weavers"
            description="Building the neural network that links young people to mentors, trauma to healing, isolation to community."
            align="left"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {technologyWeavers.map((weaver) => (
              <TeamMemberCard key={weaver.name} member={weaver} className="h-full" />
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-color-warning-orange/10 to-color-hope-green/10 border border-color-warning-orange/20">
            <div className="text-center space-y-4">
              <h5 className="font-display text-xl uppercase tracking-tight text-color-warning-orange">
                CON|X Launch Event
              </h5>
              <p className="text-white/90">
                Container 3 doesn't end - it begins. The physical experience launches into digital architecture.
              </p>
              <a
                href="https://events.humanitix.com/conx-launch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-color-warning-orange/20 text-color-warning-orange border border-color-warning-orange/30 hover:bg-color-warning-orange/30 transition-colors"
              >
                <span>🎟️</span>
                Reserve Your Spot - February 24, 2025
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}