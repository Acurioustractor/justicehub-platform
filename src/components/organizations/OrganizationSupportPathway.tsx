import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Circle,
  FileText,
  Globe,
  Handshake,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type PathwayMode = 'directory' | 'profile';

type ProfileReadiness = {
  hasIdentity: boolean;
  hasSummary: boolean;
  hasProgramsOrServices: boolean;
  hasPeopleOrStories: boolean;
  hasFundingData: boolean;
  hasPublicSite: boolean;
};

interface OrganizationSupportPathwayProps {
  mode: PathwayMode;
  orgId?: string;
  orgSlug?: string | null;
  orgName?: string;
  readiness?: ProfileReadiness;
}

const directorySteps = [
  {
    label: 'Find',
    title: 'Find and claim the record',
    body: 'Search the civic graph, ABN-backed records, centre partners, and profiles needing work.',
    href: '/organizations?quick=needs-profile#organization-directory',
    cta: 'Open claim-ready records',
    icon: Search,
    tone: 'blue',
  },
  {
    label: 'Map',
    title: 'Map programs and services',
    body: 'Turn hidden delivery into public programs, service entries, centre links, and referral context.',
    href: '/organizations?quick=with-services#organization-directory',
    cta: 'View service-linked orgs',
    icon: MapPinned,
    tone: 'green',
  },
  {
    label: 'Prove',
    title: 'Build proof and stories',
    body: 'Connect lived-experience stories, media, team, impact metrics, and public evidence.',
    href: '/proof',
    cta: 'Open proof layer',
    icon: BookOpen,
    tone: 'ochre',
  },
  {
    label: 'Fund',
    title: 'Follow money and opportunities',
    body: 'Use GrantScope, justice funding, contracts, and application workspaces to see money flow.',
    href: '/funding/discovery',
    cta: 'Open funding discovery',
    icon: Briefcase,
    tone: 'purple',
  },
] as const;

const profileSteps = [
  {
    key: 'claim',
    title: 'Claim and govern',
    body: 'Confirm the organization record, invite the right people, and keep private support work separate from the public profile.',
    cta: 'Claim to open hub',
    icon: ShieldCheck,
    tone: 'purple',
  },
  {
    key: 'services',
    title: 'Programs and services',
    body: 'Add what the organization actually runs, where it runs, who it serves, and which centres or communities it connects with.',
    cta: 'Verify to publish services',
    icon: Building2,
    tone: 'green',
  },
  {
    key: 'stories',
    title: 'Stories and media',
    body: 'Capture consented voices, people, images, proof, and explain why the work matters.',
    cta: 'Verify to publish proof',
    icon: Megaphone,
    tone: 'ochre',
  },
  {
    key: 'funding',
    title: 'Funding and partners',
    body: 'Review funding history, current opportunities, partner asks, and readiness blockers.',
    cta: 'Verify to use workspace',
    icon: Briefcase,
    tone: 'blue',
  },
] as const;

function toneClasses(tone: string) {
  switch (tone) {
    case 'green':
      return 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800';
    case 'ochre':
      return 'border-ochre-700 bg-ochre-50 text-ochre-800';
    case 'purple':
      return 'border-purple-700 bg-purple-50 text-purple-800';
    case 'red':
      return 'border-red-700 bg-red-50 text-red-800';
    case 'blue':
    default:
      return 'border-blue-700 bg-blue-50 text-blue-800';
  }
}

function readinessItems(readiness: ProfileReadiness | undefined) {
  const checks = [
    { label: 'Identity', complete: Boolean(readiness?.hasIdentity) },
    { label: 'Summary', complete: Boolean(readiness?.hasSummary) },
    { label: 'Programs', complete: Boolean(readiness?.hasProgramsOrServices) },
    { label: 'People or stories', complete: Boolean(readiness?.hasPeopleOrStories) },
    { label: 'Funding data', complete: Boolean(readiness?.hasFundingData) },
    { label: 'Public site', complete: Boolean(readiness?.hasPublicSite) },
  ];
  return checks;
}

