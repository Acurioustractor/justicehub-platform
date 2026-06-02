'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  Info,
  ShieldCheck
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import ProfileCard from '@/components/ProfileCard';
import { RecordTrustBadges } from '@/components/trust/RecordTrustBadges';

interface ProfileData {
  profile: {
    id: string;
    name?: string;
    preferred_name?: string;
    bio?: string;
    profile_picture_url?: string;
    organization?: {
      name: string;
    };
  };
  appearanceRole?: string;
  appearanceExcerpt?: string;
  isFeatured?: boolean;
}

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  location: string;
  contact: string;
  cost: string;
  rating: number;
  verified: boolean;
  lastUpdated: string;
  source?: string;
  aiDiscovered: boolean;
  eligibility?: string[];
  referralInfo?: {
    selfReferral: boolean;
    professionalReferral: boolean;
    referralProcess?: string;
    waitTime?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  confidenceScore?: number;
  extractionTimestamp?: string;
}

type ServiceApiRecord = {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  location?: string | null;
  contact?: string | null;
  cost?: string | null;
  rating?: number | null;
  verified?: boolean | null;
  lastUpdated?: string | null;
  source?: string | null;
  aiDiscovered?: boolean | null;
  eligibility?: string[] | null;
  referralInfo?: {
    selfReferral?: boolean | null;
    professionalReferral?: boolean | null;
    referralProcess?: string | null;
    waitTime?: string | null;
  } | null;
  contactInfo?: {
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
  } | null;
  confidenceScore?: number | null;
  extractionTimestamp?: string | null;
};

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNullableBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeContactInfo(input: unknown): ServiceDetail['contactInfo'] | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const record = input as Record<string, unknown>;
  const normalized: NonNullable<ServiceDetail['contactInfo']> = {};
  const phone = asNullableString(record.phone);
  const email = asNullableString(record.email);
  const website = asNullableString(record.website);
  const address = asNullableString(record.address);

  if (phone) normalized.phone = phone;
  if (email) normalized.email = email;
  if (website) normalized.website = website;
  if (address) normalized.address = address;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeReferralInfo(input: unknown): ServiceDetail['referralInfo'] | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const record = input as Record<string, unknown>;
  const selfReferral = asNullableBoolean(record.selfReferral);
  const professionalReferral = asNullableBoolean(record.professionalReferral);
  const referralProcess = asNullableString(record.referralProcess);
  const waitTime = asNullableString(record.waitTime);

  if (
    selfReferral === null &&
    professionalReferral === null &&
    !referralProcess &&
    !waitTime
  ) {
    return undefined;
  }

  return {
    selfReferral: selfReferral ?? true,
    professionalReferral: professionalReferral ?? true,
    referralProcess: referralProcess ?? undefined,
    waitTime: waitTime ?? undefined,
  };
}

function normalizeServiceDetail(input: unknown): ServiceDetail | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as ServiceApiRecord;
  const id = asNullableString(record.id);
  if (!id) {
    return null;
  }

  const costRaw = asNullableString(record.cost)?.toLowerCase();
  const cost: ServiceDetail['cost'] =
    costRaw === 'free' || costRaw === 'low' || costRaw === 'moderate' || costRaw === 'unknown' ? costRaw : 'unknown';

  const rating = asNullableNumber(record.rating) ?? 0;
  const confidenceScore = asNullableNumber(record.confidenceScore);
  const contactInfo = normalizeContactInfo(record.contactInfo);

  return {
    id,
    name: asNullableString(record.name) || 'Unknown service',
    description: asNullableString(record.description) || 'No description available.',
    category: asNullableString(record.category) || 'family',
    subcategory: asNullableString(record.subcategory) || undefined,
    location: asNullableString(record.location) || 'Australia',
    contact: asNullableString(record.contact) || contactInfo?.phone || contactInfo?.email || 'Contact via service website',
    cost,
    rating,
    verified: asNullableBoolean(record.verified) ?? false,
    lastUpdated: asNullableString(record.lastUpdated) || 'Recently',
    source: asNullableString(record.source) || undefined,
    aiDiscovered: asNullableBoolean(record.aiDiscovered) ?? false,
    eligibility: asStringArray(record.eligibility),
    referralInfo: normalizeReferralInfo(record.referralInfo),
    contactInfo,
    confidenceScore: confidenceScore ?? undefined,
    extractionTimestamp: asNullableString(record.extractionTimestamp) || undefined,
  };
}

