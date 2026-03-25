'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Newspaper, Heart, DollarSign, Users,
  Loader2, ArrowLeft, MapPin, Search, Check, ChevronRight,
} from 'lucide-react';

const supabase = createClient();

const STATES = [
  { value: 'NSW', label: 'New South Wales', tourCity: 'Sydney' },
  { value: 'QLD', label: 'Queensland', tourCity: 'Brisbane' },
  { value: 'SA', label: 'South Australia', tourCity: 'Adelaide' },
  { value: 'WA', label: 'Western Australia', tourCity: 'Perth' },
  { value: 'NT', label: 'Northern Territory', tourCity: 'Alice Springs' },
  { value: 'VIC', label: 'Victoria', tourCity: 'Melbourne' },
  { value: 'ACT', label: 'Australian Capital Territory', tourCity: 'Canberra' },
  { value: 'TAS', label: 'Tasmania', tourCity: 'Hobart' },
] as const;

const MEMBER_ROLES = [
  {
    value: 'organization',
    label: 'Organisation',
    icon: Building2,
    description: 'Bring CONTAINED to your young people, find funding, connect with the network',
    tagline: 'Service provider, community org, or youth program',
  },
  {
    value: 'media',
    label: 'Media',
    icon: Newspaper,
    description: 'Get press kits, event access, story angles, and the image library',
    tagline: 'Journalist, outlet, or content creator',
  },
  {
    value: 'supporter',
    label: 'Supporter',
    icon: Heart,
    description: 'Campaign updates, ways to help, local event info, and share toolkit',
    tagline: 'Individual who cares about youth justice',
  },
  {
    value: 'funder',
    label: 'Funder',
    icon: DollarSign,
    description: 'Cost-benefit evidence, intervention data, funding gaps, and impact metrics',
    tagline: 'Philanthropist, foundation, or government funder',
  },
  {
    value: 'lived_experience',
    label: 'Lived Experience',
    icon: Users,
    description: 'Share your story, find support, and shape the campaign from the inside',
    tagline: 'Young person, family member, or community Elder',
  },
] as const;

type MemberRole = typeof MEMBER_ROLES[number]['value'];
type Step = 'role' | 'account' | 'profile' | 'complete';

interface OrgResult {
  id: string;
  name: string;
  slug: string | null;
  state: string | null;
  city: string | null;
  abn: string | null;
  source?: 'justicehub' | 'grantscope';
}

