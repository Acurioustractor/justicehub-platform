import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { redirect } from 'next/navigation';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import Link from 'next/link';
import { Globe, Image, Users, BarChart3, FileText, Settings } from 'lucide-react';

async function getBasecampData(orgId: string) {
  const supabase = createServiceClient() as any;

  const [photos, contacts, goals, metrics, stories] = await Promise.all([
    supabase.from('partner_photos').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_contacts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_goals').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_impact_metrics').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('partner_storytellers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
  ]);

  return {
    photoCount: photos.count || 0,
    contactCount: contacts.count || 0,
    goalCount: goals.count || 0,
    metricCount: metrics.count || 0,
    storytellerCount: stories.count || 0,
  };
}

export default async function BasecampPage({ params }: { params: { 'org-slug': string } }) {
  const slug = params['org-slug'];
  const service = createServiceClient();

  const { data: organization } = await service
    .from('organizations')
    .select('id, name, slug, type, partner_tier')
    .eq('slug', slug)
    .single();

  if (!organization) redirect('/');

  // Only basecamps can access this page
  if (organization.type !== 'basecamp' && organization.partner_tier !== 'basecamp') {
    redirect(`/hub/${slug}/dashboard`);
  }

  const data = await getBasecampData(organization.id);

  const cards = [
    {
      title: 'Mini-Site',
      description: 'Edit your public page on JusticeHub',
      icon: Globe,
      href: `/hub/${slug}/site-editor`,
      stat: 'Live',
      statColor: 'text-green-700',
    },
    {
      title: 'Photos & Gallery',
      description: 'Manage your photo gallery',
      icon: Image,
      href: `/hub/${slug}/site-editor#gallery`,
      stat: `${data.photoCount} photos`,
      statColor: 'text-earth-600',
    },
    {
      title: 'Storytellers',
      description: 'Manage storyteller profiles',
      icon: Users,
      href: `/hub/${slug}/site-editor#team`,
      stat: `${data.storytellerCount} people`,
      statColor: 'text-earth-600',
    },
    {
      title: 'Impact Metrics',
      description: 'Track and share your impact',
      icon: BarChart3,
      href: `/hub/${slug}/site-editor#metrics`,
      stat: `${data.metricCount} metrics`,
      statColor: 'text-earth-600',
    },
    {
      title: 'Goals',
      description: 'Set and track program goals',
      icon: FileText,
      href: `/hub/${slug}/site-editor#goals`,
      stat: `${data.goalCount} goals`,
      statColor: 'text-earth-600',
    },
    {
      title: 'Team Contacts',
      description: 'Manage who visitors can reach',
      icon: Settings,
      href: `/hub/${slug}/site-editor#contacts`,
      stat: `${data.contactCount} contacts`,
      statColor: 'text-earth-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Basecamp Dashboard</h1>
        <p className="text-earth-600">
          Manage your community presence on JusticeHub.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5 text-earth-600" />
                <h3 className="font-black">{card.title}</h3>
              </div>
              <p className="text-sm text-earth-600 mb-4">{card.description}</p>
              <span className={`text-sm font-bold ${card.statColor}`}>{card.stat}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 bg-ochre-50 border-2 border-ochre-300 p-6">
        <h3 className="font-black mb-2">Your Public Page</h3>
        <p className="text-sm text-earth-600 mb-3">
          Your community page is live at:
        </p>
        <Link
          href={`/sites/${slug}`}
          className="text-ochre-700 hover:text-ochre-900 font-bold underline"
          target="_blank"
        >
          justicehub.org.au/sites/{slug}
        </Link>
      </div>
    </div>
  );
}
