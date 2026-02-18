import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { Users, BookOpen, Palette, Building2, MapPin, TrendingUp, AlertCircle, CheckCircle2, FileText, Network, Database, GraduationCap, FlaskConical, Award, Calendar, Image, Globe, DollarSign } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profileData?.is_super_admin) {
    redirect('/');
  }

  // Use service client for data queries to bypass RLS
  const sc = createServiceClient();

  // Fetch all content counts in parallel
  const [
    { count: profilesCount },
    { count: publicProfilesCount },
    { count: peopleWithConnectionsCount },
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
    { count: frameworksCount },
    { count: researchCount },
    { count: coePeopleCount },
    { count: eventsCount },
    { count: upcomingEventsCount },
    { count: blogPostsCount },
    { count: draftPostsCount },
    { count: photosCount },
    { count: videosCount },
    { count: intlProgramsCount },
  ] = await Promise.all([
    sc.from('public_profiles').select('*', { count: 'exact', head: true }),
    sc.from('public_profiles').select('*', { count: 'exact', head: true }).eq('is_public', true),
    sc.from('organizations_profiles').select('public_profile_id', { count: 'exact', head: true }),
    sc.from('articles').select('*', { count: 'exact', head: true }),
    sc.from('art_innovation').select('*', { count: 'exact', head: true }),
    sc.from('registered_services').select('*', { count: 'exact', head: true }),
    sc.from('services').select('*', { count: 'exact', head: true }),
    sc.from('profile_appearances').select('*', { count: 'exact', head: true }),
    sc.from('art_innovation_profiles').select('*', { count: 'exact', head: true }),
    sc.from('registered_services_profiles').select('*', { count: 'exact', head: true }),
    sc.from('services_profiles').select('*', { count: 'exact', head: true }),
    sc.from('organizations').select('*', { count: 'exact', head: true }),
    sc.from('organizations_profiles').select('*', { count: 'exact', head: true }),
    sc.from('blog_posts_profiles').select('*', { count: 'exact', head: true }),
    sc.from('profiles').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', true),
    sc.from('blog_posts').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', true),
    sc.from('australian_frameworks').select('*', { count: 'exact', head: true }),
    sc.from('research_items').select('*', { count: 'exact', head: true }),
    sc.from('coe_key_people').select('*', { count: 'exact', head: true }),
    sc.from('events').select('*', { count: 'exact', head: true }),
    sc.from('events').select('*', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
    sc.from('blog_posts').select('*', { count: 'exact', head: true }),
    sc.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    sc.from('partner_photos').select('*', { count: 'exact', head: true }),
    sc.from('partner_videos').select('*', { count: 'exact', head: true }),
    sc.from('international_programs').select('*', { count: 'exact', head: true }),
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
      subtitle: `${publicProfilesCount || 0} public, ${peopleWithConnectionsCount || 0} connected`,
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
      title: 'Events',
      count: eventsCount || 0,
      subtitle: `${upcomingEventsCount || 0} upcoming`,
      icon: Calendar,
      href: '/admin/events',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      title: 'Blog Posts',
      count: blogPostsCount || 0,
      subtitle: `${draftPostsCount || 0} drafts`,
      icon: FileText,
      href: '/admin/blog',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Media',
      count: (photosCount || 0) + (videosCount || 0),
      subtitle: `${photosCount || 0} photos, ${videosCount || 0} videos`,
      icon: Image,
      href: '/admin/media',
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
          <div className="mb-8">
            <h1 className="text-4xl font-black text-black mb-2">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">
              Manage your content and connections across the platform
            </p>
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
                    <div className={`inline-flex p-3 ${stat.bgColor} mb-4`}>
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

              <Link
                href="/admin/events/new"
                className="flex items-center gap-3 px-4 py-3 bg-red-50 border-2 border-red-600 text-red-600 font-bold hover:bg-red-100 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Create Event
              </Link>

              <Link
                href="/admin/media"
                className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-2 border-amber-600 text-amber-600 font-bold hover:bg-amber-100 transition-colors"
              >
                <Image className="w-5 h-5" />
                Media Library
              </Link>

              <Link
                href="/admin/data-operations"
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-600 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                <Database className="w-5 h-5" />
                Data Operations
              </Link>

              <Link
                href="/admin/funding"
                className="flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-600 text-green-600 font-bold hover:bg-green-100 transition-colors"
              >
                <DollarSign className="w-5 h-5" />
                Funding Pipeline
              </Link>

              <Link
                href="/admin/research"
                className="flex items-center gap-3 px-4 py-3 bg-purple-50 border-2 border-purple-600 text-purple-600 font-bold hover:bg-purple-100 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Evidence Library
              </Link>
            </div>
          </div>

          {/* Centre of Excellence Admin */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-black">Centre of Excellence</h2>
                <p className="text-sm text-gray-600">Manage research, frameworks, and key people</p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Frameworks */}
              <Link
                href="/admin/coe/frameworks"
                className="group p-6 bg-blue-50 border-2 border-blue-600 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-blue-600" />
                  <span className="text-3xl font-black text-blue-600">{frameworksCount || 0}</span>
                </div>
                <div className="font-bold text-blue-800">Australian Frameworks</div>
                <div className="text-sm text-blue-600">State-based best practice models</div>
              </Link>

              {/* Research */}
              <Link
                href="/admin/coe/research"
                className="group p-6 bg-purple-50 border-2 border-purple-600 hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FlaskConical className="w-6 h-6 text-purple-600" />
                  <span className="text-3xl font-black text-purple-600">{researchCount || 0}</span>
                </div>
                <div className="font-bold text-purple-800">Research Items</div>
                <div className="text-sm text-purple-600">Evidence-based resources</div>
              </Link>

              {/* Key People */}
              <Link
                href="/admin/coe/people"
                className="group p-6 bg-green-50 border-2 border-green-600 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                  <span className="text-3xl font-black text-green-600">{coePeopleCount || 0}</span>
                </div>
                <div className="font-bold text-green-800">Key People</div>
                <div className="text-sm text-green-600">Leadership and experts</div>
              </Link>

              {/* International Programs */}
              <Link
                href="/centre-of-excellence/map"
                className="group p-6 bg-cyan-50 border-2 border-cyan-600 hover:bg-cyan-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-6 h-6 text-cyan-600" />
                  <span className="text-3xl font-black text-cyan-600">{intlProgramsCount || 0}</span>
                </div>
                <div className="font-bold text-cyan-800">International Programs</div>
                <div className="text-sm text-cyan-600">Global basecamps on map</div>
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

                <Link
                  href="/admin/content-health"
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline mt-4"
                >
                  View Content Health Report →
                </Link>
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
