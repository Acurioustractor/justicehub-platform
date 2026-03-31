import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intelligence/rhetoric-timeline
 *
 * Youth justice rhetoric time-series from parliamentary Hansard.
 * Groups speeches by month and categorizes by topic keywords.
 *
 * Returns timeline data suitable for charting rhetoric trends over time.
 *
 * Topics tracked:
 *   - detention: detention, incarceration language
 *   - alternatives: diversion, community-based, restorative
 *   - raising_age: age of criminal responsibility
 *   - tough_on_crime: crackdown, mandatory sentencing, zero tolerance
 *   - first_nations: Aboriginal, Indigenous, Closing the Gap
 *   - bail: bail, remand, watch house
 */

interface TimelineEntry {
  month: string;
  total: number;
  detention: number;
  alternatives: number;
  raising_age: number;
  tough_on_crime: number;
  first_nations: number;
  bail: number;
}

const TOPICS: Record<string, RegExp> = {
  detention: /detention|lock up|incarcerat/i,
  alternatives: /alternative|diversion|community.?based|restorative/i,
  raising_age: /rais.+age|age of criminal|minimum age/i,
  tough_on_crime: /tough on crime|crackdown|mandatory|zero tolerance|boot camp/i,
  first_nations: /aboriginal|indigenous|first nations|closing the gap/i,
  bail: /bail|remand|watch house/i,
};

export async function GET() {
  const supabase = createServiceClient();

  const { data: speeches, error } = await supabase
    .from('civic_hansard')
    .select('sitting_date, subject, body_text, jurisdiction, speaker_party')
    .order('sitting_date', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Hansard data', detail: error.message },
      { status: 500 }
    );
  }

  // Group by month and categorize
  const timeline: Record<string, TimelineEntry> = {};
  const topicKeys = Object.keys(TOPICS);

  for (const speech of speeches || []) {
    const month = speech.sitting_date?.slice(0, 7); // YYYY-MM
    if (!month) continue;

    if (!timeline[month]) {
      const entry: TimelineEntry = { month, total: 0, detention: 0, alternatives: 0, raising_age: 0, tough_on_crime: 0, first_nations: 0, bail: 0 };
      timeline[month] = entry;
    }

    timeline[month].total++;
    const text = `${speech.subject || ''} ${speech.body_text || ''}`;

    for (const topic of topicKeys) {
      if (TOPICS[topic].test(text)) {
        (timeline[month] as unknown as Record<string, number>)[topic]++;
      }
    }
  }

  const sorted = Object.values(timeline).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  return NextResponse.json({
    timeline: sorted,
    topics: topicKeys,
    total_speeches: speeches?.length || 0,
    timestamp: new Date().toISOString(),
  });
}
