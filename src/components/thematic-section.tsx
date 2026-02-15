'use client';

import Link from 'next/link';
import { 
  Accessibility,
  Stethoscope,
  Users,
  Home,
  GraduationCap,
  TreePine,
  ArrowRight
} from 'lucide-react';

interface ThematicSectionProps {
  variant?: 'full' | 'compact' | 'banner';
  featuredTheme?: string;
  showStats?: boolean;
}

const themes = [
  {
    id: 'disability',
    title: 'Disability',
    icon: Accessibility,
    color: 'ochre',
    stat: '60-80%',
    description: 'of youth in custody have disability',
  },
  {
    id: 'health',
    title: 'Health',
    icon: Stethoscope,
    color: 'eucalyptus',
    stat: '70-88%',
    description: 'have mental health conditions',
  },
  {
    id: 'marginalised',
    title: 'Marginalised Groups',
    icon: Users,
    color: 'ochre',
    stat: '23x',
    description: 'Indigenous over-representation',
  },
  {
    id: 'housing',
    title: 'Housing',
    icon: Home,
    color: 'sand',
    stat: '13%',
    description: 'homeless before custody',
  },
  {
    id: 'education',
    title: 'Education',
    icon: GraduationCap,
    color: 'eucalyptus',
    stat: '50%+',
    description: 'suspended/expelled from school',
  },
  {
    id: 'culture',
    title: 'Culture',
    icon: TreePine,
    color: 'ochre',
    stat: '92%',
    description: 'cultural program success rate',
  },
];

export function ThematicSection({ 
  variant = 'compact', 
  featuredTheme = 'disability',
  showStats = true 
}: ThematicSectionProps) {
  const featured = themes.find(t => t.id === featuredTheme) || themes[0];
  const otherThemes = themes.filter(t => t.id !== featuredTheme).slice(0, 3);

  if (variant === 'banner') {
    return (
      <div className="bg-ochre-50 border-y-2 border-black">
        <div className="container-justice py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ochre-700">
                Explore Themes
              </span>
              <span className="text-earth-400">|</span>
              <div className="flex gap-4 text-sm">
                {themes.slice(0, 4).map(theme => (
                  <Link 
                    key={theme.id}
                    href={`/themes/${theme.id}`}
                    className="text-earth-700 hover:text-ochre-600 transition-colors"
                  >
                    {theme.title}
                  </Link>
                ))}
                <Link 
                  href="/themes"
                  className="text-ochre-600 font-bold hover:text-ochre-800"
                >
                  All →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <section className="py-12 bg-white border-t-2 border-black">
        <div className="container-justice">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Explore by Theme</h2>
            <Link 
              href="/themes" 
              className="text-sm font-bold text-ochre-600 hover:text-ochre-800 inline-flex items-center gap-1"
            >
              View All Themes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {themes.map(theme => {
              const Icon = theme.icon;
              return (
                <Link
                  key={theme.id}
                  href={`/themes/${theme.id}`}
                  className="group border-2 border-black p-4 hover:bg-earth-50 transition-colors text-center"
                >
                  <Icon className={`w-8 h-8 mx-auto mb-3 text-${theme.color}-600`} />
                  <h3 className="font-bold text-sm mb-1 group-hover:text-ochre-600 transition-colors">
                    {theme.title}
                  </h3>
                  {showStats && (
                    <>
                      <div className={`text-2xl font-black text-${theme.color}-600`}>
                        {theme.stat}
                      </div>
                      <p className="text-xs text-earth-500 leading-tight">
                        {theme.description}
                      </p>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Full variant - featured style
  return (
    <section className="py-16 bg-sand-50 border-t-2 border-black">
      <div className="container-justice max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Thematic Areas</h2>
            <p className="text-earth-600">
              Youth justice doesn't exist in isolation. Explore interconnected issues.
            </p>
          </div>
          <Link 
            href="/themes" 
            className="hidden md:inline-flex items-center gap-2 font-bold text-ochre-600 hover:text-ochre-800"
          >
            Explore All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Featured Theme */}
        <div className="bg-white border-2 border-black p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 bg-${featured.color}-100 text-${featured.color}-800 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-4`}>
                <featured.icon className="w-4 h-4" />
                Featured Theme
              </div>
              <h3 className="text-3xl font-bold mb-3">{featured.title} & Justice</h3>
              <p className="text-earth-600 mb-6">
                {featured.description}. Explore services, stories, and research at the 
                intersection of {featured.title.toLowerCase()} and youth justice.
              </p>
              <Link
                href={`/themes/${featured.id}`}
                className="inline-flex items-center gap-2 bg-black text-white font-bold px-6 py-3 hover:bg-ochre-600 transition-colors"
              >
                Explore {featured.title}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className={`bg-${featured.color}-100 border-2 border-black p-8 text-center`}>
              <featured.icon className={`w-24 h-24 mx-auto mb-4 text-${featured.color}-700`} />
              <div className={`text-6xl font-black text-${featured.color}-600 mb-2`}>
                {featured.stat}
              </div>
              <p className="text-earth-700">{featured.description}</p>
            </div>
          </div>
        </div>

        {/* Other Themes */}
        <div className="grid md:grid-cols-3 gap-6">
          {otherThemes.map(theme => {
            const Icon = theme.icon;
            return (
              <Link
                key={theme.id}
                href={`/themes/${theme.id}`}
                className="group border-2 border-black p-6 hover:bg-white transition-colors bg-white/50"
              >
                <Icon className={`w-10 h-10 mb-4 text-${theme.color}-600`} />
                <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                  {theme.title}
                </h3>
                <div className={`text-3xl font-black text-${theme.color}-600 mb-1`}>
                  {theme.stat}
                </div>
                <p className="text-sm text-earth-600">{theme.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link 
            href="/themes" 
            className="inline-flex items-center gap-2 font-bold text-ochre-600"
          >
            View All Themes
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Export individual theme card for use in other components
export function ThemeCard({ 
  themeId, 
  variant = 'default' 
}: { 
  themeId: string; 
  variant?: 'default' | 'compact' | 'featured';
}) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return null;

  const Icon = theme.icon;

  if (variant === 'compact') {
    return (
      <Link
        href={`/themes/${theme.id}`}
        className="flex items-center gap-3 p-3 border-2 border-black hover:bg-earth-50 transition-colors"
      >
        <Icon className={`w-5 h-5 text-${theme.color}-600`} />
        <span className="font-bold text-sm">{theme.title}</span>
        <ArrowRight className="w-4 h-4 ml-auto text-earth-400" />
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/themes/${theme.id}`}
        className={`block bg-${theme.color}-50 border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow`}
      >
        <Icon className={`w-12 h-12 mb-4 text-${theme.color}-700`} />
        <h3 className="text-2xl font-bold mb-2">{theme.title}</h3>
        <div className={`text-4xl font-black text-${theme.color}-600 mb-2`}>
          {theme.stat}
        </div>
        <p className="text-earth-600">{theme.description}</p>
      </Link>
    );
  }

  return (
    <Link
      href={`/themes/${theme.id}`}
      className="block border-2 border-black p-6 hover:bg-earth-50 transition-colors"
    >
      <Icon className={`w-8 h-8 mb-3 text-${theme.color}-600`} />
      <h3 className="text-lg font-bold mb-1">{theme.title}</h3>
      <p className="text-sm text-earth-500">{theme.description}</p>
    </Link>
  );
}

// Export themes data for use elsewhere
export { themes };
