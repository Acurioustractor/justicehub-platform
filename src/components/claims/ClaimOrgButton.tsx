'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  ClipboardCheck,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  UserCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ClaimOrgButtonProps {
  orgId: string;
  orgSlug: string;
  fundingWorkspaceHref?: string;
  isBusinessWorkspace?: boolean;
}

const ROLE_OPTIONS = [
  { value: 'founder', label: 'Founder' },
  { value: 'ceo', label: 'CEO / Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'board', label: 'Board Member' },
  { value: 'volunteer', label: 'Volunteer' },
];

type LinkedProfile = {
  name: string;
  email: string;
  slug?: string | null;
  roleTags: string[];
};

function FundingWorkspaceCta({
  href,
  status,
  isBusinessWorkspace = false,
}: {
  href?: string;
  status: string | null;
  isBusinessWorkspace?: boolean;
}) {
  if (!href) return null;

  const workspaceLabel = isBusinessWorkspace
    ? 'Business & Funding Workspace'
    : 'Funding Workspace';

  if (status === 'pending') {
    return (
      <div
        role="status"
        aria-disabled="true"
        className="inline-flex max-w-sm items-center gap-3 border-2 border-black bg-sand-50 px-6 py-3 text-earth-800"
      >
        <Briefcase className="h-5 w-5 shrink-0" />
        <span>
          <span className="block font-black">Funding workspace opens after approval</span>
          <span className="block text-xs font-medium text-earth-600">
            Admin review is checking this claim first.
          </span>
        </span>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div
        role="status"
        aria-disabled="true"
        className="inline-flex max-w-sm items-center gap-3 border-2 border-red-300 bg-red-50 px-6 py-3 text-red-700"
      >
        <Briefcase className="h-5 w-5 shrink-0" />
        <span className="font-black">Funding workspace unavailable</span>
      </div>
    );
  }

  const isVerified = status === 'verified';

  return (
    <Link
      href={href}
      prefetch={false}
      className={`inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-bold transition-colors ${
        isVerified
          ? 'bg-eucalyptus-600 text-white hover:bg-eucalyptus-700'
          : 'bg-white text-earth-900 hover:bg-eucalyptus-50'
      }`}
    >
      <Briefcase className="h-5 w-5" />
      {isVerified ? `Open ${workspaceLabel}` : `Preview ${workspaceLabel}`}
    </Link>
  );
}

function ClaimNextStepsPanel({
  status,
  email,
  emailSent,
  hubHref = '/hub',
  hubLabel,
}: {
  status: string;
  email?: string | null;
  emailSent?: boolean;
  hubHref?: string;
  hubLabel?: string;
}) {
  const isVerified = status === 'verified';
  const primaryHubLabel = hubLabel || (isVerified ? 'Open organization hub' : 'Check status in hub');
  const steps = isVerified
    ? [
        {
          label: 'Open the organization hub',
          detail: 'Use the hub to manage profile data, programs, services, stories, people, and funding work.',
          icon: KeyRound,
        },
        {
          label: 'Review source data',
          detail: 'Check what JusticeHub already knows from ABN, CivicGraph, GrantScope, services, places, and stories.',
          icon: ClipboardCheck,
        },
        {
          label: 'Publish stronger proof',
          detail: 'Add missing programs, people, story consent, and GrantScope readiness evidence for funders and partners.',
          icon: UserCheck,
        },
      ]
    : [
        {
          label: 'Admin review starts',
          detail: 'We check your role, email, ABN/CivicGraph links, and any notes you gave us.',
          icon: ClipboardCheck,
        },
        {
          label: 'We follow up if needed',
          detail: 'If the claim needs more evidence, we will use the email attached to this claim.',
          icon: Mail,
        },
        {
          label: 'Workspace opens after approval',
          detail: 'Once verified, you can update the profile, publish services, add stories, and use GrantScope matches.',
          icon: KeyRound,
        },
      ];

  return (
    <div className="w-full max-w-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`mb-2 inline-flex items-center gap-2 border px-2 py-1 text-xs font-black uppercase tracking-wide ${
            isVerified
              ? 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800'
              : 'border-ochre-700 bg-ochre-50 text-ochre-800'
          }`}>
            {isVerified ? <CheckCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
            {isVerified ? 'Verified' : 'Pending review'}
          </div>
          <h3 className="text-xl font-black leading-tight">
            {isVerified ? 'Organization access is active' : 'Claim received'}
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-earth-600">
            {isVerified
              ? 'This record has been verified. Use the hub to keep public proof and private support work moving together.'
              : 'Your claim is now in the admin review queue. You can keep reading this profile while the claim is checked.'}
          </p>
        </div>
      </div>

      <div className="mb-4 border border-earth-200 bg-sand-50 p-3 text-sm text-earth-700">
        {emailSent && email ? (
          <span>A confirmation email has been sent to <strong>{email}</strong>.</span>
        ) : email ? (
          <span>We saved <strong>{email}</strong> as the contact email for review updates.</span>
        ) : (
          <span>We will use the email on your account for review updates.</span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="border-2 border-black bg-white p-3">
              <Icon className="mb-3 h-5 w-5 text-purple-700" />
              <div className="text-sm font-black text-earth-900">{step.label}</div>
              <p className="mt-1 text-xs leading-relaxed text-earth-600">{step.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={hubHref}
          className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-sm font-black text-white hover:bg-earth-900"
        >
          {primaryHubLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-black hover:bg-sand-50"
        >
          Back to directory
        </Link>
      </div>
    </div>
  );
}

export function ClaimOrgButton({
  orgId,
  orgSlug,
  fundingWorkspaceHref,
  isBusinessWorkspace,
}: ClaimOrgButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);
  const [linkedProfile, setLinkedProfile] = useState<LinkedProfile | null>(null);
  const [editingContact, setEditingContact] = useState(false);

  // Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [roleAtOrg, setRoleAtOrg] = useState('');
  const [abn, setAbn] = useState('');
  const [message, setMessage] = useState('');
  // Consent + visibility (not pre-selected — the org picks each one)
  const [consentLevel, setConsentLevel] = useState<string>('');
  const [permittedUses, setPermittedUses] = useState<string[]>([]);
  const [storyInterest, setStoryInterest] = useState<string>('');

  async function loadProfileDefaults(user: any) {
    const fallbackName =
      user?.user_metadata?.preferred_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email ||
      '';

    const { data: publicProfile } = await (supabase as any)
      .from('public_profiles')
      .select('preferred_name, full_name, slug, role_tags')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileName = publicProfile?.preferred_name || publicProfile?.full_name || fallbackName;
    const profileEmail = user?.email || '';

    setContactName((current) => current || profileName);
    setContactEmail((current) => current || profileEmail);

    if (profileName || profileEmail) {
      setLinkedProfile({
        name: profileName || profileEmail,
        email: profileEmail,
        slug: publicProfile?.slug || null,
        roleTags: Array.isArray(publicProfile?.role_tags) ? publicProfile.role_tags : [],
      });
    }
  }

  useEffect(() => {
    async function checkClaim() {
      try {
        const res = await fetch(`/api/organizations/${orgId}/claim`);
        const data = await res.json();
        if (data.claim) {
          setClaimStatus(data.claim.status);
          setSubmittedEmail(data.claim.contact_email || null);
        } else if (searchParams.get('claim') === '1') {
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) {
            await loadProfileDefaults(auth.user);
            setShowForm(true);
          }
        }
      } catch {
        // Not logged in or error — show default button
      } finally {
        setLoading(false);
      }
    }
    checkClaim();
  }, [orgId, searchParams, supabase]);

  function loginRedirect() {
    return `/login?redirect=${encodeURIComponent(`/organizations/${orgSlug}?claim=1`)}`;
  }

  async function handleStartClaim() {
    setError(null);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push(loginRedirect());
      return;
    }
    await loadProfileDefaults(data.user);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName,
          contact_email: contactEmail,
          role_at_org: roleAtOrg,
          message: message || undefined,
          abn: abn || undefined,
          consent_level: consentLevel || undefined,
          permitted_uses: permittedUses.length > 0 ? permittedUses : undefined,
          story_interest: storyInterest || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError('Sign in first, then you can submit the organization claim.');
          router.push(loginRedirect());
          return;
        }
        setError(data.error || 'Something went wrong');
        return;
      }

      setClaimStatus(data.status || 'pending');
      setSubmittedEmail(contactEmail || data.claim?.contact_email || null);
      setConfirmationEmailSent(Boolean(data.confirmationEmailSent));
      setShowForm(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  // Already claimed states
  if (claimStatus === 'verified') {
    return (
      <>
        <FundingWorkspaceCta
          href={fundingWorkspaceHref}
          status="verified"
          isBusinessWorkspace={isBusinessWorkspace}
        />
        <ClaimNextStepsPanel
          status="verified"
          email={submittedEmail}
          hubHref={`/hub/${orgSlug}/dashboard`}
          hubLabel="Open organization workspace"
        />
      </>
    );
  }

  if (claimStatus === 'pending') {
    return (
      <>
        <FundingWorkspaceCta
          href={fundingWorkspaceHref}
          status="pending"
          isBusinessWorkspace={isBusinessWorkspace}
        />
        <ClaimNextStepsPanel
          status="pending"
          email={submittedEmail}
          emailSent={confirmationEmailSent}
        />
      </>
    );
  }

  if (claimStatus === 'rejected') {
    return (
      <>
        <FundingWorkspaceCta
          href={fundingWorkspaceHref}
          status="rejected"
          isBusinessWorkspace={isBusinessWorkspace}
        />
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-6 py-3 font-bold border-2 border-red-300">
          Claim Not Approved
        </div>
      </>
    );
  }

  return (
    <>
      <FundingWorkspaceCta
        href={fundingWorkspaceHref}
        status={claimStatus}
        isBusinessWorkspace={isBusinessWorkspace}
      />
      {!showForm ? (
        <button
          onClick={handleStartClaim}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 font-bold border-2 border-black transition-colors"
        >
          <Shield className="w-5 h-5" />
          Claim this Organization
        </button>
      ) : (
        <div className="w-full max-w-lg bg-white border-2 border-black p-6 mt-4">
          <h3 className="text-lg font-bold mb-2">Claim this Organization</h3>
          <p className="text-sm text-earth-600 mb-4">
            This claim will be linked to your signed-in JusticeHub profile. Confirm your role so an admin can verify access.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {linkedProfile && !editingContact ? (
              <div className="border-2 border-eucalyptus-700 bg-eucalyptus-50 p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black uppercase text-eucalyptus-900">Linked profile</span>
                  <button
                    type="button"
                    onClick={() => setEditingContact(true)}
                    className="text-xs font-black text-eucalyptus-900 underline"
                  >
                    Edit contact
                  </button>
                </div>
                <div className="font-bold text-earth-900">{linkedProfile.name}</div>
                {linkedProfile.email && <div className="text-earth-700">{linkedProfile.email}</div>}
                {linkedProfile.roleTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {linkedProfile.roleTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="border border-eucalyptus-700 bg-white px-2 py-0.5 text-xs font-bold uppercase text-eucalyptus-900">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                Your Role *
              </label>
              <select
                required
                value={roleAtOrg}
                onChange={(e) => setRoleAtOrg(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select a role...</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                ABN <span className="font-normal text-earth-500">(optional)</span>
              </label>
              <input
                type="text"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="e.g. 12345678901"
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                Message <span className="font-normal text-earth-500">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Tell us about your connection to this organization..."
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Consent + visibility — you can change any of these within 14 days */}
            <div className="border-t-2 border-earth-200 pt-4 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-earth-900 mb-1">
                  How would you like your organisation to appear on the Map?
                </h4>
                <p className="text-xs text-earth-600 mb-3">
                  You can change any of these settings within fourteen days of your claim. Nothing
                  goes public until your claim is verified.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-earth-700 mb-2">
                  Consent level <span className="font-normal text-earth-500">(optional)</span>
                </label>
                <div className="space-y-2">
                  {[
                    {
                      value: 'Strictly Private',
                      label: 'Strictly Private',
                      desc: 'Listing only. No story. Contact details hidden.',
                    },
                    {
                      value: 'Public Knowledge Commons',
                      label: 'Public Knowledge Commons',
                      desc: 'Full Map entry, evidence and media links visible. The default for orgs whose data is already on the open web.',
                    },
                    {
                      value: 'Community Controlled',
                      label: 'Community Controlled',
                      desc: 'Full Map entry, but every change to your profile requires your explicit sign-off.',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex gap-3 p-3 border-2 cursor-pointer transition-colors ${
                        consentLevel === opt.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-earth-200 hover:border-earth-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="consent_level"
                        value={opt.value}
                        checked={consentLevel === opt.value}
                        onChange={(e) => setConsentLevel(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-bold text-earth-900">{opt.label}</div>
                        <div className="text-xs text-earth-600 mt-0.5">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-earth-700 mb-2">
                  Where you are happy to appear{' '}
                  <span className="font-normal text-earth-500">(tick any that apply)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: 'display_on_map', label: 'Display on the public Map' },
                    { value: 'link_to_website', label: 'Link to our website' },
                    { value: 'link_to_stories', label: 'Link to our stories' },
                    { value: 'included_in_funder_packs', label: 'Included in funder briefing packs' },
                    { value: 'contactable_by_judges', label: 'Reachable by judges and magistrates' },
                    { value: 'contactable_by_other_orgs', label: 'Reachable by other community orgs' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 p-2 border-2 border-earth-200 hover:border-earth-400 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={permittedUses.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermittedUses([...permittedUses, opt.value]);
                          } else {
                            setPermittedUses(permittedUses.filter((u) => u !== opt.value));
                          }
                        }}
                      />
                      <span className="text-xs font-semibold text-earth-800">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-earth-700 mb-2">
                  Interested in sharing a story about your work?{' '}
                  <span className="font-normal text-earth-500">(optional)</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'maybe', label: 'Maybe later' },
                    { value: 'no', label: 'No thanks' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex-1 text-center p-2 border-2 cursor-pointer transition-colors ${
                        storyInterest === opt.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-earth-200 hover:border-earth-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="story_interest"
                        value={opt.value}
                        checked={storyInterest === opt.value}
                        onChange={(e) => setStoryInterest(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-earth-800">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold border-2 border-black transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="px-6 py-2 border-2 border-black font-bold hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
