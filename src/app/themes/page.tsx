import Link from 'next/link';
import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/ui/navigation';
import { 
  Brain, 
  Heart, 
  Users, 
  Globe, 
  ArrowRight,
  Accessibility,
  Stethoscope,
  Home,
  GraduationCap,
  TreePine
} from 'lucide-react';

export const metadata = {
  title: 'Thematic Areas | JusticeHub',
  description: 'Explore youth justice through specific lenses: disability, health, marginalised groups, education, housing, and more.',
};

interface Theme {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  stats: {
    label: string;
    value: string;
  }[];
  featured: boolean;
  color: string;
  articles: number;
  services: number;
}

const themes: Theme[] = [
  {
    id: 'disability',
    title: 'Disability & Justice',
    subtitle: 'The Hidden Epidemic',
    description: '60-80% of young people in custody have cognitive disability, mental health conditions, or neurodevelopmental differences. Most arrive undiagnosed.',
    icon: <Accessibility className="w-8 h-8" />,
    stats: [
      { label: 'Youth in custody with disability', value: '60-80%' },
      { label: 'With undiagnosed FASD', value: '~20%' },
      { label: 'Indigenous youth with cognitive impairment', value: '4-5x' },
    ],
    featured: true,
    color: 'ochre',
    articles: 1,
    services: 0,
  },
  {
    id: 'health',
    title: 'Health & Wellbeing',
    subtitle: 'Mental Health Crisis',
    description: 'Physical health, mental health, and substance use intersect with justice involvement. Early health intervention can prevent justice contact.',
    icon: <Stethoscope className="w-8 h-8" />,
    stats: [
      { label: 'With mental health conditions', value: '70-88%' },
      { label: 'Substance use history', value: '65%' },
      { label: 'Trauma/neglect history', value: '71%' },
    ],
    featured: false,
    color: 'eucalyptus',
    articles: 0,
    services: 0,
  },
  {
    id: 'marginalised',
    title: 'Marginalised Groups',
    subtitle: 'Over-Representation',
    description: 'First Nations youth, LGBTQIA+ young people, and those from refugee backgrounds face systemic barriers and disproportionate justice involvement.',
    icon: <Users className="w-8 h-8" />,
    stats: [
      { label: 'Indigenous youth detention rate', value: '23x' },
      { label: 'From out-of-home care', value: 'High%' },
      { label: 'Homeless before custody', value: '13%' },
    ],
    featured: false,
    color: 'ochre',
    articles: 0,
    services: 0,
  },
  {
    id: 'housing',
    title: 'Housing Stability',
    subtitle: 'No Home, No Hope',
    description: 'Housing instability is both a pathway into justice involvement and a barrier to successful transition out. Stable housing is foundational.',
    icon: <Home className="w-8 h-8" />,
    stats: [
      { label: 'Homeless before custody', value: '13%' },
      { label: 'In insecure housing', value: 'Higher%' },
      { label: 'Housing as success factor', value: 'Critical' },
    ],
    featured: false,
    color: 'sand',
    articles: 1,
    services: 0,
  },
  {
    id: 'education',
    title: 'Education & Employment',
    subtitle: 'The School-to-Justice Pipeline',
    description: 'School exclusion, disengagement, and lack of employment pathways significantly increase risk of justice involvement.',
    icon: <GraduationCap className="w-8 h-8" />,
    stats: [
      { label: 'Previously suspended/expelled', value: '50%+' },
      { label: 'Disengaged from education', value: 'High%' },
      { label: 'Unemployed at arrest', value: '50%' },
    ],
    featured: false,
    color: 'eucalyptus',
    articles: 0,
    services: 0,
  },
  {
    id: 'culture',
    title: 'Culture & Healing',
    subtitle: 'Strength Through Connection',
    description: 'Cultural connection, particularly for First Nations youth, is protective. Community-led cultural programs show the strongest outcomes.',
    icon: <TreePine className="w-8 h-8" />,
    stats: [
      { label: 'Success rate (cultural programs)', value: '92%' },
      { label: 'Community authority weight', value: '30%' },
      { label: 'Indigenous-led programs', value: 'Growing' },
    ],
    featured: false,
    color: 'ochre',
    articles: 0,
    services: 0,
  },
];

