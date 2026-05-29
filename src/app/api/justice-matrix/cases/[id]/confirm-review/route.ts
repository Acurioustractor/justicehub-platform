import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

/**
 * POST /api/justice-matrix/cases/[id]/confirm-review
 *
 * Pro bono legal-review sign-off, second step of dual-control, for cases that
 * are already live in the matrix (AI-extracted, human_confirmed=false). A human
 * reviewer confirms the facts, which clears the amber "AI-extracted, unconfirmed"
 * badge by setting human_confirmed=true + verified=true.
 *
 * This mirrors the discovered-route confirm_review action but addresses a case
 * directly by id, because bulk-promoted cases are not linked back to a discovery.
 *
 * Guards (enforced here, not in the DB):
 *   1. Admin only.
 *   2. Official-source citation required — cannot sign off a case with a null
 *      authoritative_link, since the source of record is what review verifies
 *      against.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: { reviewed_by?: string; review_notes?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }
  if (!body.reviewed_by) {
    return NextResponse.json({ success: false, error: 'reviewed_by is required' }, { status: 400 });
  }

  const supabase = getDb();

  const existing = await supabase
    .from('justice_matrix_cases')
    .select('id, authoritative_link, human_confirmed')
    .eq('id', id)
    .single();

  if (existing.error || !existing.data) {
    return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
  }
  if (!existing.data.authoritative_link) {
    return NextResponse.json(
      { success: false, error: 'Cannot sign off legal review without an authoritative link (source of record)' },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .update({
      human_confirmed: true,
      verified: true,
      verified_by: body.reviewed_by,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, case_citation, human_confirmed, verified')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Legal review confirmed', data });
}
