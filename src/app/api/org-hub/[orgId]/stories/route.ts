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

    // Fetch all articles for this org
    const { data: articles, error } = await serviceClient
      .from('articles')
      .select('id, title, slug, excerpt, status, category, tags, published_at, created_at, reading_time_minutes, featured_image_url')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch all program links for these articles
    const articleIds = (articles || []).map(a => a.id);
    let programLinks: { article_id: string; program_id: string }[] = [];
    if (articleIds.length > 0) {
      const { data: links } = await serviceClient
        .from('article_related_programs')
        .select('article_id, program_id')
        .in('article_id', articleIds);
      programLinks = (links || []).filter((l): l is { article_id: string; program_id: string } => l.article_id != null && l.program_id != null);
    }

    // Fetch program names for linked programs
    const programIds = [...new Set(programLinks.map(l => l.program_id))];
    let programMap: Record<string, string> = {};
    if (programIds.length > 0) {
      const { data: programs } = await serviceClient
        .from('registered_services')
        .select('id, name')
        .in('id', programIds);
      programMap = Object.fromEntries((programs || []).map(p => [p.id, p.name]));
    }

    // Enrich articles with linked programs
    const enriched = (articles || []).map(article => ({
      ...article,
      linkedPrograms: programLinks
        .filter(l => l.article_id === article.id)
        .map(l => ({ id: l.program_id, name: programMap[l.program_id] || 'Unknown' })),
    }));

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
