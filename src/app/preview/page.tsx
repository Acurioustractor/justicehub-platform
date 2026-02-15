'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Scale,
  Globe,
  Heart,
  MapPin,
  Users,
  ArrowRight,
  Eye,
  Handshake,
  Building2,
  FileText,
  Calendar
} from 'lucide-react';

interface Preview {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  features: string[];
  status: 'live' | 'coming-soon';
}

const previews: Preview[] = [
  {
    id: 'justice-project',
    title: 'The Justice Project',
    subtitle: 'Partnership Preview',
    description: 'How JusticeHub integrates with The Justice Project to amplify Aboriginal-led justice initiatives and provide comprehensive support services.',
    href: '/preview/justice-project',
    icon: Handshake,
    color: 'red',
    bgGradient: 'from-red-600 to-rose-700',
    features: ['Integration overview', 'Service mapping', 'Referral pathways'],
    status: 'live'
  },
  {
    id: 'justice-matrix',
    title: 'Justice Matrix',
    subtitle: 'Global Legal Intelligence',
    description: 'Interactive database of global youth justice cases and advocacy campaigns. Track legal precedents, strategic litigation, and movement-building worldwide.',
    href: '/preview/justice-matrix',
    icon: Scale,
    color: 'blue',
    bgGradient: 'from-blue-600 to-indigo-700',
    features: ['Interactive world map', 'Case database', 'Campaign tracker', 'Regional insights'],
    status: 'live'
  },
  {
    id: 'grassroots-activation',
    title: 'Grassroots Activation',
    subtitle: 'Community Infrastructure',
    description: 'How JusticeHub profiles and supports grassroots programs, matches philanthropists with vetted organizations, and creates a regenerative 10-year system for generational justice support.',
    href: '/preview/grassroots-activation',
    icon: Heart,
    color: 'emerald',
    bgGradient: 'from-emerald-600 to-teal-700',
    features: ['4 Founding Basecamps', 'Shared services model', 'Funder discovery', '10-year vision'],
    status: 'live'
  }
];

const colorClasses: Record<string, { text: string; bg: string; border: string; hover: string }> = {
  red: { text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', hover: 'hover:border-red-400' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', hover: 'hover:border-blue-400' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', hover: 'hover:border-emerald-400' },
};

export default function PreviewIndexPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('preview-index-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'justice2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('preview-index-auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Eye className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-white">JusticeHub Previews</h1>
            <p className="text-gray-400">Explore upcoming features and partnerships</p>
            <p className="text-gray-500 text-sm mt-2">Password protected access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 focus:border-white/50 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-white text-gray-900 py-3 px-4 font-bold hover:bg-gray-100 transition-colors rounded-lg"
            >
              Access Previews
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-slate-900 text-white py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-black">
                <span className="text-white">JUSTICE</span>
                <span className="text-red-500">HUB</span>
              </Link>
              <span className="text-gray-600">|</span>
              <span className="text-gray-300">Preview Gallery</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm font-medium">
                {previews.filter(p => p.status === 'live').length} Previews Available
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-slate-800 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Preview Gallery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Explore What&apos;s Coming
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Preview upcoming features, partnerships, and initiatives before they launch.
            Your feedback shapes what we build.
          </p>
        </div>
      </section>

      {/* Preview Cards */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {previews.map((preview) => {
            const IconComponent = preview.icon;
            const colors = colorClasses[preview.color] || colorClasses.blue;

            return (
              <Link
                key={preview.id}
                href={preview.href}
                className={`group bg-white rounded-2xl border-2 ${colors.border} ${colors.hover} overflow-hidden transition-all hover:shadow-xl`}
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${preview.bgGradient} p-6 text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {preview.status === 'live' ? (
                      <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded">
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-black/20 text-white/80 text-xs font-medium rounded">
                        COMING SOON
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mt-4">{preview.title}</h2>
                  <p className="text-white/80 text-sm">{preview.subtitle}</p>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {preview.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {preview.features.slice(0, 3).map((feature, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs rounded`}
                      >
                        {feature}
                      </span>
                    ))}
                    {preview.features.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{preview.features.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className={`flex items-center gap-2 ${colors.text} font-medium text-sm group-hover:gap-3 transition-all`}>
                    View Preview
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Section */}
        <section className="mt-16 bg-gray-900 rounded-2xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <Lock className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="font-bold mb-2 text-white">Password Protected</h3>
              <p className="text-sm text-gray-400">
                All previews use the same password for easy access. Share responsibly with stakeholders.
              </p>
            </div>
            <div>
              <FileText className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="font-bold mb-2 text-white">Work in Progress</h3>
              <p className="text-sm text-gray-400">
                These are mockups and prototypes. Features may change before public launch.
              </p>
            </div>
            <div>
              <Users className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-bold mb-2 text-white">Feedback Welcome</h3>
              <p className="text-sm text-gray-400">
                Your input helps shape these features. Contact us with suggestions or concerns.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-white">JusticeHub Preview Gallery</p>
            <p className="text-gray-400 text-sm">
              Building the future of youth justice, together.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Back to JusticeHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
