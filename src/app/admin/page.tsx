import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { Users, BookOpen, Palette, Building2, MapPin, TrendingUp, AlertCircle, CheckCircle2, FileText, Network, Database, Share2 } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Check admin role
  const { data: userData } = await supabase
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (userData?.user_role !== 'admin') {
    redirect('/');
  }

  // Fetch all content counts in parallel
  const [
    { count: profilesCount },
    { count: publicProfilesCount },
    { count: storiesCount },
    { count: artCount },
    { count: programsCount },
    { count: servicesCount },
    { count: storyLinksCount },
    { count: artLinksCount },
    { count: programLinksCount },
    { count: serviceLinksCount },
    { count: organizationsCount },
    { count: orgLinksCount },
    { count: blogPostLinksCount },
    { count: empathyProfilesCount },
    { count: empathyTranscriptsCount },
    { count: clearinghouseServicesCount },
    { count: clearinghouseDocsCount },
  ] = await Promise.all([
    supabase.from('public_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('public_profiles').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('art_innovation').select('*', { count: 'exact', head: true }),
    supabase.from('community_programs').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('profile_appearances').select('*', { count: 'exact', head: true }),
    supabase.from('art_innovation_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('community_programs_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('services_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('organizations_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('public_profiles').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', true),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', true),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('project', 'clearinghouse'),
    supabase.from('clearinghouse_documents').select('*', { count: 'exact', head: true }),
  ]);

  // Calculate connection rates
  const servicesConnectionRate = servicesCount ? Math.round((serviceLinksCount! / servicesCount) * 100) : 0;
  const programsConnectionRate = programsCount ? Math.round((programLinksCount! / programsCount) * 100) : 0;

  // Calculate total auto-linked relationships
  const totalAutoLinks = (orgLinksCount || 0) + (blogPostLinksCount || 0);

  const stats = [
    {
      title: 'People',
      count: profilesCount || 0,
      subtitle: `${publicProfilesCount || 0} public`,
      icon: Users,
      href: '/admin/profiles',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Stories',
      count: storiesCount || 0,
      subtitle: `${storyLinksCount || 0} profile links`,
      icon: BookOpen,
      href: '/admin/stories',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Art & Innovation',
      count: artCount || 0,
      subtitle: `${artLinksCount || 0} profile links`,
      icon: Palette,
      href: '/admin/art-innovation',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
    {
      title: 'Programs',
      count: programsCount || 0,
      subtitle: `${programsConnectionRate}% connected`,
      icon: Building2,
      href: '/admin/programs',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      alert: programsConnectionRate < 50 ? 'Low connection rate' : undefined,
    },
    {
      title: 'Services',
      count: servicesCount || 0,
      subtitle: `${servicesConnectionRate}% connected`,
      icon: MapPin,
      href: '/admin/services',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      alert: servicesConnectionRate < 50 ? 'Low connection rate' : undefined,
    },
    {
      title: 'Organizations',
      count: organizationsCount || 0,
      subtitle: `${orgLinksCount || 0} team members`,
      icon: Building2,
      href: '/admin/organizations',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
    },
    {
      title: 'Auto-Linked',
      count: totalAutoLinks,
      subtitle: `${orgLinksCount || 0} orgs + ${blogPostLinksCount || 0} stories`,
      icon: Network,
      href: '/admin/auto-linking',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Empathy Ledger',
      count: empathyProfilesCount || 0,
      subtitle: `${empathyTranscriptsCount || 0} transcripts synced`,
      icon: Database,
      href: '/admin/empathy-ledger',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      title: 'Clearinghouse',
      count: clearinghouseServicesCount || 0,
      subtitle: `${clearinghouseDocsCount || 0} docs`,
      icon: Share2,
      href: '/admin/clearinghouse',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-black mb-2">Admin Dashboard</h1>
              <p className="text-lg text-gray-600">
                Manage your content and connections across the platform
              </p>
            </div>
            <Link
              href="/admin/clearinghouse"
              className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Go to Clearinghouse
            </Link>
          </div>

          {/* Stats Grid - SimCity Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.title}
                  href={stat.href}
                  className="group relative bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                >
                  {/* Alert Badge */}
                  {stat.alert && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 border-2 border-black shadow-sm">
                        !
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Icon */}
                    <div className={`inline-flex p-3 ${stat.bgColor} rounded-lg mb-4`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>

                    {/* Count */}
                    <div className="text-4xl font-black text-black mb-1">
                      {stat.count}
                    </div>

                    {/* Title */}
                    <div className="text-sm font-bold text-gray-900 mb-2">
                      {stat.title}
                    </div>

                    {/* Subtitle */}
                    <div className="text-xs text-gray-600">
                      {stat.subtitle}
                    </div>

                    {/* Alert Message */}
                    {stat.alert && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {stat.alert}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-gray-400">→</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-12">
            <h2 className="text-2xl font-black text-black mb-6">Quick Actions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/signup"
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
              >
                <Users className="w-5 h-5" />
                Add Person
              </Link>

              <Link
                href="/admin/blog/new"
                className="flex items-center gap-3 px-4 py-3 bg-red-50 border-2 border-red-600 text-red-600 font-bold hover:bg-red-100 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Write Story
              </Link>

              <Link
                href="/admin/programs/new"
                className="flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-600 text-green-600 font-bold hover:bg-green-100 transition-colors"
              >
                <Building2 className="w-5 h-5" />
                Add Program
              </Link>

              <Link
                href="/admin/services/import"
                className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-2 border-orange-600 text-orange-600 font-bold hover:bg-orange-100 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Import Services
              </Link>
            </div>
          </div>

          {/* Health Overview - SimCity Data Layer Style */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Health */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-black">Connection Health</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {/* Services Connection Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Services</span>
                    <span className="text-sm font-bold text-gray-900">{servicesConnectionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 border border-gray-300">
                    <div
                      className={`h-full ${servicesConnectionRate > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${servicesConnectionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {serviceLinksCount} of {servicesCount} services have profile connections
                  </p>
                </div>

                {/* Programs Connection Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Programs</span>
                    <span className="text-sm font-bold text-gray-900">{programsConnectionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 border border-gray-300">
                    <div
                      className={`h-full ${programsConnectionRate > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${programsConnectionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {programLinksCount} of {programsCount} programs have profile connections
                  </p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-black">System Status</h3>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Database</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 border border-green-600">
                    OPERATIONAL
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Authentication</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 border border-green-600">
                    OPERATIONAL
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Storage</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 border border-green-600">
                    OPERATIONAL
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Admin Access</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 border border-green-600">
                    AUTHENTICATED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
