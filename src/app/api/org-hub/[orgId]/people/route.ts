import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getEmpathyLedgerClient() {
  const url = process.env.EMPATHY_LEDGER_URL;
  const key = process.env.EMPATHY_LEDGER_API_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const serviceClient = createServiceClient();

    // Fetch org-profile links with nested profile data
    const { data: links, error } = await serviceClient
      .from('organizations_profiles')
      .select(`
        id,
        role,
        role_description,
        is_current,
        is_featured,
        display_order,
        public_profiles (
          id, full_name, slug, preferred_name, bio, photo_url,
          role_tags, is_public, is_featured, location,
          empathy_ledger_profile_id, synced_from_empathy_ledger, last_synced_at
        )
      `)
      .eq('organization_id', orgId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get all profile IDs to fetch program links
    const profileIds = (links || [])
      .map(l => (l.public_profiles as any)?.id)
      .filter(Boolean);

    // Fetch program links for all profiles
    let programLinks: { public_profile_id: string; program_id: string; program_name: string }[] = [];
    if (profileIds.length > 0) {
      const { data: cpLinks } = await (serviceClient as any)
        .from('community_programs_profiles')
        .select('public_profile_id, community_program_id')
        .in('public_profile_id', profileIds);

      if (cpLinks && cpLinks.length > 0) {
        const progIds = [...new Set(cpLinks.map((l: any) => l.community_program_id))] as string[];
        const { data: progs } = await serviceClient
          .from('registered_services')
          .select('id, name')
          .in('id', progIds);
        const progMap = Object.fromEntries((progs || []).map(p => [p.id, p.name]));

        programLinks = cpLinks.map((l: any) => ({
          public_profile_id: l.public_profile_id,
          program_id: l.community_program_id,
          program_name: progMap[l.community_program_id] || 'Unknown',
        }));
      }
    }

    // Fetch EL enrichment via Content Hub API + direct DB for avatars
    const elEnrichmentMap: Record<string, any> = {};
    const elClient = getEmpathyLedgerClient();
    const allElProfileIds = (links || [])
      .map(l => (l.public_profiles as any)?.empathy_ledger_profile_id)
      .filter(Boolean);

    if (allElProfileIds.length > 0) {
      // Get org's EL project slug for Content Hub API
      const { data: org } = await serviceClient
        .from('organizations')
        .select('empathy_ledger_org_id, slug')
        .eq('id', orgId)
        .single();

      // Fetch enriched storyteller data from Content Hub API
      const elApiKey = process.env.EMPATHY_LEDGER_API_KEY || '';
      const elApiBase = 'https://empathy-ledger-v2.vercel.app/api/v1/content-hub';
      const projectSlug = org?.slug || 'bg-fit'; // fallback

      let chStorytellers: any[] = [];
      try {
        const res = await fetch(`${elApiBase}/storytellers?project=${projectSlug}&limit=50`, {
          headers: { 'X-API-Key': elApiKey },
        });
        if (res.ok) {
          const json = await res.json();
          chStorytellers = json.storytellers || [];
        }
      } catch (e) {
        // Content Hub API unavailable, fall through
      }

      // Also fetch avatars from direct DB (Content Hub doesn't return avatar URLs)
      const avatarMap: Record<string, string> = {};
      if (elClient) {
        const { data: elStorytellers } = await elClient
          .from('storytellers')
          .select('id, public_avatar_url, bio, cultural_background, is_elder, location')
          .in('id', allElProfileIds);
        for (const s of elStorytellers || []) {
          avatarMap[s.id] = s.public_avatar_url || '';
          // Seed enrichment from DB for fields Content Hub might not have
          elEnrichmentMap[s.id] = {
            avatar_url: s.public_avatar_url,
            bio: s.bio,
            cultural_background: s.cultural_background,
            is_elder: s.is_elder,
            location: s.location,
            themes: [],
            quotes: [],
            transcript_count: 0,
            story_count: 0,
          };
        }
      }

      // Merge Content Hub enrichment (themes, quotes, transcript counts)
      for (const ch of chStorytellers) {
        // Match by display name to EL profile ID
        const matchedLink = (links || []).find(l => {
          const p = l.public_profiles as any;
          return p?.empathy_ledger_profile_id && (
            ch.displayName?.toLowerCase().trim() === p.full_name?.toLowerCase().trim() ||
            ch.id === p.empathy_ledger_profile_id
          );
        });
        const elId = (matchedLink?.public_profiles as any)?.empathy_ledger_profile_id;
        if (!elId) continue;

        const existing = elEnrichmentMap[elId] || {};
        elEnrichmentMap[elId] = {
          ...existing,
          avatar_url: existing.avatar_url || avatarMap[elId] || ch.avatarUrl,
          bio: existing.bio || ch.bio,
          is_elder: existing.is_elder ?? ch.elderStatus,
          themes: (ch.themes || []).map((t: string) => ({ name: t, count: 1 })),
          quotes: (ch.quotes || []).slice(0, 3).map((q: any) => ({
            text: q.text,
            context: q.context,
            impactScore: q.impactScore,
          })),
          transcript_count: ch.transcriptCount || 0,
          story_count: ch.storyCount || 0,
        };
      }
    }

    // Transform to flat response
    const data = (links || [])
      .filter(l => l.public_profiles)
      .map(l => {
        const profile = l.public_profiles as any;
        const elId = profile.empathy_ledger_profile_id;
        const elData = elId ? elEnrichmentMap[elId] : null;
        const photoUrl = profile.photo_url || elData?.avatar_url || null;
        return {
          link_id: l.id,
          role: l.role,
          role_description: l.role_description,
          is_current: l.is_current ?? true,
          is_featured: l.is_featured ?? false,
          display_order: l.display_order ?? 0,
          profile: {
            id: profile.id,
            full_name: profile.full_name,
            slug: profile.slug,
            preferred_name: profile.preferred_name,
            bio: profile.bio || elData?.bio || null,
            photo_url: photoUrl,
            role_tags: profile.role_tags,
            is_public: profile.is_public ?? true,
            is_featured: profile.is_featured ?? false,
            location: profile.location || elData?.location || null,
            empathy_ledger_profile_id: elId,
            synced_from_empathy_ledger: profile.synced_from_empathy_ledger ?? false,
            last_synced_at: profile.last_synced_at,
          },
          elEnrichment: elData ? {
            themes: elData.themes,
            quotes: elData.quotes,
            cultural_background: elData.cultural_background,
            is_elder: elData.is_elder,
            transcript_count: elData.transcript_count || 0,
            story_count: elData.story_count || 0,
          } : null,
          linkedPrograms: programLinks
            .filter(pl => pl.public_profile_id === profile.id)
            .map(pl => ({ id: pl.program_id, name: pl.program_name })),
        };
      });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const { full_name, preferred_name, role, role_description, person_type, bio, location, is_public, is_featured } = body;

    if (!full_name?.trim()) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Create slug from name
    const slug = full_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check for existing slug
    const { data: existing } = await serviceClient
      .from('public_profiles')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    // Create public profile
    const { data: profile, error: profileError } = await serviceClient
      .from('public_profiles')
      .insert({
        full_name: full_name.trim(),
        slug: finalSlug,
        preferred_name: preferred_name?.trim() || null,
        bio: bio?.trim() || null,
        location: location?.trim() || null,
        role_tags: person_type ? [person_type] : [],
        is_public: is_public ?? true,
        is_featured: is_featured ?? false,
      })
      .select('id, full_name, slug')
      .single();

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    // Create organization link
    const { error: linkError } = await serviceClient
      .from('organizations_profiles')
      .insert({
        organization_id: orgId,
        public_profile_id: profile.id,
        role: role?.trim() || person_type || null,
        role_description: role_description?.trim() || null,
        is_current: true,
        is_featured: is_featured ?? false,
      });

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

    return NextResponse.json({ data: profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
