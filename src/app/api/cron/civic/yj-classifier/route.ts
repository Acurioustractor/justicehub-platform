import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Nightly YJ-relevance classifier worker for foundation_grantees.
 *
 * Pulls up to ?batch=N unclassified grants and asks Gemini Flash to tag
 * each one (direct_yj_service / yj_research / yj_advocacy / broader_justice
 * /indigenous_youth_general / not_yj). Idempotent: skips rows with
 * yj_classified_at IS NOT NULL.
 *
 * Cron-scheduled in vercel.json. CRON_SECRET required.
 *
 * Mirrors scripts/civic/classify-foundation-grants-yj.mjs; keep prompts in sync.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SYSTEM_PROMPT = `You classify Australian foundation grants by their relevance to youth justice (YJ).

Categories (pick exactly one):
- direct_yj_service: grant funds a frontline YJ service (diversion, bail support, on-Country mentoring, post-release, family conferencing, youth legal first-response).
- yj_research: grant funds research or evaluation of YJ programs or systems.
- yj_advocacy: grant funds advocacy / policy reform on YJ (raise the age, custody reform).
- broader_justice_includes_yj: grant funds a broader justice or legal service that includes YJ as part of scope.
- indigenous_youth_general: grant funds Indigenous youth wellbeing more broadly (cultural, education, sport, mentoring) without explicit YJ framing.
- not_yj: grant has no clear YJ connection.

Rules:
- Aboriginal Legal Service without YJ specifics = broader_justice_includes_yj.
- Cultural / on-Country / mentoring for Indigenous youth = indigenous_youth_general unless YJ framing.
- Children's / kids programs without justice framing = not_yj.
- Health / housing / disability without justice framing = not_yj.

Output JSON only: { "yj_relevant": boolean, "yj_category": "<one of the 6>", "yj_confidence": 0-1, "yj_evidence_snippet": "<8-30 words quoted from the grant>" }`;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

async function classify(grant: any, key: string): Promise<any | null> {
  const userPrompt = `Foundation: ${grant.foundation_name || 'unknown'}\nGrantee: ${grant.grantee_name || 'unknown'}\nProgram: ${grant.program_name || 'n/a'}\nAmount: ${grant.grant_amount || 'n/a'}\nEvidence: ${grant.evidence_text || 'n/a'}`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const batch = Math.min(Math.max(parseInt(searchParams.get('batch') || '200', 10), 1), 500);
  const supabase = createServiceClient() as any;

  const { data: pending } = await supabase
    .from('foundation_grantees')
    .select('id, foundation_name, grantee_name, program_name, grant_amount, evidence_text')
    .is('yj_classified_at', null)
    .limit(batch);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'No unclassified grants.' });
  }

  let processed = 0;
  let yjCount = 0;
  let errors = 0;

  for (const grant of pending) {
    try {
      const result = await classify(grant, key);
      if (!result) {
        errors++;
        continue;
      }
      await supabase
        .from('foundation_grantees')
        .update({
          yj_relevant: !!result.yj_relevant,
          yj_category: result.yj_category || null,
          yj_confidence: typeof result.yj_confidence === 'number' ? result.yj_confidence : null,
          yj_evidence_snippet: result.yj_evidence_snippet || null,
          yj_classified_at: new Date().toISOString(),
        })
        .eq('id', grant.id);
      processed++;
      if (result.yj_relevant) yjCount++;
    } catch (err) {
      console.error('classify failed', grant.id, err);
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    yjCount,
    errors,
    batchSize: batch,
    note: 'Nightly cron. Coverage advances ~500/night → ~99% in ~9 days at current backlog.',
  });
}