function normalizeProfileData(input: unknown): ProfileData | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const row = input as Record<string, unknown>;
  const rawProfile = row.profile;
  if (!rawProfile || typeof rawProfile !== 'object') {
    return null;
  }

  const profileRecord = rawProfile as Record<string, unknown>;
  const profileId = asNullableString(profileRecord.id);
  if (!profileId) {
    return null;
  }

  const organizationValue = profileRecord.organization;
  let organization: { name: string } | undefined;
  if (organizationValue && typeof organizationValue === 'object') {
    const organizationName = asNullableString((organizationValue as Record<string, unknown>).name);
    if (organizationName) {
      organization = { name: organizationName };
    }
  }

  return {
    profile: {
      id: profileId,
      name: asNullableString(profileRecord.name) ?? undefined,
      preferred_name: asNullableString(profileRecord.preferred_name) ?? undefined,
      bio: asNullableString(profileRecord.bio) ?? undefined,
      profile_picture_url: asNullableString(profileRecord.profile_picture_url) ?? undefined,
      organization,
    },
    appearanceRole: asNullableString(row.appearanceRole) ?? undefined,
    appearanceExcerpt: asNullableString(row.appearanceExcerpt) ?? undefined,
    isFeatured: asNullableBoolean(row.isFeatured) ?? undefined,
  };
}

function parseApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }
  const error = asNullableString((payload as Record<string, unknown>).error);
  return error || fallback;
}

