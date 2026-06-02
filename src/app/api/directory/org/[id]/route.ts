import { NextRequest, NextResponse } from 'next/server';
import { getDirectoryOrgDossier } from '@/lib/directory/org-dossier';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const dossier = await getDirectoryOrgDossier(id);
    if (!dossier) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    }

    return NextResponse.json({
      dossier,
      validity: {
        key: 'organization_id + ABN + gs_entity_id',
        publicPeopleOnly: true,
        caveat: 'This dossier shows linked public records and gaps. It does not expose private notes, raw story material, or unconsented people data.',
      },
    });
  } catch (error) {
    console.error('[api/directory/org]', error);
    return NextResponse.json({ error: 'Directory dossier failed' }, { status: 500 });
  }
}
