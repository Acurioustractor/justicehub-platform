/**
 * Admin-only endpoint to add a new row to justice_matrix_sources. Keeps
 * source onboarding out of raw SQL.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SOURCE_TYPES = [
  'court_database',
  'legal_database',
  'advocacy_org',
  'regional_body',
  'research',
  'government',
  'community',
  'academic',
  'advocacy',
] as const;

const DATA_FORMATS = ['html', 'json'] as const;
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const;

const Payload = z.object({
  name: z.string().min(3).max(200),
  source_type: z.enum(SOURCE_TYPES),
  url: z.string().url(),
  region: z.string().min(1).max(80).optional().or(z.literal('')),
  jurisdictions: z.array(z.string().max(20)).max(20).default([]),
  organization: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  data_format: z.enum(DATA_FORMATS).default('html'),
  scrape_frequency: z.enum(FREQUENCIES).default('weekly'),
  scrape_priority: z.coerce.number().int().min(1).max(10).default(5),
  is_active: z.boolean().default(true),
});

export async function POST(request: Request) {
  const auth = await checkAdmin();
  if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid payload',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 6),
      },
      { status: 400 },
    );
  }
  const p = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // Dedupe on URL — a source pointed at the same URL twice is almost always a mistake.
  const { data: existing } = await supabase
    .from('justice_matrix_sources')
    .select('id,name')
    .eq('url', p.url)
    .limit(1);
  if (existing?.length) {
    return NextResponse.json(
      { success: false, error: `URL already in sources as "${existing[0].name}"`, existing_id: existing[0].id },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from('justice_matrix_sources')
    .insert({
      name: p.name,
      source_type: p.source_type,
      url: p.url,
      region: p.region || null,
      jurisdictions: p.jurisdictions.length ? p.jurisdictions : null,
      organization: p.organization || null,
      description: p.description || null,
      data_format: p.data_format,
      scrape_frequency: p.scrape_frequency,
      scrape_priority: p.scrape_priority,
      is_active: p.is_active,
      total_items_found: 0,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id });
}
