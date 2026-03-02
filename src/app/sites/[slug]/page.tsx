import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Globe, Users, Calendar, Heart, ArrowRight, ExternalLink, Shield, Dumbbell, Tent, UserCheck, Home, GraduationCap, Handshake, CheckCircle2, Camera } from 'lucide-react';
import { ContactModal } from '@/components/sites/ContactModal';

// Rich site content per org — will move to DB later
const ORG_SITE_CONTENT: Record<string, any> = {
  'bg-fit': {
    images: {
      hero: '/images/orgs/bg-fit/hero.jpg',
      founder: '/images/orgs/bg-fit/brodie.jpg',
      logo: '/images/orgs/bg-fit/logo.svg',
      gallery: [
        { src: '/images/orgs/bg-fit/gallery-1.jpg', alt: 'On-country camp activities' },
        { src: '/images/orgs/bg-fit/gallery-2.jpg', alt: 'Youth fitness session at BG Fit gym' },
        { src: '/images/orgs/bg-fit/gallery-3.jpg', alt: 'CAMPFIRE community gathering' },
        { src: '/images/orgs/bg-fit/gallery-4.jpg', alt: 'Cultural camp on country' },
        { src: '/images/orgs/bg-fit/gallery-5.jpg', alt: 'Mount Isa mentoring program' },
        { src: '/images/orgs/bg-fit/gallery-6.jpg', alt: 'Youth engagement and connection' },
      ],
    },
    heroSubtitle: 'Building Strength Through Culture and Connection',
    heroDescription: 'An Indigenous-led youth empowerment program combining fitness, cultural connection, and on-country healing in Mount Isa and Doomadgee communities.',
    founder: {
      name: 'Brodie Germaine',
      title: 'Founder & Program Leader',
      heritage: 'Pita Pita Waka\'i man',
      bio: 'A proud Pita Pita Waka\'i man from Mount Isa, Brodie has dedicated his life to helping young people find strength through fitness and cultural connection. As a gym owner and community leader, he understands that showing up consistently changes lives. Through BG Fit, Brodie combines his passion for boxing and fitness with deep cultural knowledge to create transformative experiences for Indigenous youth.',
    },
    stats: [
      { value: '15+', label: 'Young people engaged' },
      { value: '500+', label: 'Kids reached weekly in schools' },
      { value: '4', label: 'Schools partnered' },
      { value: '85%', label: 'Diversion success rate' },
      { value: '52', label: 'Weekly fitness sessions/year' },
      { value: '400+', label: 'Youth engaged annually' },
    ],
    programs: [
      {
        icon: 'Dumbbell',
        title: 'Weekly Fitness & Mentoring',
        description: '52 sessions per year at Brodie\'s gym — boxing, strength training, and mentoring in a safe, culturally grounded space.',
      },
      {
        icon: 'Tent',
        title: 'Quarterly Cultural Camps',
        description: '4 on-country experiences each year with Elders, traditional practices, yarning circles, and leadership development.',
      },
      {
        icon: 'UserCheck',
        title: '1-on-1 Youth Support',
        description: 'Individualised support plans, advocacy, and check-ins to help young people navigate challenges and build resilience.',
      },
      {
        icon: 'Home',
        title: 'Family Engagement',
        description: 'Monthly family activities that strengthen connections and build a community of support around each young person.',
      },
      {
        icon: 'GraduationCap',
        title: 'Education & Work Pathways',
        description: 'Supporting young people into education, training, and employment through mentoring and practical skills development.',
      },
      {
        icon: 'Handshake',
        title: 'Community Connection',
        description: 'Peer support networks, positive police-youth engagement, and guest sportspeople providing culturally strong role models.',
      },
    ],
    values: [
      { title: 'Cultural Strength', description: 'Everything we do is grounded in culture. Elders guide our programs, traditional practices shape our camps, and cultural identity drives healing.' },
      { title: 'Youth Empowerment', description: 'We believe in strengths-based approaches. Young people aren\'t problems to fix — they\'re leaders to nurture.' },
      { title: 'Community-Led', description: 'This is community-owned and community-driven. Brodie lives in Mount Isa, knows these young people, and shows up every day.' },
      { title: 'Holistic Support', description: 'Fitness is the foundation, but we support the whole person — mental health, family, education, employment, and cultural connection.' },
    ],
    whySection: {
      challenge: 'Indigenous young people are vastly overrepresented in the youth justice system. In Mount Isa, many face cycles of disengagement, contact with police, and a system that punishes rather than heals. The community needs solutions that address root causes — not more of the same.',
      response: 'BG Fit\'s CAMPFIRE framework (Culture, Ancestral Wisdom, Mentoring, Personal Growth, Fitness, Identity, Resilience, Empowerment) disrupts this cycle. By combining physical fitness with cultural healing, Elder mentorship, and positive relationships, we create pathways that lead to pride, not prison.',
    },
    funding: {
      name: 'Youth Justice Kickstarter Grant',
      funder: 'Youth Justice Queensland',
      amount: '$280,000',
      period: 'July 2025 – February 2027',
    },
    cta: {
      title: 'Refer a Young Person',
      description: 'Know a young person who could benefit from CAMPFIRE? Referrals come from schools, police, Youth Justice, families, and community members.',
      email: 'brodiegermainefitness@gmail.com',
      phone: '0411 388 526',
    },
  },
};

