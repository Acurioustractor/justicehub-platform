'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Building2,
  Briefcase,
  BookOpen,
  Database,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  FileText,
  Image,
  Globe,
  Scale,
} from 'lucide-react';

interface EntityHealth {
  name: string;
  table: string;
  icon: React.ReactNode;
  total: number;
  complete: number;
  hasRelationships: number;
  featured: number;
  issues: string[];
  route: string;
  adminRoute?: string;
}

const supabase = createClient();

export default function ContentHealthPage() {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<EntityHealth[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function checkHealth() {
    setLoading(true);

    const results: EntityHealth[] = [];

    // 1. ALMA Interventions
    const { data: interventions, count: intCount } = await supabase
      .from('alma_interventions')
      .select('id, name, description, type, evidence_level, consent_level, metadata', { count: 'exact' });

    const intComplete = interventions?.filter(i =>
      i.description && i.description.length > 50 &&
      i.type && i.evidence_level && i.metadata?.state
    ).length || 0;

    results.push({
      name: 'ALMA Interventions',
      table: 'alma_interventions',
      icon: <Database className="w-5 h-5" />,
      total: intCount || 0,
      complete: intComplete,
      hasRelationships: 0, // TODO: Check junction table
      featured: 0,
      issues: [
        ...(interventions?.filter(i => !i.description || i.description.length < 50).length
          ? [`${interventions.filter(i => !i.description || i.description.length < 50).length} missing descriptions`]
          : []),
        ...(interventions?.filter(i => !i.metadata?.state).length
          ? [`${interventions.filter(i => !i.metadata?.state).length} missing state`]
          : []),
      ],
      route: '/intelligence/interventions',
      adminRoute: '/admin/programs',
    });

    // 2. ALMA Evidence
    const { data: evidence, count: evCount } = await supabase
      .from('alma_evidence')
      .select('id, title, findings, evidence_type, author', { count: 'exact' });

    const evComplete = evidence?.filter(e =>
      e.title && !e.title.includes('Untitled') &&
      e.findings && e.evidence_type
    ).length || 0;

    const untitledEvidence = evidence?.filter(e =>
      !e.title || e.title.includes('Untitled')
    ).length || 0;

    results.push({
      name: 'ALMA Evidence',
      table: 'alma_evidence',
      icon: <BookOpen className="w-5 h-5" />,
      total: evCount || 0,
      complete: evComplete,
      hasRelationships: 0,
      featured: 0,
      issues: untitledEvidence > 0 ? [`${untitledEvidence} items have "Untitled" title`] : [],
      route: '/intelligence/evidence',
    });

    // 3. Organizations
    const { data: orgs, count: orgCount } = await supabase
      .from('organizations')
      .select('id, name, description, type, state, website, logo_url', { count: 'exact' });

    const orgComplete = orgs?.filter(o =>
      o.description && o.description.length > 20 &&
      o.type && o.state
    ).length || 0;

    results.push({
      name: 'Organizations',
      table: 'organizations',
      icon: <Building2 className="w-5 h-5" />,
      total: orgCount || 0,
      complete: orgComplete,
      hasRelationships: 0,
      featured: 0,
      issues: [
        ...(orgs?.filter(o => !o.description).length
          ? [`${orgs.filter(o => !o.description).length} missing descriptions`]
          : []),
        ...(orgs?.filter(o => !o.logo_url).length
          ? [`${orgs.filter(o => !o.logo_url).length} missing logos`]
          : []),
      ],
      route: '/organizations',
      adminRoute: '/admin/organizations',
    });

    // 4. Community Programs
    const { data: programs, count: progCount } = await supabase
      .from('community_programs')
      .select('id, name, description, organization, impact_summary, is_featured', { count: 'exact' });

    const progComplete = programs?.filter(p =>
      p.description && p.description.length > 50 &&
      p.organization && p.impact_summary
    ).length || 0;

    const progFeatured = programs?.filter(p => p.is_featured).length || 0;

    results.push({
      name: 'Community Programs',
      table: 'community_programs',
      icon: <Briefcase className="w-5 h-5" />,
      total: progCount || 0,
      complete: progComplete,
      hasRelationships: 0,
      featured: progFeatured,
      issues: [
        ...(programs?.filter(p => !p.impact_summary).length
          ? [`${programs.filter(p => !p.impact_summary).length} missing impact summary`]
          : []),
      ],
      route: '/community-programs',
      adminRoute: '/admin/programs',
    });

    // 5. Public Profiles
    const { data: profiles, count: profCount } = await supabase
      .from('public_profiles')
      .select('id, full_name, bio, photo_url, is_featured, is_public', { count: 'exact' });

    const profComplete = profiles?.filter(p =>
      p.bio && p.bio.length > 30 && p.photo_url
    ).length || 0;

    const profFeatured = profiles?.filter(p => p.is_featured).length || 0;
    const profPublic = profiles?.filter(p => p.is_public).length || 0;

    results.push({
      name: 'People Profiles',
      table: 'public_profiles',
      icon: <Users className="w-5 h-5" />,
      total: profCount || 0,
      complete: profComplete,
      hasRelationships: 0,
      featured: profFeatured,
      issues: [
        ...(profiles?.filter(p => !p.bio || p.bio.length < 30).length
          ? [`${profiles.filter(p => !p.bio || p.bio.length < 30).length} missing/short bios`]
          : []),
        ...(profiles?.filter(p => !p.photo_url).length
          ? [`${profiles.filter(p => !p.photo_url).length} missing photos`]
          : []),
        profPublic === 0 ? ['No public profiles'] : [],
      ].flat(),
      route: '/people',
      adminRoute: '/admin/profiles',
    });

    // 6. Services
    const { data: services, count: svcCount } = await supabase
      .from('services')
      .select('id, name, description, categories, location', { count: 'exact' });

    const svcComplete = services?.filter(s =>
      s.description && s.categories?.length > 0
    ).length || 0;

    results.push({
      name: 'Services',
      table: 'services',
      icon: <TrendingUp className="w-5 h-5" />,
      total: svcCount || 0,
      complete: svcComplete,
      hasRelationships: 0,
      featured: 0,
      issues: [],
      route: '/services',
      adminRoute: '/admin/services',
    });

    // 7. Blog Posts
    const { data: posts, count: postCount } = await supabase
      .from('blog_posts')
      .select('id, title, status, published_at, featured_image_url', { count: 'exact' });

    const postPublished = posts?.filter(p => p.status === 'published').length || 0;
    const postWithImage = posts?.filter(p => p.featured_image_url).length || 0;

    results.push({
      name: 'Blog Posts',
      table: 'blog_posts',
      icon: <FileText className="w-5 h-5" />,
      total: postCount || 0,
      complete: postPublished,
      hasRelationships: 0,
      featured: postWithImage,
      issues: [
        ...(posts?.filter(p => p.status !== 'published').length
          ? [`${posts.filter(p => p.status !== 'published').length} unpublished drafts`]
          : []),
      ],
      route: '/blog',
      adminRoute: '/admin/blog',
    });

    // 8. International Programs
    const { data: intlProg, count: intlCount } = await supabase
      .from('international_programs')
      .select('id, name, country, evidence_strength, status', { count: 'exact' });

    const intlPublished = intlProg?.filter(p => p.status === 'published').length || 0;

    results.push({
      name: 'International Programs',
      table: 'international_programs',
      icon: <Globe className="w-5 h-5" />,
      total: intlCount || 0,
      complete: intlPublished,
      hasRelationships: 0,
      featured: 0,
      issues: [],
      route: '/youth-justice-report/international',
    });

    // 9. Historical Inquiries
    const { data: inquiries, count: inqCount } = await supabase
      .from('historical_inquiries')
      .select('id, title, jurisdiction, implementation_status', { count: 'exact' });

    results.push({
      name: 'Historical Inquiries',
      table: 'historical_inquiries',
      icon: <Scale className="w-5 h-5" />,
      total: inqCount || 0,
      complete: inqCount || 0,
      hasRelationships: 0,
      featured: 0,
      issues: (inqCount || 0) === 0 ? ['Table is empty - using sample data fallback'] : [],
      route: '/youth-justice-report/inquiries',
    });

    setEntities(results);
    setLastChecked(new Date());
    setLoading(false);
  }

  useEffect(() => {
    checkHealth();
  }, []);

  const getHealthColor = (complete: number, total: number) => {
    if (total === 0) return 'text-gray-400';
    const pct = (complete / total) * 100;
    if (pct >= 80) return 'text-green-600';
    if (pct >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (complete: number, total: number) => {
    if (total === 0) return <XCircle className="w-5 h-5 text-gray-400" />;
    const pct = (complete / total) * 100;
    if (pct >= 80) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (pct >= 50) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const overallScore = entities.length > 0
    ? Math.round(entities.reduce((sum, e) => sum + (e.total > 0 ? (e.complete / e.total) * 100 : 0), 0) / entities.length)
    : 0;

  return (
    <div className="min-h-screen bg-sand-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Content Health Dashboard</h1>
            <p className="text-earth-600">
              Monitor data completeness across JusticeHub entities
            </p>
          </div>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Overall Score */}
        <div className="border-2 border-black bg-white p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Overall Content Health</h2>
              <p className="text-sm text-earth-600">
                Based on completeness of required fields
              </p>
            </div>
            <div className={`text-5xl font-black ${
              overallScore >= 80 ? 'text-green-600' :
              overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {overallScore}%
            </div>
          </div>
          {lastChecked && (
            <p className="text-xs text-earth-500 mt-4">
              Last checked: {lastChecked.toLocaleString()}
            </p>
          )}
        </div>

        {/* Entity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.map((entity) => (
            <div
              key={entity.table}
              className="border-2 border-black bg-white p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sand-100 border border-black">
                    {entity.icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{entity.name}</h3>
                    <p className="text-xs text-earth-500">{entity.table}</p>
                  </div>
                </div>
                {getHealthIcon(entity.complete, entity.total)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold">{entity.total}</div>
                  <div className="text-xs text-earth-600">Total</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getHealthColor(entity.complete, entity.total)}`}>
                    {entity.complete}
                  </div>
                  <div className="text-xs text-earth-600">Complete</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-200 mb-4">
                <div
                  className={`h-full ${
                    entity.total === 0 ? 'bg-gray-300' :
                    (entity.complete / entity.total) >= 0.8 ? 'bg-green-500' :
                    (entity.complete / entity.total) >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: entity.total > 0 ? `${(entity.complete / entity.total) * 100}%` : '0%' }}
                />
              </div>

              {/* Issues */}
              {entity.issues.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-earth-600 mb-2">Issues:</div>
                  <ul className="text-xs text-red-600 space-y-1">
                    {entity.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-2 text-xs">
                <Link
                  href={entity.route}
                  className="flex items-center gap-1 text-ochre-600 hover:text-ochre-800"
                >
                  View <ExternalLink className="w-3 h-3" />
                </Link>
                {entity.adminRoute && (
                  <Link
                    href={entity.adminRoute}
                    className="flex items-center gap-1 text-earth-600 hover:text-black"
                  >
                    Admin <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 border-2 border-black bg-white p-6">
          <h2 className="font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/profiles"
              className="p-4 border-2 border-black hover:bg-sand-50 text-center"
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Add People</div>
              <div className="text-xs text-earth-600">Create new profiles</div>
            </Link>
            <Link
              href="/admin/organizations"
              className="p-4 border-2 border-black hover:bg-sand-50 text-center"
            >
              <Building2 className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Add Organizations</div>
              <div className="text-xs text-earth-600">Create new orgs</div>
            </Link>
            <Link
              href="/admin/blog/new"
              className="p-4 border-2 border-black hover:bg-sand-50 text-center"
            >
              <FileText className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Write Blog Post</div>
              <div className="text-xs text-earth-600">Create new content</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
