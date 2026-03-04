import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

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

    // Transform to flat response
    const data = (links || [])
      .filter(l => l.public_profiles)
      .map(l => {
        const profile = l.public_profiles as any;
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
            bio: profile.bio,
            photo_url: profile.photo_url,
            role_tags: profile.role_tags,
            is_public: profile.is_public ?? true,
            is_featured: profile.is_featured ?? false,
            location: profile.location,
            empathy_ledger_profile_id: profile.empathy_ledger_profile_id,
            synced_from_empathy_ledger: profile.synced_from_empathy_ledger ?? false,
            last_synced_at: profile.last_synced_at,
          },
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