export function OrganizationSupportPathway({
  mode,
  orgSlug,
  orgName,
  readiness,
}: OrganizationSupportPathwayProps) {
  const checks = readinessItems(readiness);
  const completeCount = checks.filter((item) => item.complete).length;
  const title =
    mode === 'profile'
      ? `${orgName || 'This organization'} support pathway`
      : 'Organization support pathway';
  const summary =
    mode === 'profile'
      ? 'Use the public profile as the front door, then move into the owned workspace for services, stories, funding, partnerships, and publishing.'
      : 'The directory is the front door for early adopter organizations: find the record, claim it, enrich it, and turn existing support workflows into a public proof surface.';
  const steps =
    mode === 'profile'
      ? profileSteps.map((step) => ({
          ...step,
          label: step.key,
          href: '#claim-organization',
        }))
      : directorySteps.map((step) => ({ ...step }));

  return (
    <section className="border-b-2 border-black bg-white py-10">
      <div className="container-justice">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              <Network className="h-4 w-4" />
              Early adopter route map
            </div>
            <h2 className="max-w-3xl text-3xl font-black leading-tight text-earth-900 md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-earth-700">
              {summary}
            </p>

            {mode === 'profile' && (
              <div className="mt-5 border-2 border-black bg-sand-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-black uppercase tracking-wide text-earth-700">
                    Profile readiness
                  </div>
                  <div className="text-2xl font-black text-earth-900">
                    {completeCount}/{checks.length}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {checks.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm font-bold text-earth-700">
                      {item.complete ? (
                        <CheckCircle2 className="h-4 w-4 text-eucalyptus-700" />
                      ) : (
                        <Circle className="h-4 w-4 text-earth-300" />
                      )}
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.title}
                  href={step.href}
                  prefetch={false}
                  className="group flex min-h-[190px] flex-col border-2 border-black bg-white p-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className={`inline-flex items-center gap-2 border px-2 py-1 text-[11px] font-black uppercase tracking-wide ${toneClasses(step.tone)}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {step.label}
                    </div>
                    <ArrowRight className="h-4 w-4 text-earth-400 transition-transform group-hover:translate-x-1 group-hover:text-earth-900" />
                  </div>
                  <h3 className="text-xl font-black leading-tight text-earth-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-earth-600">{step.body}</p>
                  <div className="mt-auto pt-4 text-sm font-black text-blue-700">
                    {step.cta}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {mode === 'directory' && (
          <div className="mt-6 grid gap-3 border-2 border-black bg-[#f8fafc] p-4 md:grid-cols-4">
            {[
              { label: 'Public profile', icon: FileText },
              { label: 'Owned support hub', icon: LayoutDashboard },
              { label: 'Funding workspace', icon: Briefcase },
              { label: 'Published site', icon: Globe },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2 text-sm font-black text-earth-800">
                  <Icon className="h-4 w-4 text-blue-700" />
                  {item.label}
                </div>
              );
            })}
          </div>
        )}

        {mode === 'profile' && (
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
            {orgSlug && (
              <Link href={`/sites/${orgSlug}`} className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 hover:bg-black hover:text-white">
                <Globe className="h-4 w-4" />
                Published site
              </Link>
            )}
            <Link href="/organizations?quick=centre-partners#organization-directory" className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 hover:bg-black hover:text-white">
              <Handshake className="h-4 w-4" />
              Centre partner view
            </Link>
            <Link href="/organizations?quick=needs-profile#organization-directory" className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 hover:bg-black hover:text-white">
              <Sparkles className="h-4 w-4" />
              More orgs to onboard
            </Link>
            <Link href="/organizations?quick=linked#organization-directory" className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 hover:bg-black hover:text-white">
              <BadgeCheck className="h-4 w-4" />
              ABN / GrantScope records
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