function humanize(value: string | undefined): string {
  if (!value) return 'Support';
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function costLabel(cost: string): string {
  switch (cost) {
    case 'free':
      return 'Free';
    case 'low':
      return 'Low cost';
    case 'moderate':
      return 'Moderate cost';
    default:
      return 'Cost unknown';
  }
}

function sourceHost(url: string | undefined): string {
  if (!url) return 'No public source linked';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const serviceId = params?.id;
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof serviceId === 'string' && serviceId.length > 0) {
      loadServiceDetail(serviceId);
      loadProfiles(serviceId);
    }
  }, [serviceId]);

  const loadServiceDetail = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get specific service details
      const response = await fetch(`/api/services/${encodeURIComponent(serviceId)}`);
      const data: unknown = await response.json();

      if (response.ok) {
        const payload = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
        const normalizedService = normalizeServiceDetail(payload?.service);
        if (!normalizedService) {
          setService(null);
          setError('Service record is invalid');
          return;
        }
        setService(normalizedService);
      } else {
        setError(parseApiError(data, 'Service not found'));
      }
    } catch (error) {
      console.error('Error loading service:', error);
      setError('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${encodeURIComponent(serviceId)}/profiles`);
      if (response.ok) {
        const data: unknown = await response.json();
        const payload = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
        const profileRows = Array.isArray(payload?.profiles) ? payload.profiles : [];
        const normalizedProfiles = profileRows
          .map(normalizeProfileData)
          .filter((row): row is ProfileData => row !== null);
        setProfiles(normalizedProfiles);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const phoneNumber = service?.contactInfo?.phone || null;
  const phoneHref = phoneNumber ? `tel:${phoneNumber.replace(/\D/g, '')}` : null;
  const sourceHref = service?.source || service?.contactInfo?.website || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="text-center">
              <div className="text-xl text-gray-600 mb-4">Loading service record...</div>
              <div className="text-sm text-gray-500">Fetching detail and source metadata</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-[#F7F3EA] text-[#0A0A0A]">
        <Navigation />
        <main>
          <section className="bg-[#0A0A0A] px-6 pt-48 pb-16 text-white md:pt-52">
            <div className="mx-auto max-w-3xl text-center">
              <AlertTriangle className="mx-auto mb-5 h-12 w-12 text-[#F97316]" />
              <h1 className="text-3xl font-black md:text-5xl">Service record not found.</h1>
              <p className="mx-auto mt-4 max-w-xl text-white/65">
                {error || 'The service you are looking for does not exist or has been removed.'}
              </p>
              <Link
                href="/services"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#F7F3EA]"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Services
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryLabel = humanize(service.category);
  const subcategoryLabel = service.subcategory ? humanize(service.subcategory) : null;
  const hostLabel = sourceHost(sourceHref || undefined);
  const contactWebsite = service.contactInfo?.website || sourceHref || null;
  const email = service.contactInfo?.email || null;
  const hasDirectContact = Boolean(phoneNumber || email || contactWebsite);
  const confidenceLabel =
    typeof service.confidenceScore === 'number'
      ? `${Math.round(service.confidenceScore * 100)}%`
      : 'Not scored';

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#0A0A0A]">
      <Navigation />

      <main>
        <section className="border-b border-[#0A0A0A] bg-[#0A0A0A] pt-48 pb-10 text-white md:pt-52">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-[1.35fr_0.65fr] md:px-10 lg:px-12">
            <Link
              href="/services"
              className="col-span-full inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-bold text-white/75 transition-colors hover:border-white/35 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Service Finder
            </Link>

            <div>
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.28em] text-[#F97316]">
                Service record
              </p>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                  {categoryLabel}
                </span>
                {subcategoryLabel && (
                  <span className="rounded-full border border-white/15 px-3 py-1 text-sm font-bold text-white/65">
                    {subcategoryLabel}
                  </span>
                )}
              </div>

              <RecordTrustBadges
                className="mb-5"
                humanConfirmed={service.verified}
                hasLocation={Boolean(service.location)}
                locationLabel={service.location}
                hasCostData={service.cost !== 'unknown'}
                hasSource={Boolean(sourceHref)}
                sourceLabel={sourceHref}
                maxBadges={5}
              />

              <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
                {service.name}
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 md:text-lg">
                {service.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-bold text-[#0A0A0A]">
                  <DollarSign className="h-4 w-4 text-[#059669]" />
                  {costLabel(service.cost)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 font-bold text-white/75">
                  <MapPin className="h-4 w-4 text-[#F97316]" />
                  {service.location}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 font-bold text-white/75">
                  <Clock className="h-4 w-4 text-[#F97316]" />
                  Updated {service.lastUpdated}
                </span>
              </div>
            </div>

            <aside className="rounded-lg border border-white/15 bg-white/8 p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-white/45">
                Record status
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-sm font-bold text-white">Review</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-white/65">
                    <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                    {service.verified ? 'Human verified' : 'Needs human review'}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-bold text-white">Source</div>
                  {sourceHref ? (
                    <a
                      href={sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-[#F97316] hover:text-white"
                    >
                      {hostLabel}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div className="mt-1 text-sm text-white/55">No source link available</div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-bold text-white">Extraction confidence</div>
                  <div className="mt-1 text-sm text-white/65">{confidenceLabel}</div>
                </div>

                <div className="rounded-md border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/55">
                  This is a catalogue record, not an endorsement. Check the source and contact the
                  service before relying on it.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#F7F3EA]">
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
            <div className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-lg border border-[#0A0A0A]/12 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-[#DC2626]" />
                  <h2 className="text-xl font-black">Contact</h2>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]/35" />
                    <div>
                      <div className="font-bold">Location</div>
                      <div className="mt-1 text-[#0A0A0A]/65">{service.location}</div>
                    </div>
                  </div>

                  {phoneNumber && (
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]/35" />
                      <div>
                        <div className="font-bold">Phone</div>
                        <a href={phoneHref || undefined} className="mt-1 block text-[#0A0A0A]/65 hover:underline">
                          {phoneNumber}
                        </a>
                      </div>
                    </div>
                  )}

                  {email && (
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]/35" />
                      <div>
                        <div className="font-bold">Email</div>
                        <a href={`mailto:${email}`} className="mt-1 block text-[#0A0A0A]/65 hover:underline">
                          {email}
                        </a>
                      </div>
                    </div>
                  )}

                  {contactWebsite && (
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#0A0A0A]/35" />
                      <div>
                        <div className="font-bold">Website</div>
                        <a
                          href={contactWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-bold text-[#DC2626] hover:underline"
                        >
                          Open source
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {!hasDirectContact && (
                    <p className="rounded-md bg-[#F7F3EA] p-3 text-[#0A0A0A]/65">
                      No direct contact details are attached yet. Use the source link or search for
                      the service name before relying on this record.
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-lg border border-[#0A0A0A]/12 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#DC2626]" />
                  <h2 className="text-xl font-black">Who it appears to serve</h2>
                </div>
                {service.eligibility && service.eligibility.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {service.eligibility.map((criteria) => (
                      <li key={criteria} className="flex items-start gap-2 text-[#0A0A0A]/70">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-[#0A0A0A]/65">
                    Eligibility is not listed on this record yet. Check the source before sharing or
                    referring.
                  </p>
                )}
              </article>

              <article className="rounded-lg border border-[#0A0A0A]/12 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#DC2626]" />
                  <h2 className="text-xl font-black">Record details</h2>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-bold">Cost</div>
                    <div className="mt-1 inline-flex rounded-full bg-[#ECFDF5] px-3 py-1 font-bold text-[#047857]">
                      {costLabel(service.cost)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">Service type</div>
                    <div className="mt-1 text-[#0A0A0A]/65">{subcategoryLabel || categoryLabel}</div>
                  </div>
                  <div>
                    <div className="font-bold">Last updated</div>
                    <div className="mt-1 text-[#0A0A0A]/65">{service.lastUpdated}</div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
            <div className="rounded-lg border border-[#0A0A0A]/12 bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-black">
                <FileText className="h-5 w-5 text-[#DC2626]" />
                How to Access This Service
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-bold">Referral options</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className={`h-4 w-4 ${
                          service.referralInfo?.selfReferral !== false
                            ? 'text-[#059669]'
                            : 'text-[#0A0A0A]/25'
                        }`}
                      />
                      <span className={service.referralInfo?.selfReferral !== false ? 'text-[#0A0A0A]/70' : 'text-[#0A0A0A]/35'}>
                        Self-referral accepted
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        className={`h-4 w-4 ${
                          service.referralInfo?.professionalReferral !== false
                            ? 'text-[#059669]'
                            : 'text-[#0A0A0A]/25'
                        }`}
                      />
                      <span className={service.referralInfo?.professionalReferral !== false ? 'text-[#0A0A0A]/70' : 'text-[#0A0A0A]/35'}>
                        Professional referral accepted
                      </span>
                    </div>
                  </div>

                  {service.referralInfo?.referralProcess && (
                    <div className="mt-4">
                      <h4 className="mb-1 font-bold">Referral process</h4>
                      <p className="text-sm leading-6 text-[#0A0A0A]/65">{service.referralInfo.referralProcess}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 font-bold">What to expect</h3>
                  <div className="space-y-3 text-sm leading-6 text-[#0A0A0A]/65">
                    {service.referralInfo?.waitTime ? (
                      <p><strong>Typical wait time:</strong> {service.referralInfo.waitTime}</p>
                    ) : (
                      <p><strong>Wait times:</strong> Contact service for current availability</p>
                    )}
                    <p><strong>First contact:</strong> Call or visit website to begin intake process</p>
                    <p><strong>Documentation:</strong> May require ID or referral letter depending on service type</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-md border border-[#0A0A0A]/10 bg-[#F7F3EA] p-4 text-sm">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
                  <p className="leading-6 text-[#0A0A0A]/70">
                    Need help navigating services? <Link href="/alma" className="font-bold underline">Ask ALMA</Link> for broader guidance, then check the source before acting.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-[#0A0A0A]/12 bg-[#F7F3EA] p-5">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#0A0A0A]/45">
                  Next action
                </p>
                <h2 className="mt-2 text-2xl font-black">Use this record carefully.</h2>
                <p className="mt-2 text-sm leading-6 text-[#0A0A0A]/65">
                  This page helps you inspect a service record. If someone needs urgent support,
                  confirm details directly with the service or a trusted local worker.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {phoneHref && (
                    <a
                      href={phoneHref}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#DC2626]"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  )}
                  {sourceHref && (
                    <a
                      href={sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#DC2626] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B91C1C]"
                    >
                      Visit source
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A]/15 bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-[#0A0A0A]"
                  >
                    Search again
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-xl font-black">Related routes</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href={`/services?category=${service.category}`}
                    className="group rounded-lg border border-[#0A0A0A]/12 bg-white p-4 shadow-sm transition-colors hover:border-[#0A0A0A]"
                >
                    <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#DC2626]">
                    More Services
                  </div>
                    <h3 className="font-bold">Similar {categoryLabel} records</h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0A0A0A]/65 group-hover:text-[#0A0A0A]">
                      Browse <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                <Link
                  href="/community-programs"
                    className="group rounded-lg border border-[#0A0A0A]/12 bg-white p-4 shadow-sm transition-colors hover:border-[#0A0A0A]"
                >
                    <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#DC2626]">
                    Programs
                  </div>
                    <h3 className="font-bold">Curated community programs</h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0A0A0A]/65 group-hover:text-[#0A0A0A]">
                      Explore <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                <Link
                  href="/alma"
                    className="group rounded-lg border border-[#0A0A0A]/12 bg-white p-4 shadow-sm transition-colors hover:border-[#0A0A0A]"
                >
                    <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#DC2626]">
                      ALMA
                  </div>
                    <h3 className="font-bold">Alternative models</h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0A0A0A]/65 group-hover:text-[#0A0A0A]">
                      Research <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                </div>
              </div>
            </div>

            {profiles.length > 0 && (
              <div className="mt-10 border-t border-[#0A0A0A]/12 pt-8">
                <h2 className="mb-3 flex items-center gap-2 text-2xl font-black">
                  <Users className="h-6 w-6 text-[#DC2626]" />
                  Story links
                </h2>
                <p className="mb-6 max-w-2xl text-sm leading-6 text-[#0A0A0A]/65">
                  These cards only appear when story/profile material is attached to the public record.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {profiles.map((profileData, index) => (
                    <ProfileCard
                      key={profileData.profile.id + index}
                      profile={profileData.profile}
                      role={profileData.appearanceRole}
                      storyExcerpt={profileData.appearanceExcerpt}
                      isFeatured={profileData.isFeatured}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-lg border border-[#0A0A0A]/10 bg-[#F7F3EA] p-4 text-sm text-[#0A0A0A]/65">
                  <p>
                    These stories are shared through <strong>Empathy Ledger</strong>,
                    an Indigenous-led storytelling platform that maintains data sovereignty
                    and cultural protocols. All stories are shared with explicit consent.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