async function syncWithGHL(data: {
  user_id: string;
  email: string;
  full_name: string;
  preferred_name?: string;
  is_steward: boolean;
  newsletter?: boolean;
  source?: string;
  organization?: string;
  member_type?: string;
  state?: string;
}) {
  try {
    const response = await fetch('/api/ghl/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.warn('GHL sync warning:', await response.json());
    }
  } catch (err) {
    console.warn('GHL sync failed (non-blocking):', err);
  }
}

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetRole = searchParams.get('role') as MemberRole | null;
  const tourStop = searchParams.get('tour_stop');

  const [step, setStep] = useState<Step>(presetRole ? 'account' : 'role');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Role
  const [memberRole, setMemberRole] = useState<MemberRole | ''>(presetRole || '');

  // Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [state, setState] = useState(tourStop ? STATES.find(s => s.tourCity.toLowerCase() === tourStop)?.value || '' : '');
  const [newsletter, setNewsletter] = useState(true);

  // Org search (for organization role)
  const [orgQuery, setOrgQuery] = useState('');
  const [orgResults, setOrgResults] = useState<OrgResult[]>([]);
  const [orgSearching, setOrgSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(null);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && step === 'account') {
        setStep('profile');
      }
    });
  }, [step]);

  // Debounced org search — searches organizations first, then gs_entities for full 566K coverage
  const searchOrgs = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOrgResults([]);
      return;
    }
    setOrgSearching(true);
    try {
      // Search JusticeHub organizations first (22K)
      const { data: jhOrgs } = await supabase
        .from('organizations')
        .select('id, name, slug, state, city, abn')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .order('name')
        .limit(8);

      const results: OrgResult[] = (jhOrgs || []).map(o => ({ ...o, source: 'justicehub' as const }));
      const jhAbns = new Set(results.map(r => r.abn).filter(Boolean));

      // If fewer than 8 results, fill from gs_entities (566K)
      if (results.length < 8) {
        const { data: gsOrgs } = await (supabase as any)
          .from('gs_entities')
          .select('id, canonical_name, abn, state, lga_name, sector')
          .ilike('canonical_name', `%${query}%`)
          .order('canonical_name')
          .limit(8 - results.length) as { data: Array<{ id: string; canonical_name: string; abn: string | null; state: string | null; lga_name: string | null; sector: string | null }> | null };

        if (gsOrgs) {
          for (const gs of gsOrgs) {
            if (gs.abn && jhAbns.has(gs.abn)) continue;
            results.push({
              id: gs.id,
              name: gs.canonical_name,
              slug: null,
              state: gs.state,
              city: gs.lga_name,
              abn: gs.abn,
              source: 'grantscope' as const,
            });
          }
        }
      }

      setOrgResults(results);
    } catch {
      // Non-critical
    } finally {
      setOrgSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (orgQuery) searchOrgs(orgQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [orgQuery, searchOrgs]);

  async function handleAccountCreation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/contained/join?role=${memberRole}&step=profile`,
        },
      });
      if (error) throw error;
      setStep('profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileCreation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated. Please go back and create your account.');

      // Generate slug
      let slug = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: existing } = await supabase
        .from('public_profiles')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (existing) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Role tag for this member type
      const roleTag = `contained_${memberRole}`;

      // Create auth profile
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          display_name: preferredName || fullName,
          email: user.email,
        })
        .select()
        .single();

      // Create public profile
      await supabase
        .from('public_profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          preferred_name: preferredName || null,
          slug,
          email: user.email,
          role_tags: [roleTag],
          location: state || null,
          current_organization: selectedOrg?.name || null,
          is_public: false,
          is_featured: false,
        })
        .select()
        .single();

      // If org selected, claim it
      if (selectedOrg) {
        let orgId = selectedOrg.id;

        // If from GS (not in organizations table), create the org first
        if (selectedOrg.source === 'grantscope') {
          const { data: newOrg } = await supabase
            .from('organizations')
            .insert({
              name: selectedOrg.name,
              abn: selectedOrg.abn,
              state: selectedOrg.state,
              city: selectedOrg.city,
              is_active: true,
              type: 'community-service',
            })
            .select('id')
            .single();
          if (newOrg) orgId = newOrg.id;
        }

        await supabase
          .from('organization_members')
          .insert({
            user_id: user.id,
            organization_id: orgId,
            role: 'member',
            status: 'pending',
            joined_at: new Date().toISOString(),
          });

        // Set primary org
        await supabase
          .from('profiles')
          .update({ primary_organization_id: orgId })
          .eq('id', user.id);
      }

      // GHL sync (non-blocking)
      syncWithGHL({
        user_id: user.id,
        email: user.email || email,
        full_name: fullName,
        preferred_name: preferredName,
        is_steward: false,
        newsletter,
        source: 'CONTAINED Campaign Join',
        organization: selectedOrg?.name,
        member_type: memberRole,
        state,
      });

      setStep('complete');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedRoleInfo = MEMBER_ROLES.find(r => r.value === memberRole);
  const matchedTourStop = STATES.find(s => s.value === state);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-[#F5F0E8]/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/contained" className="flex items-center gap-2 text-[#F5F0E8]/60 hover:text-[#F5F0E8] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-mono">CONTAINED</span>
          </Link>
          <div className="flex items-center gap-2">
            {(['role', 'account', 'profile', 'complete'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === s ? 'bg-[#DC2626]' : i < ['role', 'account', 'profile', 'complete'].indexOf(step) ? 'bg-[#059669]' : 'bg-[#F5F0E8]/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* STEP 1: Role Picker */}
        {step === 'role' && (
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Join the movement
            </h1>
            <p className="text-[#F5F0E8]/60 mb-8 font-mono text-sm">
              How do you want to be part of CONTAINED?
            </p>

            <div className="space-y-3">
              {MEMBER_ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = memberRole === role.value;
                return (
                  <button
                    key={role.value}
                    onClick={() => setMemberRole(role.value)}
                    className={`w-full text-left p-4 sm:p-5 border transition-all ${
                      isSelected
                        ? 'border-[#DC2626] bg-[#DC2626]/10'
                        : 'border-[#F5F0E8]/10 hover:border-[#F5F0E8]/30 bg-[#F5F0E8]/[0.02]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 ${isSelected ? 'bg-[#DC2626]/20' : 'bg-[#F5F0E8]/5'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#DC2626]' : 'text-[#F5F0E8]/40'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">{role.label}</h3>
                          {isSelected && <Check className="w-5 h-5 text-[#DC2626]" />}
                        </div>
                        <p className="text-sm text-[#F5F0E8]/40 font-mono mt-0.5">{role.tagline}</p>
                        <p className="text-sm text-[#F5F0E8]/70 mt-2">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (memberRole) setStep('account');
              }}
              disabled={!memberRole}
              className="w-full mt-8 px-6 py-4 bg-[#DC2626] text-white font-bold text-lg hover:bg-[#DC2626]/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>

            <p className="text-center text-sm text-[#F5F0E8]/40 mt-6">
              Already have an account?{' '}
              <Link href="/login?redirect=/hub" className="text-[#DC2626] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}

        {/* STEP 2: Account Creation */}
        {step === 'account' && (
          <div>
            <button onClick={() => setStep('role')} className="text-sm text-[#F5F0E8]/40 hover:text-[#F5F0E8] mb-6 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>

            {selectedRoleInfo && (
              <div className="flex items-center gap-3 mb-6 p-3 border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02]">
                <selectedRoleInfo.icon className="w-5 h-5 text-[#DC2626]" />
                <span className="font-mono text-sm">Joining as <span className="text-[#DC2626]">{selectedRoleInfo.label}</span></span>
              </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Create your account
            </h1>
            <p className="text-[#F5F0E8]/60 mb-8 font-mono text-sm">
              Your JusticeHub account — one platform for the whole movement
            </p>

            {error && (
              <div className="bg-[#DC2626]/10 border border-[#DC2626] text-[#DC2626] px-4 py-3 mb-6 font-mono text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAccountCreation} className="space-y-5">
              <div>
                <label className="block font-bold mb-2 text-sm">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-2 text-sm">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <p className="text-xs text-[#F5F0E8]/40 mt-1 font-mono">At least 8 characters</p>
              </div>
              <div>
                <label className="block font-bold mb-2 text-sm">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-[#DC2626] text-white font-bold text-lg hover:bg-[#DC2626]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ChevronRight className="w-5 h-5" /></>}
              </button>
            </form>

            <p className="text-center text-sm text-[#F5F0E8]/40 mt-6">
              Already have an account?{' '}
              <Link href="/login?redirect=/hub" className="text-[#DC2626] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}

        {/* STEP 3: Profile + Org Claim */}
        {step === 'profile' && (
          <div>
            <button onClick={() => setStep('account')} className="text-sm text-[#F5F0E8]/40 hover:text-[#F5F0E8] mb-6 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>

            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Your details
            </h1>
            <p className="text-[#F5F0E8]/60 mb-8 font-mono text-sm">
              Tell us about yourself so we can connect you to what matters
            </p>

            {error && (
              <div className="bg-[#DC2626]/10 border border-[#DC2626] text-[#DC2626] px-4 py-3 mb-6 font-mono text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleProfileCreation} className="space-y-5">
              <div>
                <label className="block font-bold mb-2 text-sm">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-2 text-sm">Preferred Name</label>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono"
                  placeholder="What should we call you?"
                />
              </div>

              <div>
                <label className="block font-bold mb-2 text-sm">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Your State *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono"
                  required
                >
                  <option value="" className="bg-[#0A0A0A]">Select your state</option>
                  {STATES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-[#0A0A0A]">
                      {s.label}
                    </option>
                  ))}
                </select>
                {matchedTourStop && ['NSW', 'QLD', 'SA', 'WA', 'NT'].includes(state) && (
                  <p className="text-xs text-[#059669] mt-2 font-mono">
                    CONTAINED is coming to {matchedTourStop.tourCity}
                  </p>
                )}
              </div>

              {/* Org search for organization role */}
              {memberRole === 'organization' && (
                <div>
                  <label className="block font-bold mb-2 text-sm">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Find Your Organisation
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#F5F0E8]/30" />
                    <input
                      type="text"
                      value={orgQuery}
                      onChange={(e) => {
                        setOrgQuery(e.target.value);
                        setSelectedOrg(null);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono"
                      placeholder="Search 22,000+ organisations..."
                    />
                    {orgSearching && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-[#F5F0E8]/30" />}
                  </div>

                  {selectedOrg && (
                    <div className="mt-2 p-3 border border-[#059669] bg-[#059669]/10 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-[#F5F0E8]">{selectedOrg.name}</p>
                        <p className="text-xs text-[#F5F0E8]/60 font-mono">
                          {selectedOrg.abn ? `ABN ${selectedOrg.abn}` : 'No ABN on file'}
                          {selectedOrg.city || selectedOrg.state ? ` · ${[selectedOrg.city, selectedOrg.state].filter(Boolean).join(', ')}` : ''}
                        </p>
                      </div>
                      <Check className="w-5 h-5 text-[#059669]" />
                    </div>
                  )}

                  {!selectedOrg && orgResults.length > 0 && (
                    <div className="mt-1 border border-[#F5F0E8]/10 divide-y divide-[#F5F0E8]/5 max-h-60 overflow-y-auto">
                      {orgResults.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => {
                            setSelectedOrg(org);
                            setOrgQuery(org.name);
                            setOrgResults([]);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[#F5F0E8]/5 transition-colors"
                        >
                          <p className="font-bold text-sm text-[#F5F0E8]">
                            {org.name}
                            {org.source === 'grantscope' && <span className="ml-2 text-[10px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5">ABR</span>}
                          </p>
                          <p className="text-xs text-[#F5F0E8]/50 font-mono">
                            {org.abn ? `ABN ${org.abn}` : 'No ABN on file'}
                            {org.city || org.state ? ` · ${[org.city, org.state].filter(Boolean).join(', ')}` : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {orgQuery.length >= 2 && !orgSearching && orgResults.length === 0 && !selectedOrg && (
                    <p className="text-xs text-[#F5F0E8]/40 mt-2 font-mono">
                      No organisations found. You can still join and add your org later.
                    </p>
                  )}
                </div>
              )}

              {/* Newsletter */}
              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-[#DC2626]"
                />
                <div>
                  <span className="font-medium text-sm">Get campaign updates</span>
                  <p className="text-xs text-[#F5F0E8]/40 mt-1 font-mono">
                    Tour dates, coalition news, and ways to help in your state
                  </p>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || !fullName || !state}
                className="w-full px-6 py-4 bg-[#DC2626] text-white font-bold text-lg hover:bg-[#DC2626]/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join CONTAINED'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#059669]/20 border border-[#059669] mx-auto mb-6 flex items-center justify-center">
              <Check className="w-8 h-8 text-[#059669]" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {"You're in"}
            </h1>
            <p className="text-[#F5F0E8]/60 font-mono text-sm mb-8 max-w-md mx-auto">
              Welcome to the movement. {matchedTourStop && ['NSW', 'QLD', 'SA', 'WA', 'NT'].includes(state)
                ? `CONTAINED is coming to ${matchedTourStop.tourCity} — we'll keep you connected.`
                : "We'll keep you connected as the tour unfolds."
              }
            </p>

            {selectedOrg && (
              <div className="mb-8 p-4 border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] text-left max-w-md mx-auto">
                <p className="font-mono text-xs text-[#F5F0E8]/40 mb-1">ORGANISATION CLAIMED</p>
                <p className="font-bold">{selectedOrg.name}</p>
                <p className="text-xs text-[#F5F0E8]/40 font-mono mt-1">
                  Pending verification. You&apos;ll get full access once confirmed.
                </p>
              </div>
            )}

            <div className="space-y-3 max-w-md mx-auto">
              <button
                onClick={() => router.push('/hub')}
                className="w-full px-6 py-4 bg-[#DC2626] text-white font-bold text-lg hover:bg-[#DC2626]/90 transition-colors"
              >
                Go to your Hub
              </button>
              <button
                onClick={() => router.push('/contained')}
                className="w-full px-6 py-3 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 hover:text-[#F5F0E8] hover:border-[#F5F0E8]/40 transition-colors font-mono text-sm"
              >
                Back to CONTAINED
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5F0E8]/30" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
