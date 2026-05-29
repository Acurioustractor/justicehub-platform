/**
 * POST /api/justice-matrix/evidence/[id]/revoke
 *
 * Community-held revocation. The body carries { token }. If it matches the
 * row's revocation_token, the row's consent_level is set to 'Strictly Private',
 * which removes it from every public surface instantly: the search/RPC
 * allow-list (['Public Knowledge Commons','Community Controlled']) already
 * excludes 'Strictly Private', and the evidence render layer has no unfiltered
 * fallback. Embeddings on restricted bodies are excluded by the embed cron.
 *
 * No auth beyond the token. The token IS the capability: whoever holds it for
 * a row holds the right to revoke that row. The token is delivered to the
 * holding community out of band and is never exposed through any GET, so
 * revocation is the community's, not ACT's.
 *
 * 200 { revoked: true } on a token match. 403 on a bad token. We do not leak
 * whether a row exists vs. whether the token was simply wrong — a bad token
 * and an unknown id both return 403.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PayloadSchema = z.object({
  token: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // The id must be a uuid before we touch the database. A malformed id is a
  // bad request, not a server error.
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ revoked: false, error: 'Invalid id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ revoked: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ revoked: false, error: 'A valid token is required' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // Read the row's token. We never return it; we only compare against it.
  const { data: row, error } = await supabase
    .from('alma_evidence')
    .select('id,revocation_token')
    .eq('id', id)
    .single();

  // Unknown row or read error: do not distinguish from a bad token. Both 403.
  if (error || !row || !row.revocation_token) {
    return NextResponse.json({ revoked: false, error: 'Invalid token' }, { status: 403 });
  }

  if (row.revocation_token !== parsed.data.token) {
    return NextResponse.json({ revoked: false, error: 'Invalid token' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('alma_evidence')
    .update({ consent_level: 'Strictly Private' })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ revoked: false, error: 'Revocation failed' }, { status: 500 });
  }

  return NextResponse.json({ revoked: true });
}
