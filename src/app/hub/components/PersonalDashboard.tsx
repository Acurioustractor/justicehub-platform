'use client';

import Link from 'next/link';
import {
  Building2, Newspaper, Heart, DollarSign, Users, MapPin,
  ExternalLink, ArrowRight, Download, Share2, ChevronRight,
  Calendar, CheckCircle2, Clock, Search, Loader2, Pencil, Save, User,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TourStop } from '@/content/campaign';
import { WelcomeOnboarding } from './WelcomeOnboarding';

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  organization: { label: 'Organisation', icon: Building2, color: 'text-[#059669]' },
  media: { label: 'Media', icon: Newspaper, color: 'text-blue-500' },
  supporter: { label: 'Supporter', icon: Heart, color: 'text-pink-500' },
  funder: { label: 'Funder', icon: DollarSign, color: 'text-amber-500' },
  lived_experience: { label: 'Lived Experience', icon: Users, color: 'text-purple-500' },
};

interface CommunityCounts {
  total: number;
  organizations: number;
  media: number;
  supporters: number;
  funders: number;
  lived_experience: number;
}

interface PipelineData {
  members: number;
  orgsClaimed: number;
  fundingRecords: number;
}

interface PersonalDashboardProps {
  userName: string;
  memberType: string | null;
  userState: string;
  matchedStop: TourStop | null;
  orgSlug: string | null;
  orgName: string | null;
  orgStatus: string | null;
  communityCounts: Record<string, CommunityCounts>;
  tourStops: TourStop[];
  fundingCount: number;
  pipelineByCity: Record<string, PipelineData>;
  profileSlug: string | null;
  profileBio: string | null;
  profilePhoto: string | null;
}

