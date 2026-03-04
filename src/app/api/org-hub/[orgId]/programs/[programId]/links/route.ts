import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!await checkOrgAccess(supabase, user.id, params.orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const serviceClient = createServiceClient();

    // Fetch linked stories via article_related_programs
    const { data: storyLinks } = await serviceClient
      .from('article_related_programs')
      .select('article_id')
      .eq('program_id', params.programId);

    let stories: any[] = [];
    if (storyLinks && storyLinks.length > 0) {
      const articleIds = storyLinks.map(l => l.article_id).filter((id): id is string => id != null);
      const { data } = await serviceClient
        .from('articles')
        .select('id, title, slug, status')
        .in('id', articleIds);
      stories = data || [];
    }

    // Fetch linked people via community_programs_profiles
    const { data: peopleLinks } = await (serviceClient as any)
      .from('community_programs_profiles')
      .select('public_profile_id, role')
      .eq('community_program_id', params.programId);

    let people: any[] = [];
    if (peopleLinks && peopleLinks.length > 0) {
      const profileIds = (peopleLinks as any[]).map((l: any) => l.public_profile_id).filter(Boolean) as string[];
      if (profileIds.length > 0) {
        const { data } = await serviceClient
          .from('public_profiles')
          .select('id, full_name, slug, photo_url')
          .in('id', profileIds);
        // Merge roles
        people = (data || []).map(p => ({
          ...p,
          role: (peopleLinks as any[]).find((l: any) => l.public_profile_id === p.id)?.role || null,
        }));
      }
    }

    return NextResponse.json({ stories, people });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string; programId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!await checkOrgAccess(supabase, user.id, params.orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const serviceClient = createServiceClient();
    const { type, targetId, role } = await request.json();

    if (type === 'story') {
      // Link story to program via article_related_programs
      const { error } = await serviceClient
        .from('article_related_programs')
        .insert({
          article_id: targetId,
          program_id: params.programId,
        });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Return the story data
      const { data: story } = await serviceClient
        .from('articles')
        .select('id, title, slug, status')
        .eq('id', targetId)
        .single();

      return NextResponse.json({ data: story });
    }

    if (type === 'person') {
      // Link person to program — check if the join table exists
      // community_programs_profiles_v is a view; find the underlying table
      const { error } = await (serviceClient as any)
        .from('community_programs_profiles')
        .insert({
          community_program_id: params.programId,
          public_profile_id: targetId,
          role: role || 'Team Member',
        });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const { data: person } = await serviceClient
        .from('public_profiles')
        .select('id, full_name, slug, photo_url')
        .eq('id', targetId)
        .single();

      return NextResponse.json({ data: { ...person, role: role || 'Team Member' } });
    }

    return NextResponse.json({ error: 'Invalid link type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
