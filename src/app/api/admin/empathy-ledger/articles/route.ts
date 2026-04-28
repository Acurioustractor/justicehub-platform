import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-auth';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger-lite';
import { markdownToHtml } from '@/lib/empathy-ledger/markdown-to-html';

const DEFAULT_TENANT_ID = '8891e1a9-92ae-423f-928b-cec602660011';
// Fallback EL storyteller used when the admin form doesn't pick one.
// Required: stories table has a check constraint requiring storyteller_id OR author_id.
// Ben's EL storyteller record (Benjamin Knight, JusticeHub editorial default).
const JH_DEFAULT_STORYTELLER_ID = '8b5f3aa0-5955-43ac-8442-37e48e7fc810';

const EL_BASE_URL = (process.env.EMPATHY_LEDGER_V2_URL || 'https://www.empathyledger.com').replace(/\/+$/, '');

const ALLOWED_SENSITIVITY = ['standard', 'sensitive', 'sacred', 'restricted'] as const;
const ALLOWED_STORY_TYPES = [
  'personal_narrative',
  'community_news',
  'impact_story',
  'case_study',
  'reflection',
] as const;

const PayloadSchema = z.object({
  title: z.string().trim().min(3).max(280),
  summary: z.string().trim().max(600).optional(),
  content: z.string().trim().min(20),
  content_format: z.enum(['markdown', 'html']).default('markdown'),
  hero_image_url: z.string().url().optional(),
  story_type: z.enum(ALLOWED_STORY_TYPES).default('community_news'),
  themes: z.array(z.string().trim().min(1)).max(20).default([]),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  primary_storyteller_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  cultural_sensitivity_level: z.enum(ALLOWED_SENSITIVITY).default('standard'),
  source_links: z.array(z.string().url()).max(20).optional(),
  jh_provenance_note: z.string().trim().max(500).optional(),
});

type Payload = z.infer<typeof PayloadSchema>;

async function resolveTenant(payload: Payload): Promise<string> {
  if (!empathyLedgerServiceClient) return DEFAULT_TENANT_ID;
  if (payload.primary_storyteller_id) {
    const { data } = await empathyLedgerServiceClient
      .from('storytellers')
      .select('tenant_id')
      .eq('id', payload.primary_storyteller_id)
      .maybeSingle<{ tenant_id: string | null }>();
    if (data?.tenant_id) return data.tenant_id;
  }
  if (payload.organization_id) {
    const { data } = await empathyLedgerServiceClient
      .from('organizations')
      .select('tenant_id')
      .eq('id', payload.organization_id)
      .maybeSingle<{ tenant_id: string | null }>();
    if (data?.tenant_id) return data.tenant_id;
  }
  return DEFAULT_TENANT_ID;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if ('error' in auth) return auth.error;

    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return NextResponse.json(
        { error: 'Empathy Ledger write access is not configured. Set EMPATHY_LEDGER_SERVICE_KEY.' },
        { status: 503 }
      );
    }

    const json = await request.json();
    const parsed = PayloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const payload = parsed.data;

    const tenantId = await resolveTenant(payload);
    const contentHtml =
      payload.content_format === 'markdown' ? markdownToHtml(payload.content) : payload.content;

    const insertId = randomUUID();
    const insertPayload: Record<string, unknown> = {
      id: insertId,
      tenant_id: tenantId,
      title: payload.title,
      content: contentHtml,
      summary: payload.summary || null,
      story_type: payload.story_type,
      themes: payload.themes,
      tags: ['justicehub', 'jh-drafted', ...payload.tags],
      cultural_sensitivity_level: payload.cultural_sensitivity_level,
      privacy_level: 'private',
      is_public: false,
      status: 'draft',
      community_status: 'draft',
      story_stage: 'draft',
      language: 'en',
      has_explicit_consent: false,
      provenance_chain: [
        {
          source: 'justicehub_admin_draft',
          drafted_by: auth.userId,
          drafted_at: new Date().toISOString(),
          note: payload.jh_provenance_note || null,
        },
      ],
    };

    if (payload.hero_image_url) insertPayload.story_image_url = payload.hero_image_url;
    insertPayload.storyteller_id =
      payload.primary_storyteller_id || JH_DEFAULT_STORYTELLER_ID;
    if (payload.organization_id) insertPayload.organization_id = payload.organization_id;
    if (payload.source_links && payload.source_links.length) {
      insertPayload.source_links = payload.source_links;
    }

    const { data: story, error } = await empathyLedgerServiceClient
      .from('stories')
      .insert(insertPayload)
      .select('id, status, title')
      .single();

    if (error) {
      console.error('EL article draft insert failed:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create EL draft', code: error.code },
        { status: 500 }
      );
    }

    if (payload.themes.length) {
      const themeRows = payload.themes.map((theme) => ({
        story_id: insertId,
        theme,
        added_by: auth.userId,
      }));
      const { error: themeError } = await empathyLedgerServiceClient
        .from('story_themes')
        .insert(themeRows);
      if (themeError) {
        console.warn('story_themes insert non-fatal failure:', themeError.message);
      }
    }

    return NextResponse.json({
      success: true,
      story_id: story.id,
      status: story.status || 'draft',
      title: story.title,
      edit_url: `${EL_BASE_URL}/stories/write/${story.id}`,
      view_url: `${EL_BASE_URL}/stories/${story.id}`,
      drafted_by: auth.userId,
    });
  } catch (error) {
    console.error('EL article draft route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create draft' },
      { status: 500 }
    );
  }
}