export function PersonalDashboard({
  userName,
  memberType,
  userState,
  matchedStop,
  orgSlug,
  orgName,
  orgStatus,
  communityCounts,
  tourStops,
  fundingCount,
  pipelineByCity,
  profileSlug,
  profileBio,
  profilePhoto,
}: PersonalDashboardProps) {
  const roleConfig = memberType ? ROLE_CONFIG[memberType] : null;
  const RoleIcon = roleConfig?.icon || Heart;

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    preferred_name: userName,
    location: userState,
    bio: profileBio || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Org search state
  const [orgQuery, setOrgQuery] = useState('');
  const [orgResults, setOrgResults] = useState<Array<{ id: string; name: string; slug: string | null; state: string | null; city: string | null; abn: string | null; source?: 'justicehub' | 'grantscope' }>>([]);
  const [orgSearching, setOrgSearching] = useState(false);
  const [claimingOrg, setClaimingOrg] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const supabase = createClient();

  const searchOrgs = useCallback(async (query: string) => {
    if (query.length < 2) { setOrgResults([]); return; }
    setOrgSearching(true);
    try {
      // Search JusticeHub orgs first
      const { data: jhOrgs } = await supabase
        .from('organizations')
        .select('id, name, slug, state, city, abn')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .order('name')
        .limit(8);

      const results: typeof orgResults = (jhOrgs || []).map(o => ({ ...o, source: 'justicehub' as const }));
      const jhAbns = new Set(results.map(r => r.abn).filter(Boolean));

      // Fill from gs_entities if needed
      if (results.length < 8) {
        const { data: gsOrgs } = await (supabase as any)
          .from('gs_entities')
          .select('id, canonical_name, abn, state, lga_name')
          .ilike('canonical_name', `%${query}%`)
          .order('canonical_name')
          .limit(8 - results.length) as { data: Array<{ id: string; canonical_name: string; abn: string | null; state: string | null; lga_name: string | null }> | null };

        if (gsOrgs) {
          for (const gs of gsOrgs) {
            if (gs.abn && jhAbns.has(gs.abn)) continue;
            results.push({
              id: gs.id, name: gs.canonical_name, slug: null,
              state: gs.state, city: gs.lga_name, abn: gs.abn,
              source: 'grantscope' as const,
            });
          }
        }
      }

      setOrgResults(results);
    } catch { /* non-critical */ }
    finally { setOrgSearching(false); }
  }, [supabase]);

  useEffect(() => {
    const timeout = setTimeout(() => { if (orgQuery) searchOrgs(orgQuery); }, 300);
    return () => clearTimeout(timeout);
  }, [orgQuery, searchOrgs]);

  async function handleClaimOrg(org: typeof orgResults[0]) {
    setClaimingOrg(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let orgId = org.id;

      // If from GS, create in organizations table first
      if (org.source === 'grantscope') {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({
            name: org.name,
            abn: org.abn,
            state: org.state,
            city: org.city,
            is_active: true,
            type: 'community-service',
          })
          .select('id')
          .single();
        if (newOrg) orgId = newOrg.id;
      }

      await supabase.from('organization_members').insert({
        user_id: user.id,
        organization_id: orgId,
        role: 'member',
        status: 'pending',
        joined_at: new Date().toISOString(),
      });

      await supabase.from('profiles')
        .update({ primary_organization_id: orgId })
        .eq('id', user.id);

      setClaimSuccess(true);
      setOrgResults([]);
      setOrgQuery('');
    } catch (err) {
      console.error('Claim failed:', err);
    } finally {
      setClaimingOrg(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('public_profiles')
        .update({
          preferred_name: profileForm.preferred_name,
          location: profileForm.location,
          bio: profileForm.bio,
        })
        .eq('user_id', user.id);
      setEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error('Profile save failed:', err);
    } finally {
      setSavingProfile(false);
    }
  }

  const stateOptions = ['NSW', 'QLD', 'SA', 'WA', 'NT', 'VIC', 'TAS', 'ACT'];

  const totalMembers = Object.values(communityCounts).reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      {/* Top bar */}
      <div className="border-b border-[#F5F0E8]/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/contained" className="font-mono text-xs text-[#F5F0E8]/40 hover:text-[#F5F0E8]">CONTAINED</Link>
            <span className="text-[#F5F0E8]/20">/</span>
            <span className="font-mono text-xs text-[#DC2626]">HUB</span>
          </div>
          {orgSlug && (
            <Link
              href={`/hub/${orgSlug}/dashboard`}
              className="text-xs font-mono text-[#059669] hover:underline flex items-center gap-1"
            >
              {orgName} Hub <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            {roleConfig && <RoleIcon className={`w-6 h-6 ${roleConfig.color}`} />}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Welcome, {userName}
            </h1>
          </div>
          {roleConfig && (
            <p className="font-mono text-sm text-[#F5F0E8]/40">
              {roleConfig.label} member · {totalMembers} people have joined the movement
            </p>
          )}
        </div>

        {/* Welcome onboarding — shows once, dismissible */}
        <WelcomeOnboarding
          userName={userName}
          memberType={memberType}
          userState={userState}
          orgSlug={orgSlug}
          orgName={orgName}
          profileSlug={profileSlug}
        />

        {/* Role-specific hub link */}
        {memberType && memberType !== 'organization' && (
          <Link
            href={`/hub/${memberType === 'lived_experience' ? 'lived-experience' : memberType}`}
            className={`mb-6 p-4 border flex items-center justify-between transition-colors ${
              memberType === 'media' ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50' :
              memberType === 'funder' ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50' :
              memberType === 'supporter' ? 'border-pink-500/30 bg-pink-500/5 hover:border-pink-500/50' :
              'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <RoleIcon className={`w-5 h-5 ${roleConfig?.color || ''}`} />
              <div>
                <p className="font-bold text-sm">{roleConfig?.label} Hub</p>
                <p className="text-xs text-[#F5F0E8]/40 font-mono">
                  {memberType === 'media' ? 'Media intelligence, data briefings, press resources' :
                   memberType === 'funder' ? 'Funding landscape, evidence-backed programs, due diligence' :
                   memberType === 'supporter' ? 'Actions, tour events, campaign toolkit' :
                   'Community, support resources, share your story'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#F5F0E8]/30" />
          </Link>
        )}

        {/* Org status banner */}
        {orgStatus === 'pending' && orgName && (
          <div className="mb-6 p-4 border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-mono"><span className="text-amber-500">Pending:</span> Your claim on <strong>{orgName}</strong> is being verified</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your tour stop */}
            {matchedStop && (
              <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
                <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Your Tour Stop</h2>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#DC2626]" />
                      {matchedStop.city}, {matchedStop.state}
                    </h3>
                    <p className="text-sm text-[#F5F0E8]/60 mt-1">{matchedStop.partner}</p>
                    <p className="text-sm text-[#F5F0E8]/40 mt-2">{matchedStop.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono text-xs text-[#F5F0E8]/40">DATE</p>
                    <p className="font-bold text-sm">{matchedStop.date}</p>
                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono ${
                      matchedStop.status === 'confirmed' ? 'bg-[#059669]/20 text-[#059669]' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {matchedStop.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {matchedStop.status}
                    </div>
                  </div>
                </div>
                {matchedStop.partnerQuote && (
                  <p className="mt-4 text-sm italic text-[#F5F0E8]/50 border-l-2 border-[#DC2626] pl-3">
                    {matchedStop.partnerQuote}
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/contained/register`}
                    className="px-4 py-2 bg-[#DC2626] text-white text-sm font-bold hover:bg-[#DC2626]/90 transition-colors"
                  >
                    Register for Event
                  </Link>
                </div>
              </div>
            )}

            {/* Tour stop communities — THE connecting people feature */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">
                The Network Forming
              </h2>
              <p className="text-sm text-[#F5F0E8]/60 mb-4">
                People joining across tour stops — building the coalition city by city
              </p>
              <div className="space-y-3">
                {tourStops.map((stop) => {
                  const counts = communityCounts[stop.state] || { total: 0 };
                  const isYours = stop.state === userState;
                  return (
                    <div
                      key={stop.city}
                      className={`p-4 border transition-colors ${
                        isYours ? 'border-[#DC2626]/30 bg-[#DC2626]/5' : 'border-[#F5F0E8]/5 hover:border-[#F5F0E8]/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${isYours ? 'text-[#DC2626]' : 'text-[#F5F0E8]/30'}`} />
                          <h3 className="font-bold text-sm">{stop.city}</h3>
                          {isYours && <span className="text-xs font-mono text-[#DC2626]">YOUR STOP</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm font-bold">{counts.total}</span>
                          <span className="text-xs text-[#F5F0E8]/40 font-mono">members</span>
                        </div>
                      </div>
                      {counts.total > 0 && (
                        <div className="flex gap-3 text-xs font-mono text-[#F5F0E8]/40">
                          {counts.organizations > 0 && <span>{counts.organizations} orgs</span>}
                          {counts.media > 0 && <span>{counts.media} media</span>}
                          {counts.supporters > 0 && <span>{counts.supporters} supporters</span>}
                          {counts.funders > 0 && <span>{counts.funders} funders</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-[#F5F0E8]/30">{stop.partner}</p>
                        <p className="text-xs font-mono text-[#F5F0E8]/30">{stop.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Momentum — Pipeline by City */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-1 uppercase tracking-wider">Momentum</h2>
              <p className="text-sm text-[#F5F0E8]/60 mb-4">
                Pipeline progress across tour stop cities
              </p>
              <div className="space-y-3">
                {tourStops.map((stop) => {
                  const pipeline = pipelineByCity[stop.state] || { members: 0, orgsClaimed: 0, fundingRecords: 0 };
                  const isYours = stop.state === userState;
                  // Simple momentum score: weighted sum
                  const score = pipeline.members * 2 + pipeline.orgsClaimed * 5 + Math.min(pipeline.fundingRecords, 100);
                  const maxScore = 200; // rough ceiling for bar width
                  const barWidth = Math.min(100, Math.round((score / maxScore) * 100));
                  return (
                    <div
                      key={stop.city}
                      className={`p-4 border transition-colors ${
                        isYours ? 'border-[#DC2626]/30 bg-[#DC2626]/5' : 'border-[#F5F0E8]/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 ${isYours ? 'text-[#DC2626]' : 'text-[#F5F0E8]/30'}`} />
                          <h3 className="font-bold text-sm">{stop.city}</h3>
                          {isYours && <span className="text-[9px] font-mono text-[#DC2626] bg-[#DC2626]/10 px-1.5 py-0.5">YOU</span>}
                        </div>
                        <span className={`text-xs font-mono ${
                          stop.status === 'confirmed' ? 'text-[#059669]' : 'text-amber-500'
                        }`}>
                          {stop.status}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-[#F5F0E8]/5 mb-3">
                        <div
                          className={`h-full transition-all ${isYours ? 'bg-[#DC2626]' : 'bg-[#F5F0E8]/20'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold font-mono">{pipeline.members}</p>
                          <p className="text-[10px] font-mono text-[#F5F0E8]/40">members</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold font-mono">{pipeline.orgsClaimed}</p>
                          <p className="text-[10px] font-mono text-[#F5F0E8]/40">orgs</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold font-mono">{pipeline.fundingRecords > 999 ? `${(pipeline.fundingRecords / 1000).toFixed(1)}K` : pipeline.fundingRecords}</p>
                          <p className="text-[10px] font-mono text-[#F5F0E8]/40">funding</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Campaign Toolkit */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider">Campaign Toolkit</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/contained/tour/social"
                  className="p-4 border border-[#F5F0E8]/10 hover:border-[#F5F0E8]/20 transition-colors flex items-center gap-3"
                >
                  <Share2 className="w-5 h-5 text-[#F5F0E8]/30" />
                  <div>
                    <p className="font-bold text-sm">Social Kit</p>
                    <p className="text-xs text-[#F5F0E8]/40 font-mono">Posts, images, hashtags</p>
                  </div>
                </Link>
                <Link
                  href="/contained/act"
                  className="p-4 border border-[#F5F0E8]/10 hover:border-[#F5F0E8]/20 transition-colors flex items-center gap-3"
                >
                  <ExternalLink className="w-5 h-5 text-[#F5F0E8]/30" />
                  <div>
                    <p className="font-bold text-sm">Take Action</p>
                    <p className="text-xs text-[#F5F0E8]/40 font-mono">Write to your MP, share the tour</p>
                  </div>
                </Link>
                <Link
                  href="/contained/register"
                  className="p-4 border border-[#F5F0E8]/10 hover:border-[#F5F0E8]/20 transition-colors flex items-center gap-3"
                >
                  <Calendar className="w-5 h-5 text-[#F5F0E8]/30" />
                  <div>
                    <p className="font-bold text-sm">Register for Events</p>
                    <p className="text-xs text-[#F5F0E8]/40 font-mono">Tour stop dates and venues</p>
                  </div>
                </Link>
                <Link
                  href="/contained"
                  className="p-4 border border-[#F5F0E8]/10 hover:border-[#F5F0E8]/20 transition-colors flex items-center gap-3"
                >
                  <Download className="w-5 h-5 text-[#F5F0E8]/30" />
                  <div>
                    <p className="font-bold text-sm">Campaign Page</p>
                    <p className="text-xs text-[#F5F0E8]/40 font-mono">Full campaign overview</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Profile */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider">Your Profile</h2>
                {!editingProfile ? (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-xs font-mono text-[#F5F0E8]/40 hover:text-[#F5F0E8] flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="text-xs font-mono text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!editingProfile ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#F5F0E8]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#F5F0E8]/30" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{profileSaved ? profileForm.preferred_name : userName}</p>
                      {roleConfig && (
                        <p className={`text-xs font-mono ${roleConfig.color}`}>{roleConfig.label}</p>
                      )}
                    </div>
                  </div>
                  {(profileSaved ? profileForm.location : userState) && (
                    <p className="text-xs text-[#F5F0E8]/50 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {profileSaved ? profileForm.location : userState}
                    </p>
                  )}
                  {(profileSaved ? profileForm.bio : profileBio) && (
                    <p className="text-xs text-[#F5F0E8]/40 line-clamp-2">
                      {profileSaved ? profileForm.bio : profileBio}
                    </p>
                  )}
                  {profileSlug && (
                    <Link
                      href={`/people/${profileSlug}/edit`}
                      className="block text-xs font-mono text-[#DC2626] hover:underline mt-2"
                    >
                      Full profile settings →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-[#F5F0E8]/40 uppercase">Name</label>
                    <input
                      type="text"
                      value={profileForm.preferred_name}
                      onChange={(e) => setProfileForm(f => ({ ...f, preferred_name: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#F5F0E8]/40 uppercase">State</label>
                    <select
                      value={profileForm.location}
                      onChange={(e) => setProfileForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm"
                    >
                      <option value="">Select state</option>
                      {stateOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#F5F0E8]/40 uppercase">Bio</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm resize-none"
                      placeholder="Tell the network about yourself..."
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full py-2 bg-[#DC2626] text-white text-sm font-bold hover:bg-[#DC2626]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              )}

              {profileSaved && !editingProfile && (
                <p className="text-xs font-mono text-[#059669] mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Profile updated
                </p>
              )}
            </div>

            {/* Claim Org (if no org yet) */}
            {!orgSlug && !claimSuccess && memberType === 'organization' && (
              <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
                <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Claim Your Organisation</h2>
                <p className="text-xs text-[#F5F0E8]/50 mb-3">
                  Find your org to unlock funding data, connections, and grants
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-[#F5F0E8]/30" />
                  <input
                    type="text"
                    value={orgQuery}
                    onChange={(e) => setOrgQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F0E8]/5 border border-[#F5F0E8]/20 text-[#F5F0E8] focus:outline-none focus:border-[#DC2626] font-mono text-sm"
                    placeholder="Search organisations..."
                  />
                  {orgSearching && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-[#F5F0E8]/30" />}
                </div>
                {orgResults.length > 0 && (
                  <div className="mt-1 border border-[#F5F0E8]/10 divide-y divide-[#F5F0E8]/5 max-h-48 overflow-y-auto">
                    {orgResults.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleClaimOrg(org)}
                        disabled={claimingOrg}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F5F0E8]/5 transition-colors"
                      >
                        <p className="font-bold text-xs text-[#F5F0E8]">
                          {org.name}
                          {org.source === 'grantscope' && <span className="ml-1.5 text-[9px] font-mono text-blue-400 bg-blue-400/10 px-1 py-0.5">ABR</span>}
                        </p>
                        <p className="text-[10px] text-[#F5F0E8]/40 font-mono">
                          {org.abn ? `ABN ${org.abn}` : ''}
                          {(org.city || org.state) ? `${org.abn ? ' · ' : ''}${[org.city, org.state].filter(Boolean).join(', ')}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {claimSuccess && (
              <div className="border border-[#059669]/30 bg-[#059669]/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                  <h2 className="font-bold text-sm">Organisation Claimed</h2>
                </div>
                <p className="text-xs text-[#F5F0E8]/50 font-mono">
                  Pending verification. You&apos;ll get full hub access once confirmed.
                </p>
              </div>
            )}

            {/* Org hub link */}
            {orgSlug && (
              <Link
                href={`/hub/${orgSlug}/dashboard`}
                className="block border border-[#059669]/30 bg-[#059669]/5 p-5 hover:border-[#059669]/50 transition-colors"
              >
                <h2 className="font-mono text-xs text-[#059669] mb-2 uppercase tracking-wider">Organisation Hub</h2>
                <p className="font-bold">{orgName}</p>
                <p className="text-xs text-[#F5F0E8]/40 font-mono mt-1 flex items-center gap-1">
                  Dashboard, grants, compliance <ChevronRight className="w-3 h-3" />
                </p>
              </Link>
            )}

            {/* Regional Funding */}
            {fundingCount > 0 && userState && (
              <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
                <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">
                  Funding in {userState}
                </h2>
                <p className="text-2xl font-bold">{fundingCount.toLocaleString()}</p>
                <p className="text-xs text-[#F5F0E8]/40 font-mono mt-1">funding records tracked</p>
                <Link
                  href={`/justice-funding?state=${userState}`}
                  className="block mt-3 text-xs text-[#DC2626] font-mono hover:underline"
                >
                  Explore funding data →
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-5">
              <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-3 uppercase tracking-wider">Quick Links</h2>
              <div className="space-y-2">
                <Link href="/intelligence" className="block text-sm hover:text-[#DC2626] transition-colors">
                  ALMA Evidence Platform →
                </Link>
                <Link href="/justice-funding" className="block text-sm hover:text-[#DC2626] transition-colors">
                  Funding Explorer →
                </Link>
                <Link href="/organizations" className="block text-sm hover:text-[#DC2626] transition-colors">
                  Organisation Directory →
                </Link>
                <Link href="/stories" className="block text-sm hover:text-[#DC2626] transition-colors">
                  Stories →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
