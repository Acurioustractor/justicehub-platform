import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Globe, Users, Calendar, Heart, ArrowRight, ExternalLink, Shield, Dumbbell, Tent, UserCheck, Home, GraduationCap, Handshake, CheckCircle2, Camera, Compass, Scale, TreePine, MessageCircle, Mic, Film, BookOpen, Hammer, UtensilsCrossed, Play, Quote, DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import { ContactModal } from '@/components/sites/ContactModal';
import { ShareButton } from '@/components/ShareButton';
import NewsletterSignup from '@/components/NewsletterSignup';
import SiteGallery from '@/components/sites/SiteGallery';
import FundingTransparency from '@/components/sites/FundingTransparency';
import PeerValidations from '@/components/sites/PeerValidations';

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
  'oonchiumpa': {
    images: {
      hero: '/images/orgs/oonchiumpa/hero.jpg',
      founder: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/profile-images/storytellers/kristy_bloomfield.jpg',
      gallery: [
        { src: '/images/orgs/oonchiumpa/homestead.jpg', alt: 'On-country walk at Atnarpa with MacDonnell Ranges' },
        { src: '/images/orgs/oonchiumpa/atnarpa/originals/20251103-DJI_0271.jpg', alt: 'Aerial view of Atnarpa Station from drone' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/story-images/stories/084fcde5-0941-4f6e-9966-ec9c4b7116b3/2.png', alt: 'Youth exploring Standley Chasm gorge' },
        { src: '/images/orgs/oonchiumpa/atnarpa/campsite/20251103-1E5A4798.jpg', alt: 'Campsite at Atnarpa Homestead' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/story-images/stories/084fcde5-0941-4f6e-9966-ec9c4b7116b3/3.png', alt: 'Girls day trip — peace signs at Standley Chasm' },
        { src: '/images/orgs/oonchiumpa/atnarpa/originals/img-009.jpg', alt: 'Red earth country at Atnarpa Station' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/story-images/stories/2c7a2131-c371-4ff5-8d83-b7707f412404/2.png', alt: 'Basketball girls team with Oonchiumpa staff' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/story-images/stories/bfde4125-ec37-4456-a1c5-b3b61a32eec0/2.png', alt: 'Young fellas on country in the MacDonnell Ranges' },
        { src: '/images/orgs/oonchiumpa/law-students.jpg', alt: 'ANU Law students True Justice partnership at Anzac Hill' },
        { src: '/images/orgs/oonchiumpa/atnarpa/campsite/20251103-1E5A4819.jpg', alt: 'Camp gathering area at Atnarpa' },
      ],
    },
    heroSubtitle: 'Two Cultures, One World, Working Together',
    heroDescription: 'An Aboriginal community-controlled organisation in Central Australia empowering communities through cultural preservation, youth mentorship, and deep listening on country across 7 language groups.',
    founder: {
      name: 'Kristy Bloomfield',
      title: 'Visionary Leader & Director',
      heritage: 'Eastern Arrernte Traditional Owner',
      bio: 'Kristy Bloomfield is a visionary leader and passionate advocate for Indigenous empowerment and community. As an Eastern Arrernte Traditional Owner, she brings cultural authority and deep connection to country into everything Oonchiumpa does. Her leadership spans youth mentorship, cultural brokerage, and building bridges between Aboriginal communities and service systems across Central Australia.',
    },
    stats: [
      { value: '95%', label: 'Diversion success' },
      { value: '72%', label: 'School re-engagement' },
      { value: '97.6%', label: 'Cheaper than detention' },
      { value: '32+', label: 'Partner organisations' },
      { value: '7', label: 'Language groups served' },
      { value: '150km', label: 'Service reach from Mparntwe' },
    ],
    programs: [
      {
        icon: 'Users',
        title: 'Youth Mentorship & Cultural Healing',
        description: 'Culturally grounded mentorship, basketball, on-country experiences, leadership development, and Elder-guided healing rooted in long-term trust.',
      },
      {
        icon: 'Scale',
        title: 'True Justice: Deep Listening on Country',
        description: 'Partnership with ANU since 2022 — restorative justice through deep listening circles, cultural authority recognition, and trauma-informed community healing.',
      },
      {
        icon: 'TreePine',
        title: 'Atnarpa Homestead On-Country',
        description: 'Cultural camps at Atnarpa Station — traditional knowledge transmission, bush tucker and medicine programs, and intergenerational connection on country.',
      },
      {
        icon: 'Compass',
        title: 'Cultural Brokerage & Service Navigation',
        description: 'Navigating services across 32+ partner organisations and 7 language groups — cultural interpretation, community advocacy, and partnership facilitation.',
      },
      {
        icon: 'Heart',
        title: 'Good News Stories',
        description: 'Celebrating community strength through storytelling — McDonald\'s Fellas Tour, Girls Day Trip to Standley Chasm, basketball tournaments, and community gatherings.',
      },
      {
        icon: 'MessageCircle',
        title: 'Community Advocacy',
        description: 'Amplifying Aboriginal voices in policy and services — ensuring cultural authority guides decision-making and that communities lead their own solutions.',
      },
    ],
    values: [
      { title: 'Cultural Authority', description: 'Everything is grounded in cultural authority and traditional knowledge. Elders guide programs, cultural protocols are respected, and Aboriginal sovereignty is exercised in all decision-making.' },
      { title: 'Deep Listening', description: 'True understanding comes from deep listening — to community, to country, to Elders. We put community voices and aspirations at the centre of everything we do.' },
      { title: 'On-Country Healing', description: 'Connection to country and culture is medicine. Our on-country programs at Atnarpa create lasting healing through traditional practices and intergenerational knowledge.' },
      { title: 'Community Strength', description: 'Building bridges between cultures and communities. Two cultures, one world, working together — creating sustainable partnerships that respect and honour both knowledge systems.' },
    ],
    whySection: {
      challenge: 'Aboriginal young people in Central Australia are vastly overrepresented in the youth justice system. In Alice Springs, many face cycles of disengagement, contact with police, and a system that punishes rather than heals. Mainstream services often lack cultural safety and fail to address root causes.',
      response: 'Oonchiumpa proves that culture is medicine and that Aboriginal communities know what works for Aboriginal young people. Through culturally grounded mentorship, on-country healing at Atnarpa, deep listening circles with ANU, and service navigation across 32+ partners, Oonchiumpa creates pathways rooted in cultural authority — not deficit.',
    },
    funding: {
      name: 'NIAA Central Australia Youth Safety',
      funder: 'National Indigenous Australians Agency (NIAA)',
      amount: '$1.4M verified in GrantScope',
      period: '2023-24',
    },
    cta: {
      title: 'Connect with Oonchiumpa',
      description: 'Looking to refer a young person, partner with us, or learn more about our cultural programs in Central Australia? We work across 7 language groups within 150km of Mparntwe (Alice Springs).',
      email: 'info@oonchiumpa.com.au',
      phone: null,
    },
  },
  'mounty-yarns': {
    images: {
      hero: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/20251210-1E5A8290.jpg',
      founder: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/20251210-1E5A8203.jpg',
      gallery: [
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/1E5A8327.jpg', alt: 'Building the Backyard Campus — containers and Aboriginal flag in background' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/DJI_0453.jpg', alt: 'Drone aerial view of the Backyard Campus site' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/20251210-1E5A8122.jpg', alt: 'Young people working together on the backyard build' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/1E5A8345.jpg', alt: 'Shipping containers with shade sail — the gym and kitchen spaces' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/DJI_0431.jpg', alt: 'Aerial view of Mount Druitt — where Mounty Yarns calls home' },
        { src: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/20251210-1E5A8267.jpg', alt: 'Building garden beds — wheelbarrows and teamwork' },
      ],
    },
    heroSubtitle: 'Nothing About Us Without Us',
    heroDescription: 'A youth-led storytelling and advocacy organisation in Western Sydney\'s Mount Druitt. Young people lead documentary filmmaking, podcasting, community journalism, and the Backyard Campus, challenging deficit narratives and creating real change.',
    founder: {
      name: 'Shayle McKellar',
      title: 'Lived Experience Consultant & Youth Worker',
      heritage: 'Proud Wangkamarra man from Burke',
      bio: 'Shayle finished his HSC while in custody, then turned his experience into expertise. As a lived experience consultant and youth worker with Just Reinvest, he co-built Mounty Yarns to give young people the platform he never had. "I was the kid that was locked up. They enter the system as victims, and they come out as even more victimised people. It\'s very important that you listen to these young people because they are the ones going through it."',
    },
    stats: [
      { value: '50+', label: 'Young people trained' },
      { value: '100K+', label: 'Documentary viewers' },
      { value: '1→20', label: 'Team growth' },
      { value: '12', label: 'Community voices recorded' },
      { value: '6+', label: 'Programs running' },
      { value: '3-4x', label: 'Weekly attendance' },
    ],
    programs: [
      {
        icon: 'Film',
        title: 'Documentary & Media Production',
        description: 'Young people write, film, and produce documentaries and content that share their real stories — reaching 100,000+ viewers and challenging mainstream narratives about Western Sydney.',
      },
      {
        icon: 'Mic',
        title: 'Youth Peak & Advocacy',
        description: 'Youth-led policy advocacy program co-run by Leah and Adam. Young people speak directly to government, researchers, and services about what actually works.',
      },
      {
        icon: 'Hammer',
        title: 'Backyard Campus Activation',
        description: 'Young people designing and building their own community space — yarning circle, gym container, basketball court, kitchen, and Aboriginal flag ground mural.',
      },
      {
        icon: 'Dumbbell',
        title: 'Boxing & Gym Programs',
        description: 'Fitness programs run by Archie and the team — boxing, strength training, and mentoring in the converted shipping container gym.',
      },
      {
        icon: 'UtensilsCrossed',
        title: 'Cooking & Life Skills',
        description: 'Practical programs where young people learn cooking, nutrition, and life skills together in the kitchen container. Food brings people together.',
      },
      {
        icon: 'Heart',
        title: 'Cultural Connection & Mentoring',
        description: 'Cultural days, case work support, and one-on-one mentoring from workers with lived experience who see young people as people, not files.',
      },
    ],
    values: [
      { title: 'Youth Leadership', description: 'Young people lead everything — from program design to content creation to organisational decisions. Nothing about us without us.' },
      { title: 'Lived Experience as Expertise', description: 'People who have been through the system are the experts on what works. Shayle, Archie, Leah, and the team bring their own journeys into the work every day.' },
      { title: 'Safe Spaces Over Surveillance', description: 'We create spaces where young people can be themselves — no judgment, no pressure, no postcode wars. The Backyard Campus is proof that when you build it right, kids show up.' },
      { title: 'Culture is Protection', description: 'Connection to culture, community, and identity keeps young people strong. Programs blend cultural activities, mentoring, and creative expression.' },
    ],
    whySection: {
      challenge: 'Young people in Mount Druitt face constant police surveillance, over-representation in the justice system, and a media that only tells deficit stories about their community. Support workers come and go. After-hours help barely exists. The system talks about young people but rarely listens to them.',
      response: 'Mounty Yarns puts cameras, microphones, and decision-making power directly into the hands of young people. Their 24-minute documentary has been seen by 100,000+ people. The Backyard Campus gives them a space that\'s theirs. And the team — built from 1 person to 20 — is led by people with lived experience who actually show up.',
    },
    funding: {
      name: 'Youth Justice & Community Strengthening',
      funder: 'Just Reinvest NSW',
      amount: 'Partnership-funded',
      period: 'Ongoing',
    },
    cta: {
      title: 'Work With Mounty Yarns',
      description: 'Youth-led storytelling workshops. Backyard Campus activations. Community voice methodology. Mounty Yarns consults with organisations, governments, and funders who want to centre young people in youth justice reform.',
      email: 'info@mountyyarns.org.au',
      phone: '0400 000 000',
    },
    socialEnterprise: {
      services: [
        { title: 'Storytelling Workshops', description: 'Train your team or community in youth-led documentary, podcast, and media production.' },
        { title: 'Backyard Campus Model', description: 'Replicate the shipping container activation — yarning circles, gym, kitchen, creative spaces.' },
        { title: 'Community Voice Methodology', description: 'Set up an Empathy Ledger-connected story collection system in your community.' },
        { title: 'Justice Reinvestment Advocacy', description: 'Young people trained to speak to government, researchers, and decision-makers.' },
      ],
    },
  },
};

const PROGRAM_ICONS: Record<string, any> = {
  Dumbbell, Tent, UserCheck, Home, GraduationCap, Handshake, Compass, Scale, TreePine, MessageCircle, Users, Heart, Mic, Film, BookOpen, Hammer, UtensilsCrossed, Play,
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name, slug, tagline, description, location, state')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (!org) return { title: 'Organization — JusticeHub' };

  const siteContent = ORG_SITE_CONTENT[params.slug];
  const title = `${org.name} — JusticeHub`;
  const description = org.tagline || org.description?.slice(0, 160) || `${org.name} is supported by JusticeHub.`;
  const heroImage = siteContent?.images?.hero;

  return {
    title,
    description,
    openGraph: {
      title: org.name,
      description,
      type: 'website',
      url: `https://justicehub.com.au/sites/${org.slug}`,
      ...(heroImage && { images: [{ url: heroImage.startsWith('/') ? `https://justicehub.com.au${heroImage}` : heroImage, width: 1200, height: 630, alt: org.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: org.name,
      description,
    },
  };
}

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
  const isBasecamp = org.type === 'basecamp' || org.partner_tier === 'basecamp';
  const ctaEmail = org.contact_email || siteContent?.cta?.email || null;
  const ctaPhone = org.phone || siteContent?.cta?.phone || null;

  // Fetch public team members
  const { data: teamLinks } = await (supabase as any)
    .from('organizations_profiles')
    .select('public_profiles(id, full_name, tagline, photo_url, slug)')
    .eq('organization_id', org.id)
    .limit(8);

  const team = (teamLinks || []).map((t: any) => t.public_profiles).filter(Boolean);

  // Fetch stories tagged to this organization
  let stories: any[] | null = null;
  if (org) {
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, published_at, featured_image_url')
      .eq('organization_id', org.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6);
    stories = data;
  }

  // Fetch partner videos
  const { data: videos } = await supabase
    .from('partner_videos')
    .select('*')
    .eq('organization_id', org.id)
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch partner stories (Good News Stories)
  const { data: partnerStories } = await supabase
    .from('partner_stories')
    .select('*')
    .eq('organization_id', org.id)
    .eq('is_public', true)
    .order('display_order', { ascending: true })
    .limit(10);

  // Fetch community voice stories from ALMA (linked via organization ID)
  const { data: communityVoices } = await (supabase as any)
    .from('alma_stories')
    .select('id, title, summary, story_type, full_story')
    .contains('linked_organization_ids', [org.id])
    .eq('status', 'published')
    .eq('story_type', 'community_voice')
    .order('created_at', { ascending: false })
    .limit(14);

  // Fetch funding records for this org
  const { data: fundingRecords } = await (supabase as any)
    .from('justice_funding')
    .select('source, recipient_name, program_name, amount_dollars, financial_year, funding_type')
    .eq('alma_organization_id', org.id)
    .order('amount_dollars', { ascending: false })
    .limit(10);

  // Rich site (has content data)
  if (siteContent) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      description: siteContent.heroDescription,
      url: `https://justicehub.com.au/sites/${org.slug}`,
      ...(siteContent.images?.hero && { image: siteContent.images.hero.startsWith('/') ? `https://justicehub.com.au${siteContent.images.hero}` : siteContent.images.hero }),
      ...(org.contact_email && { email: org.contact_email }),
      ...(org.phone && { telephone: org.phone }),
      ...(org.website_url && { sameAs: [org.website_url] }),
      address: {
        '@type': 'PostalAddress',
        addressLocality: org.city || org.location,
        addressRegion: org.state,
        ...(org.postcode && { postalCode: org.postcode }),
        addressCountry: 'AU',
      },
    };

    return (
      <div className="min-h-screen bg-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
              {isBasecamp && (
                <Link
                  href="/basecamps"
                  className="inline-flex items-center gap-1.5 bg-[#059669] px-3 py-1.5 text-xs font-bold rounded-full mb-4 hover:bg-[#059669]/90 transition-colors uppercase tracking-wider"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  <Shield className="w-3 h-3" /> {org.state} Basecamp — ALMA Network
                </Link>
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
                  <a href={org.website_url!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-orange-600 px-4 py-2 text-sm font-bold rounded-full hover:bg-orange-700 transition-colors">
                    Visit Full Website <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <ShareButton title={org.name} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-medium rounded-full hover:bg-white/25 transition-colors text-white" />
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

        {/* Photo Gallery with Lightbox */}
        {siteContent.images?.gallery && siteContent.images.gallery.length > 0 && (
          <SiteGallery images={siteContent.images.gallery} />
        )}

        {/* On Country Videos */}
        {videos && videos.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-black mb-3 text-center flex items-center justify-center gap-3">
              <Play className="w-7 h-7 text-orange-600" /> On Country
            </h2>
            <p className="text-center text-[#8b7355] mb-10 max-w-2xl mx-auto">Video from Atnarpa Station and on-country experiences — see the land, the work, and the community in action.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.filter((v: any) => v.is_featured).map((video: any) => (
                <div key={video.id} className="rounded-lg overflow-hidden border-2 border-[#43302b]/10 hover:border-orange-300 transition-colors">
                  <video
                    controls
                    preload="metadata"
                    poster={video.thumbnail_url}
                    className="w-full aspect-video bg-black"
                  >
                    <source src={video.video_url} type="video/mp4" />
                  </video>
                  <div className="p-4 bg-[#fdf8f6]">
                    <h3 className="font-bold text-[#43302b]">{video.title}</h3>
                    {video.description && <p className="text-sm text-[#8b7355] mt-1 line-clamp-2">{video.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            {videos.filter((v: any) => !v.is_featured).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {videos.filter((v: any) => !v.is_featured).map((video: any) => (
                  <div key={video.id} className="rounded-lg overflow-hidden border border-[#43302b]/10 hover:border-orange-300 transition-colors">
                    <video
                      controls
                      preload="metadata"
                      poster={video.thumbnail_url}
                      className="w-full aspect-video bg-black"
                    >
                      <source src={video.video_url} type="video/mp4" />
                    </video>
                    <div className="p-2">
                      <p className="text-xs font-medium text-[#43302b] truncate">{video.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Community Voices — from ALMA stories */}
        {communityVoices && communityVoices.length > 0 && (
          <section className="bg-[#0A0A0A] text-white">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <div className="text-center mb-12">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {communityVoices.length} voices on the record
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  In Their Own Words
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Real stories from real young people. Not case studies. Not statistics. Their words, their experiences, their vision for change.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityVoices.filter((v: any) => v.title !== 'Mounty Yarns: In Their Own Words').slice(0, 9).map((voice: any) => {
                  const extractQuote = (text: string) => {
                    if (!text) return null;
                    const match = text.match(/"([^"]{30,200})"/);
                    return match ? match[1] : null;
                  };
                  const quote = extractQuote(voice.full_story || '') || extractQuote(voice.summary || '');
                  const name = voice.title?.split(' - ')[0] || voice.title;
                  return (
                    <div key={voice.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                      <Quote className="w-5 h-5 text-white/30 mb-3" />
                      <p className="text-white/80 text-sm leading-relaxed line-clamp-4 mb-4">
                        {quote ? `"${quote}"` : voice.summary}
                      </p>
                      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                        <div className="w-8 h-8 rounded-full bg-[#059669]/30 flex items-center justify-center text-xs font-bold text-[#059669]">
                          {name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{name}</p>
                          <p className="text-xs text-white/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Community Voice</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Documentary callout */}
              {communityVoices.find((v: any) => v.title === 'Mounty Yarns: In Their Own Words') && (
                <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <Film className="w-8 h-8 text-white/40 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">In Their Own Words — The Documentary</h3>
                  <p className="text-white/60 max-w-xl mx-auto mb-4 text-sm">
                    A 24-minute documentary made by young people, watched by 100,000+ people. The stories above come from the young people who made it.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Funding Reality — tracked funding vs system cost */}
        {fundingRecords && fundingRecords.length > 0 && isBasecamp && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3">Follow the Money</h2>
              <p className="text-[#8b7355] max-w-2xl mx-auto">
                Every dollar tracked. Full transparency on who funds {org.name} and how it compares to the system.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Funding sources */}
              <div className="bg-[#fdf8f6] border-2 border-[#43302b]/10 rounded-xl p-6">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#059669]" /> Tracked Funding
                </h3>
                <div className="space-y-3">
                  {fundingRecords.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#43302b]/5 last:border-0">
                      <div>
                        <p className="font-semibold text-sm">{f.program_name || f.source}</p>
                        <p className="text-xs text-[#8b7355]">{f.financial_year} &middot; {f.funding_type}</p>
                      </div>
                      <p className="font-black text-[#059669]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        ${(Number(f.amount_dollars) / 1000).toFixed(0)}K
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t-2 border-[#43302b]/10 flex justify-between">
                  <p className="font-black">Total Tracked</p>
                  <p className="font-black text-[#059669] text-xl" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    ${(fundingRecords.reduce((sum: number, f: any) => sum + Number(f.amount_dollars || 0), 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
              {/* The contrast */}
              <div className="space-y-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <h3 className="font-black text-red-800 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> The System Cost
                  </h3>
                  <p className="text-4xl font-black text-red-700 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$1.33M</p>
                  <p className="text-sm text-red-700/70">Average cost per young person per year in detention (ROGS 2024-25)</p>
                </div>
                <div className="bg-[#059669]/10 border-2 border-[#059669]/30 rounded-xl p-6">
                  <h3 className="font-black text-[#059669] mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5" /> Community Cost
                  </h3>
                  <p className="text-4xl font-black text-[#059669] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$3.5–8K</p>
                  <p className="text-sm text-[#059669]/70">Per young person across {org.name}&apos;s programs</p>
                </div>
                <div className="bg-[#0A0A0A] text-white rounded-xl p-6">
                  <h3 className="font-black text-white mb-2 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" /> NSW Reoffending Grants to ACCOs
                  </h3>
                  <p className="text-4xl font-black text-[#DC2626] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$0</p>
                  <p className="text-sm text-white/60">Of $9.9M &ldquo;Breaking the Cycle&rdquo; grants went to Aboriginal community-controlled orgs</p>
                </div>
              </div>
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

        {/* Good News Stories */}
        {partnerStories && partnerStories.length > 0 && (
          <section className="bg-[#fdf8f6] border-y border-orange-100">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <h2 className="text-3xl font-black mb-3 text-center flex items-center justify-center gap-3">
                <Heart className="w-7 h-7 text-orange-600" /> Good News Stories
              </h2>
              <p className="text-center text-[#8b7355] mb-10 max-w-2xl mx-auto">Celebrating community strength through real stories of connection, healing, and empowerment.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partnerStories.filter((s: any) => s.is_featured).map((story: any) => (
                  <div key={story.id} className="bg-white border-2 border-[#43302b]/10 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {story.thumbnail_url && (
                      <img src={story.thumbnail_url} alt={story.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2 text-[#43302b]">{story.title}</h3>
                      {story.excerpt && <p className="text-sm text-[#8b7355] leading-relaxed line-clamp-3">{story.excerpt}</p>}
                      {story.story_type && (
                        <span className="inline-block mt-3 px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
                          {story.story_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
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

        {/* Social Enterprise Services */}
        {siteContent.socialEnterprise && (
          <section className="bg-[#F5F0E8] border-y border-[#0A0A0A]/10">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <div className="text-center mb-10">
                <p className="text-xs uppercase tracking-[0.3em] text-[#0A0A0A]/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Consulting &amp; Training
                </p>
                <h2 className="text-3xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>What We Can Build With You</h2>
                <p className="text-[#0A0A0A]/60 max-w-2xl mx-auto">
                  Five years of building from nothing taught us something replicable. We help other communities, organisations, and governments set up what we&apos;ve built.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {siteContent.socialEnterprise.services.map((service: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6 hover:border-[#059669]/40 transition-colors">
                    <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{service.title}</h3>
                    <p className="text-sm text-[#0A0A0A]/60">{service.description}</p>
                  </div>
                ))}
              </div>
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
                {ctaEmail && (
                  <a href={`mailto:${ctaEmail}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-700 font-bold rounded-lg hover:bg-orange-50 transition-colors">
                    <Mail className="w-5 h-5" /> {ctaEmail}
                  </a>
                )}
                {ctaPhone && (
                  <a href={`tel:${ctaPhone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-colors border border-white/30">
                    <Phone className="w-5 h-5" /> {ctaPhone}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Funding Transparency — Basecamps only */}
        {isBasecamp && org.state && (
          <FundingTransparency orgId={org.id} orgName={org.name} state={org.state} />
        )}

        {/* Peer Validations — Basecamps only */}
        {isBasecamp && <PeerValidations orgId={org.id} />}

        {/* Newsletter */}
        <section className="bg-[#fdf8f6] border-y border-orange-100">
          <div className="max-w-2xl mx-auto px-6 py-12">
            <NewsletterSignup
              variant="stacked"
              title={`Stay connected with ${org.name}`}
              description="Get updates on programs, events, and community stories."
              buttonText="Subscribe"
              subscriptionType="general"
            />
          </div>
        </section>

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
                  <a href={org.website_url!} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white flex items-center gap-1.5">
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
              <a href={org.website_url!} target="_blank" rel="noopener noreferrer"
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