export default function ThemesPage() {
  const featuredTheme = themes.find(t => t.featured);
  const otherThemes = themes.filter(t => !t.featured);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main id="main-content" className="header-offset">
      {/* Hero */}
      <section className="bg-gradient-to-br from-earth-900 to-earth-800 text-white py-20 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="inline-block bg-white/10 backdrop-blur text-white text-xs font-bold uppercase tracking-wider px-3 py-1 mb-6">
            Cross-Cutting Issues
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Thematic Areas
          </h1>

          <p className="text-xl text-white/80 max-w-3xl mb-8">
            Youth justice doesn't exist in isolation. Explore the interconnected issues 
            that shape young people's pathways—through the lens of those with lived experience.
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="bg-white/10 px-3 py-1 rounded-full">
              {themes.length} themes
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full">
              Evidence-based
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full">
              Lived experience led
            </span>
          </div>
        </div>
      </section>

      {/* Featured Theme */}
      {featuredTheme && (
        <section className="py-16 bg-ochre-50 border-b-2 border-black">
          <div className="container-justice max-w-5xl">
            <div className="inline-flex items-center gap-2 bg-ochre-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 mb-6">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Featured Theme
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-3 p-4 bg-white border-2 border-black rounded-lg mb-6">
                  {featuredTheme.icon}
                  <span className="font-bold">{featuredTheme.subtitle}</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black mb-4">
                  {featuredTheme.title}
                </h2>

                <p className="text-lg text-earth-700 mb-8">
                  {featuredTheme.description}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {featuredTheme.stats.map((stat, i) => (
                    <div key={i} className="bg-white border-2 border-black p-4">
                      <div className="text-2xl font-bold text-ochre-600">{stat.value}</div>
                      <div className="text-xs text-earth-600 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/themes/${featuredTheme.id}`}
                  className="inline-flex items-center gap-2 bg-black text-white font-bold px-6 py-3 hover:bg-ochre-600 transition-colors"
                >
                  Explore {featuredTheme.title}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-ochre-200 to-ochre-300 border-2 border-black rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <Accessibility className="w-32 h-32 text-ochre-700 mx-auto mb-6" />
                    <blockquote className="text-ochre-900 italic">
                      "The young people at the centre of this story have names, families, and potential. 
                      What they need is recognition, support, and pathways away from the justice system."
                    </blockquote>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-eucalyptus-200 border-2 border-black rounded-lg -z-10" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-sand-200 border-2 border-black rounded-lg -z-10" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Themes Grid */}
      <section className="py-16">
        <div className="container-justice max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">Explore All Themes</h2>
          <p className="text-earth-600 mb-12 max-w-2xl">
            Each thematic area represents a critical intersection with youth justice. 
            Click through to find services, stories, research, and resources.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherThemes.map((theme) => {
              // Only disability theme has a page built currently
              const hasPage = theme.id === 'disability';
              const CardWrapper = hasPage ? Link : 'div';
              
              return (
                <CardWrapper
                  key={theme.id}
                  href={hasPage ? `/themes/${theme.id}` : undefined}
                  className={`group border-2 border-black p-6 transition-colors relative overflow-hidden ${
                    hasPage ? 'hover:bg-earth-50 cursor-pointer' : 'bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  {/* Color accent */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-${theme.color}-500`} />

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 bg-${theme.color}-100 border border-black`}>
                      {theme.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wider text-earth-500 mb-1">
                        {theme.subtitle}
                      </div>
                      <h3 className={`text-xl font-bold transition-colors ${
                        hasPage ? 'group-hover:text-ochre-600' : ''
                      }`}>
                        {theme.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-earth-600 mb-4 line-clamp-2">
                    {theme.description}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-3">
                      <span className="bg-earth-100 px-2 py-1">
                        {theme.articles} articles
                      </span>
                      <span className="bg-earth-100 px-2 py-1">
                        {theme.services} services
                      </span>
                    </div>
                    {hasPage ? (
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <span className="text-gray-400 italic">Coming soon</span>
                    )}
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-Cutting Insight */}
      <section className="py-16 bg-sand-50 border-t-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="bg-white border-2 border-black p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">
              These Themes Are Connected
            </h2>

            <p className="text-lg text-earth-700 mb-8">
              A young person entering the justice system rarely faces just one of these challenges. 
              They may have an undiagnosed cognitive disability, experienced trauma, be homeless, 
              disconnected from culture, and excluded from school—all at once.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-l-4 border-ochre-500 pl-6">
                <h3 className="text-xl font-bold mb-2">The Reality</h3>
                <p className="text-earth-600">
                  Most young people in detention have multiple, overlapping vulnerabilities. 
                  Single-issue responses fail because they don't reflect lived experience.
                </p>
              </div>

              <div className="border-l-4 border-eucalyptus-500 pl-6">
                <h3 className="text-xl font-bold mb-2">The Response</h3>
                <p className="text-earth-600">
                  Effective programs address multiple needs simultaneously—mental health, 
                  housing, education, cultural connection—wrapped in sustained relationships.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t-2 border-earth-200">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 font-bold text-ochre-600 hover:text-ochre-800"
              >
                Find services that understand complexity
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container-justice max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Know a Service That Should Be Here?
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            We're building the most comprehensive directory of services for young people 
            at the intersection of disability, marginalisation, and justice involvement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/community-programs/add"
              className="inline-flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3 hover:bg-ochre-100 transition-colors"
            >
              Add a Program
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-6 py-3 hover:bg-white/10 transition-colors"
            >
              Suggest a Service
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
