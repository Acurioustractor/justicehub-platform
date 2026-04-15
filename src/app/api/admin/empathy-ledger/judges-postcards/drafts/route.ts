import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-auth';
import {
  buildJudgesPostcardPublicationQueue,
  type JudgesPostcardPublicationQueueItem,
} from '@/lib/judges-postcard-publication-plan';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

const DEFAULT_TENANT_ID = '8891e1a9-92ae-423f-928b-cec602660011';

type StorytellerOrgLink = {
  organization_id: string | null;
  tenant_id: string | null;
};

type ExistingDraftStory = {
  id: string;
  status: string | null;
};

async function resolveOonchiumpaContext(storytellerId: string) {
  if (!empathyLedgerServiceClient) {
    return { organizationId: null, tenantId: DEFAULT_TENANT_ID };
  }

  const { data: storytellerOrg } = await empathyLedgerServiceClient
    .from('storyteller_organizations')
    .select('organization_id, tenant_id')
    .eq('storyteller_id', storytellerId)
    .limit(1)
    .maybeSingle<StorytellerOrgLink>();

  if (storytellerOrg?.organization_id) {
    return {
      organizationId: storytellerOrg.organization_id,
      tenantId: storytellerOrg.tenant_id || DEFAULT_TENANT_ID,
    };
  }

  const jhService = createServiceClient();
  const { data: jhOrg } = await jhService
    .from('organizations')
    .select('empathy_ledger_org_id')
    .eq('slug', 'oonchiumpa')
    .maybeSingle();

  const organizationId = jhOrg?.empathy_ledger_org_id || null;
  if (!organizationId) {
    return { organizationId: null, tenantId: DEFAULT_TENANT_ID };
  }

  const { data: elOrg } = await empathyLedgerServiceClient
    .from('organizations')
    .select('tenant_id')
    .eq('id', organizationId)
    .maybeSingle();

  return {
    organizationId,
    tenantId: elOrg?.tenant_id || DEFAULT_TENANT_ID,
  };
}

async function findExistingDraftStory(
  item: Pick<JudgesPostcardPublicationQueueItem, 'storytellerId' | 'proposedTitle'>
) {
  if (!empathyLedgerServiceClient) {
    return null;
  }

  const { data, error } = await empathyLedgerServiceClient
    .from('stories')
    .select('id, status')
    .eq('storyteller_id', item.storytellerId)
    .eq('title', item.proposedTitle)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<ExistingDraftStory>();

  if (error) {
    throw error;
  }

  return data;
}

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ('error' in auth) return auth.error;

    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return NextResponse.json(
        { error: 'Empathy Ledger write access is not configured' },
        { status: 503 }
      );
    }

    const queue = await buildJudgesPostcardPublicationQueue();
    const items = await Promise.all(
      queue.items.map(async (item) => {
        const existingDraft = await findExistingDraftStory(item);

        return {
          cardId: item.cardId,
          queueStatus: item.status,
          storyId: existingDraft?.id || null,
          draftStatus: existingDraft?.status || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      items,
      summary: {
        total: items.length,
        existing: items.filter((item) => Boolean(item.storyId)).length,
      },
      requestedBy: auth.userId,
    });
  } catch (error) {
    console.error('Judges postcard draft lookup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load draft state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if ('error' in auth) return auth.error;

    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return NextResponse.json(
        { error: 'Empathy Ledger write access is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const cardId = typeof body.cardId === 'string' ? body.cardId : null;

    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const queue = await buildJudgesPostcardPublicationQueue();
    const item = queue.items.find((entry) => entry.cardId === cardId);

    if (!item) {
      return NextResponse.json(
        { error: 'Card not found in publication queue or it already has a public EL story' },
        { status: 404 }
      );
    }

    if (item.status === 'blocked') {
      return NextResponse.json(
        { error: item.blocker || 'This card is blocked from draft creation' },
        { status: 409 }
      );
    }

    const existingDraft = await findExistingDraftStory(item);

    if (existingDraft) {
      return NextResponse.json({
        success: true,
        created: false,
        existing: true,
        storyId: existingDraft.id,
        status: existingDraft.status || 'draft',
      });
    }

    const context = await resolveOonchiumpaContext(item.storytellerId);
    const sourceLinks = [
      item.draftStory.metadata.source_route,
      item.draftStory.metadata.destination_route,
    ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);
    const provenanceChain = [
      {
        source: item.draftStory.metadata.source,
        postcard_card_id: item.draftStory.metadata.postcard_card_id,
        postcard_card_number: item.draftStory.metadata.postcard_card_number,
        postcard_nav_title: item.draftStory.metadata.postcard_nav_title,
        quote_excerpt: item.draftStory.metadata.quote_excerpt,
        requires_editorial_review: item.draftStory.metadata.requires_editorial_review,
        blocker: item.draftStory.metadata.blocker || null,
        local_asset_path: item.draftStory.metadata.local_asset_path || null,
        created_by: auth.userId,
      },
    ];

    const insertPayload = {
      id: randomUUID(),
      tenant_id: context.tenantId,
      organization_id: context.organizationId,
      storyteller_id: item.storytellerId,
      title: item.draftStory.title,
      content: item.draftStory.content,
      summary: item.draftStory.summary,
      excerpt: item.quoteExcerpt,
      story_type: item.storyType,
      themes: item.themes,
      tags: ['judges-postcards', 'justicehub', 'publication-queue'],
      privacy_level: item.draftStory.privacy_level,
      status: item.draftStory.status,
      is_public: item.draftStory.is_public,
      language: 'en',
      source_links: sourceLinks.length > 0 ? sourceLinks : null,
      provenance_chain: provenanceChain,
      story_stage: 'draft',
      community_status: 'draft',
    };

    const { data: story, error } = await empathyLedgerServiceClient
      .from('stories')
      .insert(insertPayload)
      .select('id, status')
      .single();

    if (error) {
      console.error('Failed to create postcard EL draft:', error);
      return NextResponse.json({ error: error.message || 'Failed to create EL draft' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      created: true,
      storyId: story.id,
      status: story.status || 'draft',
      createdBy: auth.userId,
    });
  } catch (error) {
    console.error('Judges postcard draft creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create draft' },
      { status: 500 }
    );
  }
}
