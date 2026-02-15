'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Bot,
  FileText,
  ArrowRight,
  Info,
  ChevronRight
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import ProfileCard from '@/components/ProfileCard';

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
    costRaw === 'free' || costRaw === 'low' || costRaw === 'moderate' ? costRaw : 'free';

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

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const serviceId = params?.id;
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);

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
      setProfilesLoading(true);

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
    } finally {
      setProfilesLoading(false);
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'text-green-600 bg-green-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'moderate': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'legal': 'bg-blue-100 text-blue-800',
      'emergency': 'bg-red-100 text-red-800',
      'health': 'bg-green-100 text-green-800',
      'education': 'bg-purple-100 text-purple-800',
      'family': 'bg-orange-100 text-orange-800',
      'housing': 'bg-indigo-100 text-indigo-800',
      'employment': 'bg-yellow-100 text-yellow-800',
      'substance': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="text-center">
              <div className="text-xl text-gray-600 mb-4">🤖 Loading AI-discovered service...</div>
              <div className="text-sm text-gray-500">Fetching detailed information</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="header-offset">
          <div className="container-justice py-16">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
              <p className="text-gray-600 mb-8">{error || 'The service you\'re looking for doesn\'t exist.'}</p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Services
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="header-offset">
        {/* Back Navigation */}
        <section className="border-b-2 border-black py-4">
          <div className="container-justice">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-black hover:underline font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Service Finder
            </Link>
          </div>
        </section>

        {/* Service Header */}
        <section className="section-padding border-b-2 border-black bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {service.aiDiscovered && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Bot className="h-4 w-4 mr-1" />
                      AI-Discovered
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(service.category)}`}>
                    {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                  </span>
                  {service.verified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="headline-truth mb-4">{service.name}</h1>

                <p className="text-xl text-gray-700 leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-current text-yellow-400" />
                    <span className="font-bold text-lg">{service.rating}</span>
                    <span className="text-gray-600">rating</span>
                  </div>

                  <div className={`px-4 py-2 rounded-full font-bold ${getCostColor(service.cost)}`}>
                    {service.cost.charAt(0).toUpperCase() + service.cost.slice(1)} Cost
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Updated {service.lastUpdated}</span>
                  </div>
                </div>
              </div>

              {service.source && service.aiDiscovered && (
                <div className="lg:w-80 bg-white border-2 border-black p-6">
                  <h3 className="font-bold mb-3 text-black">🤖 AI Discovery Info</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Data Source:</div>
                      <a
                        href={service.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Government Website <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {service.confidenceScore && (
                      <div>
                        <div className="font-medium text-gray-700">AI Confidence:</div>
                        <div className="text-green-600 font-bold">
                          {Math.round(service.confidenceScore * 100)}%
                        </div>
                      </div>
                    )}
                    {service.extractionTimestamp && (
                      <div>
                        <div className="font-medium text-gray-700">Discovered:</div>
                        <div>{new Date(service.extractionTimestamp).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Service Details */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-gray-700">{service.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Contact</div>
                      <div className="text-gray-700">{service.contact}</div>
                    </div>
                  </div>

                  {service.contactInfo?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">Website</div>
                        <a
                          href={service.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Eligibility */}
              {service.eligibility && service.eligibility.length > 0 && (
                <div className="border-2 border-black p-6 bg-white">
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Eligibility Criteria
                  </h3>

                  <ul className="space-y-2">
                    {service.eligibility.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Info */}
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Service Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-gray-700">Cost Structure</div>
                    <div className={`inline-block px-3 py-1 rounded font-bold ${getCostColor(service.cost)}`}>
                      {service.cost.charAt(0).toUpperCase() + service.cost.slice(1)}
                    </div>
                  </div>

                  {service.subcategory && (
                    <div>
                      <div className="font-medium text-gray-700">Service Type</div>
                      <div className="text-gray-900">{service.subcategory.replace('_', ' ')}</div>
                    </div>
                  )}

                  <div>
                    <div className="font-medium text-gray-700">Last Updated</div>
                    <div className="text-gray-900">{service.lastUpdated}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Information */}
            <div className="mt-8 border-2 border-black p-6 bg-white">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                How to Access This Service
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-3">Referral Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${service.referralInfo?.selfReferral !== false ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={service.referralInfo?.selfReferral !== false ? 'text-gray-700' : 'text-gray-400'}>
                        Self-referral accepted
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${service.referralInfo?.professionalReferral !== false ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={service.referralInfo?.professionalReferral !== false ? 'text-gray-700' : 'text-gray-400'}>
                        Professional referral accepted
                      </span>
                    </div>
                  </div>

                  {service.referralInfo?.referralProcess && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-1">Referral Process</h4>
                      <p className="text-gray-600 text-sm">{service.referralInfo.referralProcess}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold mb-3">What to Expect</h4>
                  <div className="space-y-2 text-sm text-gray-600">
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

              <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800">
                    Need help navigating services? <Link href="/intelligence#alma-chat" className="font-bold underline">Ask ALMA</Link> for personalized guidance on finding and accessing support.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Resources */}
            <div className="mt-8">
              <h3 className="font-bold text-xl mb-4">Related Resources</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href={`/services?category=${service.category}`}
                  className="border-2 border-black p-4 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="text-ochre-600 font-bold text-sm uppercase tracking-wider mb-1">
                    More Services
                  </div>
                  <h4 className="font-bold mb-2">Similar {service.category} Services</h4>
                  <span className="text-ochre-600 font-medium inline-flex items-center gap-1 text-sm">
                    Browse <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>

                <Link
                  href="/community-programs"
                  className="border-2 border-black p-4 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="text-eucalyptus-600 font-bold text-sm uppercase tracking-wider mb-1">
                    Programs
                  </div>
                  <h4 className="font-bold mb-2">Community Programs</h4>
                  <span className="text-eucalyptus-600 font-medium inline-flex items-center gap-1 text-sm">
                    Explore <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>

                <Link
                  href="/youth-justice-report/interventions"
                  className="border-2 border-black p-4 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-1">
                    Evidence
                  </div>
                  <h4 className="font-bold mb-2">ALMA Interventions</h4>
                  <span className="text-blue-600 font-medium inline-flex items-center gap-1 text-sm">
                    Research <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Real People Stories */}
            {profiles.length > 0 && (
              <div className="mt-12 border-t-2 border-black pt-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  Real People, Real Impact
                </h2>
                <p className="text-lg text-gray-700 mb-8">
                  Hear from people who have used this service and their experiences.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                <div className="mt-6 text-sm text-gray-600 p-4 bg-blue-50 border-l-4 border-blue-500">
                  <p>
                    These stories are shared through <strong>Empathy Ledger</strong>,
                    an Indigenous-led storytelling platform that maintains data sovereignty
                    and cultural protocols. All stories are shared with explicit consent.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-12 text-center border-t-2 border-black pt-8">
              <h3 className="text-2xl font-bold mb-6">Ready to Get Help?</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`tel:${service.contact.replace(/\D/g, '')}`}
                  className="px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                >
                  <Phone className="h-5 w-5" />
                  Call Now
                </a>

                {service.source && (
                  <a
                    href={service.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center gap-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Visit Source
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