const PROGRAM_ICONS: Record<string, any> = {
  Dumbbell, Tent, UserCheck, Home, GraduationCap, Handshake,
};

export default async function OrgSitePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (!org) notFound();

  const siteContent = ORG_SITE_CONTENT[params.slug];
  const hasOwnWebsite = org.website_url && !org.website_url.includes('justicehub');

  // Fetch public team members
  const { data: teamLinks } = await (supabase as any)
    .from('organizations_profiles')
    .select('public_profiles(id, full_name, tagline, photo_url, slug)')
    .eq('organization_id', org.id)
    .limit(8);

  const team = (teamLinks || []).map((t: any) => t.public_profiles).filter(Boolean);

  // Fetch stories
  const { data: stories } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, published_date, hero_image_url')
    .or(`organization_id.eq.${org.id}`)
    .eq('status', 'published')
    .order('published_date', { ascending: false })
    .limit(3);

  // Rich site (has content data)
  if (siteContent) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero — Full Width with Photo */}
        <header className="relative text-white overflow-hidden">
          {siteContent.images?.hero && (
            <img src={siteContent.images.hero} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#43302b]/95 via-[#43302b]/80 to-[#43302b]/50" />
          <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="max-w-3xl">
              {siteContent.images?.logo && (
                <img src={siteContent.images.logo} alt={org.name} className="w-14 h-14 rounded-lg mb-6 bg-white/10 p-1" />
              )}
              <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight drop-shadow-lg">{org.name}</h1>
              <p className="text-2xl text-orange-300 font-medium mb-4">{siteContent.heroSubtitle}</p>
              <p className="text-lg text-white/90 leading-relaxed max-w-2xl">{siteContent.heroDescription}</p>

              <div className="flex flex-wrap gap-3 mt-8">
                {(org.city || org.location) && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-medium rounded-full">
                    <MapPin className="w-4 h-4" /> {org.city || org.location}{org.state ? `, ${org.state}` : ''}
                  </span>
                )}
                {siteContent.funding && (
                  <span className="flex items-center gap-1.5 bg-orange-600/40 backdrop-blur-sm px-4 py-2 text-sm font-medium rounded-full">
                    <Shield className="w-4 h-4" /> Funded by {siteContent.funding.funder}
                  </span>
                )}
                {hasOwnWebsite && (
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-orange-600 px-4 py-2 text-sm font-bold rounded-full hover:bg-orange-700 transition-colors">
                    Visit Full Website <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <section className="bg-[#fdf8f6] border-b border-orange-100">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {siteContent.stats.map((stat: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black text-[#43302b]">{stat.value}</div>
                  <div className="text-xs text-[#8b7355] font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Section */}
        {siteContent.whySection && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-black mb-8 text-center">Why {org.name} Exists</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg">
                <h3 className="font-black text-red-800 mb-3">The Challenge</h3>
                <p className="text-red-900/80 leading-relaxed">{siteContent.whySection.challenge}</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg">
                <h3 className="font-black text-green-800 mb-3">Our Response</h3>
                <p className="text-green-900/80 leading-relaxed">{siteContent.whySection.response}</p>
              </div>
            </div>
          </section>
        )}

        {/* Programs */}
        {siteContent.programs && (
          <section className="bg-[#fdf8f6] border-y border-orange-100">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <h2 className="text-3xl font-black mb-3 text-center">What We Offer</h2>
              <p className="text-center text-[#8b7355] mb-10 max-w-2xl mx-auto">Six core programs that combine physical fitness with cultural healing, mentorship, and community connection.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {siteContent.programs.map((program: any, i: number) => {
                  const Icon = PROGRAM_ICONS[program.icon] || Calendar;
                  return (
                    <div key={i} className="bg-white border-2 border-[#43302b]/10 p-6 rounded-lg hover:border-orange-300 hover:shadow-lg transition-all">
                      <div className="inline-flex p-3 bg-orange-100 rounded-lg mb-4">
                        <Icon className="w-6 h-6 text-orange-700" />
                      </div>
                      <h3 className="font-black text-lg mb-2 text-[#43302b]">{program.title}</h3>
                      <p className="text-sm text-[#8b7355] leading-relaxed">{program.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Photo Gallery */}
        {siteContent.images?.gallery && siteContent.images.gallery.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-black mb-3 text-center text-[#43302b] flex items-center justify-center gap-3">
              <Camera className="w-7 h-7 text-orange-600" /> In Action
            </h2>
            <p className="text-center text-[#8b7355] mb-8">On country, in the gym, and in the community</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {siteContent.images.gallery.map((img: any, i: number) => (
                <div key={i} className={`relative overflow-hidden rounded-lg ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                  <img
                    src={img.src}
                    alt={img.alt}
                    className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${i === 0 ? 'h-64 md:h-full' : 'h-48 md:h-56'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <p className="absolute bottom-3 left-3 text-white text-sm font-medium">{img.alt}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Founder */}
        {siteContent.founder && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <div className="max-w-4xl mx-auto md:flex gap-10 items-start">
              <div className="flex-shrink-0 mb-6 md:mb-0">
                {siteContent.images?.founder ? (
                  <img src={siteContent.images.founder} alt={siteContent.founder.name} className="w-36 h-36 rounded-2xl object-cover border-4 border-[#43302b] shadow-lg" />
                ) : (
                  <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-orange-200 to-orange-100 border-4 border-[#43302b] flex items-center justify-center text-5xl font-black text-[#43302b]">
                    {siteContent.founder.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-orange-600 mb-1">{siteContent.founder.heritage}</p>
                <h2 className="text-3xl font-black mb-1">{siteContent.founder.name}</h2>
                <p className="text-lg text-[#8b7355] font-medium mb-4">{siteContent.founder.title}</p>
                <p className="text-[#5c4033] leading-relaxed">{siteContent.founder.bio}</p>
              </div>
            </div>
          </section>
        )}

        {/* Values */}
        {siteContent.values && (
          <section className="bg-white border-y border-gray-200">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <h2 className="text-3xl font-black mb-10 text-center text-[#43302b]">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {siteContent.values.map((value: any, i: number) => (
                  <div key={i} className="bg-[#fdf8f6] p-6 rounded-lg border-2 border-[#43302b]/10">
                    <CheckCircle2 className="w-6 h-6 text-orange-600 mb-3" />
                    <h3 className="font-black text-lg mb-2 text-[#43302b]">{value.title}</h3>
                    <p className="text-sm text-[#5c4033] leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Team */}
        {team.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-black mb-8 text-center flex items-center justify-center gap-3">
              <Users className="w-7 h-7 text-orange-600" /> Our Team
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((person: any) => (
                <Link key={person.id} href={`/people/${person.slug}`} className="text-center group">
                  {person.photo_url ? (
                    <img src={person.photo_url} alt={person.full_name} className="w-28 h-28 rounded-full mx-auto object-cover border-3 border-[#43302b] group-hover:border-orange-600 transition-colors" />
                  ) : (
                    <div className="w-28 h-28 rounded-full mx-auto bg-orange-100 border-3 border-[#43302b] flex items-center justify-center text-3xl font-black text-orange-600 group-hover:border-orange-600 transition-colors">
                      {person.full_name?.charAt(0)}
                    </div>
                  )}
                  <p className="font-bold mt-3">{person.full_name}</p>
                  {person.tagline && <p className="text-xs text-[#8b7355] mt-1">{person.tagline}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Stories */}
        {stories && stories.length > 0 && (
          <section className="bg-[#fdf8f6] border-y border-orange-100">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <h2 className="text-3xl font-black mb-8 text-center flex items-center justify-center gap-3">
                <Heart className="w-7 h-7 text-orange-600" /> Stories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stories.map((story: any) => (
                  <Link key={story.id} href={`/stories/${story.slug}`}
                    className="bg-white border-2 border-[#43302b]/10 p-6 rounded-lg hover:shadow-lg transition-shadow">
                    <h3 className="font-bold text-lg mb-2">{story.title}</h3>
                    {story.excerpt && <p className="text-sm text-[#8b7355] line-clamp-3">{story.excerpt}</p>}
                    <span className="inline-flex items-center gap-1 text-orange-600 text-sm font-bold mt-4">
                      Read story <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Funding Transparency */}
        {siteContent.funding && (
          <section className="max-w-6xl mx-auto px-6 py-12">
            <div className="max-w-2xl mx-auto text-center bg-blue-50 border-2 border-blue-200 rounded-lg p-8">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-black text-lg mb-2">Funded Program</h3>
              <p className="text-blue-800 font-bold text-xl mb-1">{siteContent.funding.name}</p>
              <p className="text-blue-600">{siteContent.funding.funder} &middot; {siteContent.funding.amount} &middot; {siteContent.funding.period}</p>
            </div>
          </section>
        )}

        {/* CTA — Referral */}
        {siteContent.cta && (
          <section className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <div className="max-w-6xl mx-auto px-6 py-16 text-center">
              <h2 className="text-3xl font-black mb-3">{siteContent.cta.title}</h2>
              <p className="text-lg text-orange-100 max-w-2xl mx-auto mb-8">{siteContent.cta.description}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <ContactModal orgId={org.id} orgName={org.name} />
                <a href={`mailto:${siteContent.cta.email}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-700 font-bold rounded-lg hover:bg-orange-50 transition-colors">
                  <Mail className="w-5 h-5" /> {siteContent.cta.email}
                </a>
                <a href={`tel:${siteContent.cta.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-colors border border-white/30">
                  <Phone className="w-5 h-5" /> {siteContent.cta.phone}
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Contact & Footer */}
        <footer className="bg-[#43302b] text-white">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="font-black text-lg">{org.name}</p>
                <p className="text-sm text-white/60 mt-1">
                  {org.street_address && `${org.street_address}, `}{org.location}, {org.state} {org.postcode}
                </p>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                {org.contact_email && (
                  <a href={`mailto:${org.contact_email}`} className="text-white/70 hover:text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> Email
                  </a>
                )}
                {org.phone && (
                  <a href={`tel:${org.phone}`} className="text-white/70 hover:text-white flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                )}
                {hasOwnWebsite && (
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
                <Link href={`/organizations/${org.slug}`} className="text-white/70 hover:text-white">
                  JusticeHub Profile
                </Link>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/40">
              Powered by <Link href="/" className="text-orange-400 hover:text-orange-300 font-bold">JusticeHub</Link> &middot; Supporting community organizations in youth justice
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Fallback — generic site for orgs without rich content
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-br from-earth-900 via-earth-800 to-ochre-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          {org.logo_url && <img src={org.logo_url} alt={org.name} className="w-16 h-16 rounded-lg mb-4 border-2 border-white/20" />}
          <h1 className="text-5xl font-black mb-3">{org.name}</h1>
          {org.tagline && <p className="text-xl text-ochre-200 font-medium mb-2">{org.tagline}</p>}
          <div className="flex flex-wrap gap-3 mt-4">
            {org.location && (
              <span className="flex items-center gap-1.5 bg-white/10 px-4 py-2 text-sm rounded-full">
                <MapPin className="w-4 h-4" /> {org.location}{org.state ? `, ${org.state}` : ''}
              </span>
            )}
            {org.type && <span className="bg-white/10 px-4 py-2 text-sm rounded-full capitalize">{org.type}</span>}
            {hasOwnWebsite && (
              <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-ochre-600 px-4 py-2 text-sm font-bold rounded-full hover:bg-ochre-700">
                Visit Website <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-black mb-4">About</h2>
        <p className="text-lg text-earth-700 leading-relaxed max-w-3xl">
          {org.description || `${org.name} is a community organization supported by JusticeHub.`}
        </p>
        <div className="flex flex-wrap gap-6 mt-8">
          {org.contact_email && (
            <a href={`mailto:${org.contact_email}`} className="flex items-center gap-2 text-ochre-700 hover:text-ochre-900 font-medium">
              <Mail className="w-5 h-5" /> {org.contact_email}
            </a>
          )}
          {org.phone && (
            <a href={`tel:${org.phone}`} className="flex items-center gap-2 text-ochre-700 hover:text-ochre-900 font-medium">
              <Phone className="w-5 h-5" /> {org.phone}
            </a>
          )}
        </div>
        {org.tags && org.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {org.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-ochre-50 text-ochre-800 border border-ochre-200 text-sm font-medium rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </section>

      {team.length > 0 && (
        <section className="bg-sand-50 border-y border-sand-200">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-black mb-6">Our Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((person: any) => (
                <Link key={person.id} href={`/people/${person.slug}`} className="text-center group">
                  <div className="w-24 h-24 rounded-full mx-auto bg-ochre-100 border-2 border-black flex items-center justify-center text-2xl font-black text-ochre-600">
                    {person.full_name?.charAt(0)}
                  </div>
                  <p className="font-bold mt-2 text-sm">{person.full_name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-earth-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            Powered by <Link href="/" className="text-ochre-400 hover:text-ochre-300 font-bold">JusticeHub</Link>
          </p>
          <Link href={`/organizations/${org.slug}`} className="text-sm text-white/60 hover:text-white">
            View on JusticeHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
