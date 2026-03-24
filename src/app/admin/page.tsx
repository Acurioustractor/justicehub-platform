import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { Users, BookOpen, Palette, Building2, MapPin, TrendingUp, AlertCircle, FileText, Network, Database, GraduationCap, FlaskConical, Award, Calendar, Image, Globe, DollarSign, Zap, Handshake, ExternalLink, Mail, Activity, Target, Workflow, Scale, Shield, UserCheck, Megaphone, Mic, BarChart3 } from 'lucide-react';
import { SystemStatus } from '@/components/admin/SystemStatus';
import { createServiceClient } from '@/lib/supabase/service-lite';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const serviceClient = createServiceClient() as any;

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Check admin role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileData?.role !== 'admin') {
    redirect('/');
  }

  // Fetch all content counts in parallel using authenticated server client
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
    { count: inboxCount },
    { count: inboxNewCount },
    { count: programsWithOrgCount },
    { count: servicesWithOrgCount },
    { count: matrixCasesCount },
    { count: containedNominationsCount },
    { count: orgClaimsCount },
    { count: almaVerifiedCount },
    { count: almaUnverifiedCount },
    { count: fundingCount },
  ] = await Promise.all([
    supabase.from('public_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('public_profiles').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('organizations_profiles').select('public_profile_id', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('art_innovation').select('*', { count: 'exact', head: true }),
    supabase.from('registered_services').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('profile_appearances').select('*', { count: 'exact', head: true }),
    supabase.from('art_innovation_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('registered_services_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('services_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('organizations_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('synced_from_empathy_ledger', true),
    supabase.from('australian_frameworks').select('*', { count: 'exact', head: true }),
    supabase.from('research_items').select('*', { count: 'exact', head: true }),
    supabase.from('coe_key_people').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).gte('start_date', new Date().toISOString()),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('partner_photos').select('*', { count: 'exact', head: true }),
    supabase.from('partner_videos').select('*', { count: 'exact', head: true }),
    supabase.from('international_programs').select('*', { count: 'exact', head: true }),
    (supabase as any).from('contact_submissions').select('*', { count: 'exact', head: true }),
    (supabase as any).from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('registered_services').select('*', { count: 'exact', head: true }).not('organization_id', 'is', null),
    supabase.from('services').select('*', { count: 'exact', head: true }).not('organization_id', 'is', null),
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
    (supabase as any).from('campaign_nominations').select('*', { count: 'exact', head: true }),
    (supabase as any).from('organization_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'verified').neq('verification_status', 'ai_generated'),
    supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
  ]);

  // Fetch onboarded partner organizations (those with active system accounts)
  const { data: partnerOrgs } = await supabase
    .from('organization_members')
    .select('organization_id, role, status, user_id, organizations(id, name, slug, type, location), profiles(email)')
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  // Calculate connection rates (org linkage, not profile linkage)
  const servicesConnectionRate = servicesCount ? Math.round(((servicesWithOrgCount || 0) / servicesCount) * 100) : 0;
  const programsConnectionRate = programsCount ? Math.round(((programsWithOrgCount || 0) / programsCount) * 100) : 0;

  // Calculate total auto-linked relationships
  const totalAutoLinks = (orgLinksCount || 0) + (blogPostLinksCount || 0);

  const { count: governedProofBundlesCount } = await serviceClient
    .from('governed_proof_bundles')
    .select('*', { count: 'exact', head: true })
    .eq('subject_type', 'place');

  const statGroups = [
    {
      label: 'Content & People',
      cards: [
        { title: 'People', count: profilesCount || 0, subtitle: `${publicProfilesCount || 0} public, ${peopleWithConnectionsCount || 0} connected`, icon: Users, href: '/admin/profiles', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
        { title: 'Stories', count: storiesCount || 0, subtitle: `${storyLinksCount || 0} profile links`, icon: BookOpen, href: '/admin/stories', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
        { title: 'Art & Innovation', count: artCount || 0, subtitle: `${artLinksCount || 0} profile links`, icon: Palette, href: '/admin/art-innovation', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
        { title: 'Media', count: (photosCount || 0) + (videosCount || 0), subtitle: `${photosCount || 0} photos, ${videosCount || 0} videos + 261 via EL`, icon: Image, href: '/admin/media', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
        { title: 'Blog Posts', count: blogPostsCount || 0, subtitle: `${draftPostsCount || 0} drafts`, icon: FileText, href: '/admin/blog', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
        { title: 'Storytellers', count: '🎙️', subtitle: 'Tags & management', icon: Mic, href: '/admin/storytellers', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
        { title: 'Empathy Ledger', count: empathyTranscriptsCount || 0, subtitle: 'Synced from Empathy Ledger', icon: Database, href: '/admin/empathy-ledger', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
        { title: 'Events', count: eventsCount || 0, subtitle: `${upcomingEventsCount || 0} upcoming`, icon: Calendar, href: '/admin/events', bgColor: 'bg-red-50', textColor: 'text-red-600' },
      ],
    },
    {
      label: 'Directory & Organizations',
      cards: [
        { title: 'Organizations', count: organizationsCount || 0, subtitle: `${orgLinksCount || 0} team members`, icon: Building2, href: '/admin/organizations', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
        { title: 'Programs', count: programsCount || 0, subtitle: `${programsWithOrgCount || 0}/${programsCount || 0} linked to orgs`, icon: Building2, href: '/admin/programs', bgColor: 'bg-green-50', textColor: 'text-green-600', alert: programsConnectionRate < 50 ? 'Low org linkage' : undefined },
        { title: 'Services', count: servicesCount || 0, subtitle: `${servicesWithOrgCount || 0}/${servicesCount || 0} linked to orgs`, icon: MapPin, href: '/admin/services', bgColor: 'bg-orange-50', textColor: 'text-orange-600', alert: servicesConnectionRate < 50 ? 'Low org linkage' : undefined },
        { title: 'Auto-Linked', count: totalAutoLinks, subtitle: `${orgLinksCount || 0} orgs + ${blogPostLinksCount || 0} stories`, icon: Network, href: '/admin/auto-linking', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
        { title: 'Org Claims', count: orgClaimsCount || 0, subtitle: 'Pending partner claims', icon: UserCheck, href: '/admin/org-claims', bgColor: 'bg-teal-50', textColor: 'text-teal-600', alert: (orgClaimsCount || 0) > 0 ? `${orgClaimsCount} pending` : undefined },
      ],
    },
    {
      label: 'Campaign & Outreach',
      cards: [
        { title: 'CONTAINED', count: containedNominationsCount || 0, subtitle: 'Campaign nominations & CRM', icon: Megaphone, href: '/admin/contained', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
        { title: 'Signal Engine', count: '⚡' as string | number, subtitle: 'Autonomous content pipeline', icon: Zap, href: '/admin/signal-engine', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
        { title: 'Campaign Engine', count: '🎯' as string | number, subtitle: 'Alignment & tracked posts', icon: Target, href: '/admin/campaign-engine', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
        { title: 'Analytics', count: '📊' as string | number, subtitle: 'LinkedIn × site × pipeline', icon: BarChart3, href: '/admin/analytics', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
        { title: 'Inbox', count: inboxCount || 0, subtitle: `${inboxNewCount || 0} new`, icon: Mail, href: '/admin/inbox', bgColor: 'bg-rose-50', textColor: 'text-rose-600', alert: (inboxNewCount || 0) > 0 ? `${inboxNewCount} unread` : undefined },
      ],
    },
    {
      label: 'Data & Intelligence',
      cards: [
        { title: 'Justice Funding', count: fundingCount || 0, subtitle: 'National funding records', icon: DollarSign, href: '/admin/funding', bgColor: 'bg-green-50', textColor: 'text-green-600' },
        { title: 'Justice Matrix', count: matrixCasesCount || 0, subtitle: 'Legal cases & precedents', icon: Scale, href: '/admin/justice-matrix', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
        { title: 'ALMA Verify', count: almaVerifiedCount || 0, subtitle: `${almaUnverifiedCount || 0} need review`, icon: Shield, href: '/admin/alma/verify', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', alert: (almaUnverifiedCount || 0) > 20 ? `${almaUnverifiedCount} unverified` : undefined },
        { title: 'Data Operations', count: '📊' as string | number, subtitle: 'Sources, health, enrichment', icon: Database, href: '/admin/data-operations', bgColor: 'bg-slate-50', textColor: 'text-slate-600' },
        { title: 'Data Health', count: '📊' as string | number, subtitle: 'Tables, APIs, enrichment', icon: Activity, href: '/admin/data-health', bgColor: 'bg-slate-50', textColor: 'text-slate-600' },
        { title: 'Governed Proof', count: governedProofBundlesCount || 0, subtitle: 'Place bundles in control plane', icon: Workflow, href: '/admin/governed-proof', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
      ],
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

          {/* Grouped Stats */}
          {statGroups.map((group) => (
            <div key={group.label} className="mb-10">
              <h2 className="text-lg font-black text-gray-500 uppercase tracking-wide mb-4">{group.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {group.cards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Link
                      key={stat.title}
                      href={stat.href}
                      className="group relative bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                    >
                      {stat.alert && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 border-2 border-black shadow-sm">!</div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className={`inline-flex p-3 ${stat.bgColor} mb-4`}>
                          <Icon className={`w-6 h-6 ${stat.textColor}`} />
                        </div>
                        <div className="text-4xl font-black text-black mb-1">{typeof stat.count === 'number' ? stat.count.toLocaleString() : stat.count}</div>
                        <div className="text-sm font-bold text-gray-900 mb-2">{stat.title}</div>
                        <div className="text-xs text-gray-600">{stat.subtitle}</div>
                        {stat.alert && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                              <AlertCircle className="w-3 h-3" />{stat.alert}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-gray-400">→</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Partner Organizations — onboarded with system accounts */}
          {partnerOrgs && partnerOrgs.length > 0 && (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-black">Partner Organizations</h2>
                  <p className="text-sm text-gray-600">{partnerOrgs.length} organizations with active system accounts</p>
                </div>
                <Handshake className="w-8 h-8 text-ochre-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnerOrgs.map((member: any) => {
                  const org = member.organizations;
                  if (!org) return null;
                  return (
                    <div key={org.id} className="border-2 border-black p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-black text-lg">{org.name}</h3>
                          <p className="text-xs text-gray-500">{org.type} {org.location ? `· ${org.location}` : ''}</p>
                        </div>
                        <span className="text-xs font-bold bg-green-100 text-green-800 border border-green-600 px-2 py-0.5">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{member.profiles?.email}</p>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/organizations/${org.slug}/hub`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-ochre-600 text-white text-sm font-bold hover:bg-ochre-700 transition-colors"
                        >
                          Support Hub
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/admin/organizations/${org.slug}`}
                          className="flex items-center justify-center px-3 py-2 border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                href="/admin/programs"
                className="flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-600 text-green-600 font-bold hover:bg-green-100 transition-colors"
              >
                <Building2 className="w-5 h-5" />
                Add Program
              </Link>

              <Link
                href="/admin/services"
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
                href="/admin/governed-proof"
                className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border-2 border-emerald-600 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
              >
                <Workflow className="w-5 h-5" />
                Governed Proof
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
                href="/admin/signal-engine"
                className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border-2 border-yellow-600 text-yellow-600 font-bold hover:bg-yellow-100 transition-colors"
              >
                <Zap className="w-5 h-5" />
                Signal Engine
              </Link>

              <Link
                href="/admin/campaign-engine"
                className="flex items-center gap-3 px-4 py-3 bg-rose-50 border-2 border-rose-600 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
              >
                <Target className="w-5 h-5" />
                Campaign Alignment Engine
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

          {/* JusticeHub Innovations */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-black">JusticeHub Innovations</h2>
                <p className="text-sm text-gray-600">Products in development — preview and test</p>
              </div>
              <FlaskConical className="w-8 h-8 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/preview/racism-heatmap" className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-2 border-orange-600 text-orange-600 font-bold hover:bg-orange-100 transition-colors">
                <MapPin className="w-5 h-5" />
                Racism Heatmap
              </Link>
              <Link href="/preview/signal-engine" className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-2 border-amber-600 text-amber-600 font-bold hover:bg-amber-100 transition-colors">
                <Zap className="w-5 h-5" />
                Signal Engine
              </Link>
              <Link href="/preview/pledge-map" className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border-2 border-emerald-600 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors">
                <Users className="w-5 h-5" />
                Pledge Map
              </Link>
              <Link href="/preview/complaint-pathfinder" className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-100 transition-colors">
                <FileText className="w-5 h-5" />
                Complaint Pathfinder
              </Link>
              <Link href="/preview/justice-navigator" className="flex items-center gap-3 px-4 py-3 bg-purple-50 border-2 border-purple-600 text-purple-600 font-bold hover:bg-purple-100 transition-colors">
                <Network className="w-5 h-5" />
                Justice Navigator
              </Link>
              <Link href="/preview/watchguard-support-pack" className="flex items-center gap-3 px-4 py-3 bg-red-50 border-2 border-red-600 text-red-600 font-bold hover:bg-red-100 transition-colors">
                <Building2 className="w-5 h-5" />
                WatchGuard Support Pack
              </Link>
              <Link href="/preview/justice-matrix" className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-2 border-indigo-600 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors">
                <TrendingUp className="w-5 h-5" />
                Justice Matrix
              </Link>
              <Link href="/preview/justice-project" className="flex items-center gap-3 px-4 py-3 bg-pink-50 border-2 border-pink-600 text-pink-600 font-bold hover:bg-pink-100 transition-colors">
                <BookOpen className="w-5 h-5" />
                Justice Project
              </Link>
              <Link href="/preview/grassroots-activation" className="flex items-center gap-3 px-4 py-3 bg-teal-50 border-2 border-teal-600 text-teal-600 font-bold hover:bg-teal-100 transition-colors">
                <Palette className="w-5 h-5" />
                Grassroots Activation
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

            {/* System Status — live from /api/admin/system-status */}
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
