import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-auth';
import {
  JUDGES_POSTCARD_CARDS,
  JUDGES_POSTCARD_OVERRIDES,
  type JudgesPostcardCardOverride,
  type JudgesPostcardOverridesDocument,
} from '@/content/judges-postcards';

const OVERRIDES_PATH = path.join(
  process.cwd(),
  'src/content/judges-postcards-overrides.json'
);

async function writeOverrides(document: JudgesPostcardOverridesDocument) {
  await fs.writeFile(OVERRIDES_PATH, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

export async function GET() {
  const auth = await requireAdminApi();
  if ('error' in auth) return auth.error;

  return NextResponse.json({
    success: true,
    cards: JUDGES_POSTCARD_CARDS,
    overrides: JUDGES_POSTCARD_OVERRIDES,
    requestedBy: auth.userId,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if ('error' in auth) return auth.error;

    const body = (await request.json()) as {
      cardId?: string;
      override?: JudgesPostcardCardOverride;
      reset?: boolean;
    };

    const cardId = typeof body.cardId === 'string' ? body.cardId : null;
    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const existingCard = JUDGES_POSTCARD_CARDS.find((card) => card.id === cardId);
    if (!existingCard) {
      return NextResponse.json({ error: 'Unknown postcard card id' }, { status: 404 });
    }

    const nextDocument: JudgesPostcardOverridesDocument = {
      cards: { ...(JUDGES_POSTCARD_OVERRIDES.cards || {}) },
    };

    if (body.reset) {
      delete nextDocument.cards[cardId];
    } else {
      if (!body.override || typeof body.override !== 'object') {
        return NextResponse.json({ error: 'override is required unless reset=true' }, { status: 400 });
      }
      nextDocument.cards[cardId] = body.override;
    }

    await writeOverrides(nextDocument);

    return NextResponse.json({
      success: true,
      cardId,
      reset: Boolean(body.reset),
      override: nextDocument.cards[cardId] || null,
      savedBy: auth.userId,
    });
  } catch (error) {
    console.error('Failed to update judges postcard overrides:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save postcard overrides',
      },
      { status: 500 }
    );
  }
}
