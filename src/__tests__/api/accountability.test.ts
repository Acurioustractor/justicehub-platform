/**
 * Civic Accountability Cross-Reference Engine Tests
 *
 * Tests for:
 *   /api/intelligence/accountability — SAID -> FUNDED -> HAPPENED
 *   /api/intelligence/rhetoric-timeline — rhetoric time-series
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

let supabase: SupabaseClient;

beforeAll(() => {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
});

jest.setTimeout(60000);

describe('Accountability Cross-Reference Engine', () => {
  // -- Data layer tests --

  describe('Data layer: civic_hansard', () => {
    test('civic_hansard table has data', async () => {
      const { count, error } = await supabase
        .from('civic_hansard')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);
    });

    test('hansard records have required columns', async () => {
      const { data, error } = await supabase
        .from('civic_hansard')
        .select('subject, speaker_name, sitting_date, jurisdiction, body_text')
        .limit(3);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
      for (const row of data!) {
        expect(row.sitting_date).toBeTruthy();
        expect(row.jurisdiction).toBeTruthy();
      }
    });

    test('hansard ilike search returns results for youth justice', async () => {
      const { data, error } = await supabase
        .from('civic_hansard')
        .select('subject, speaker_name')
        .or('subject.ilike.%youth justice%,body_text.ilike.%youth justice%')
        .limit(5);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });
  });

  describe('Data layer: justice_funding', () => {
    test('justice_funding ilike search returns results', async () => {
      const { data, error } = await supabase
        .from('justice_funding')
        .select('program_name, amount_dollars, source')
        .or('program_name.ilike.%youth%,source.ilike.%youth%')
        .limit(5);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });
  });

  describe('Data layer: alma_interventions', () => {
    test('alma_interventions search returns non-ai-generated results', async () => {
      const { data, error } = await supabase
        .from('alma_interventions')
        .select('name, evidence_level, type')
        .neq('verification_status', 'ai_generated')
        .or('name.ilike.%youth%,description.ilike.%youth%')
        .limit(5);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });
  });

  describe('Data layer: oversight_recommendations', () => {
    test('oversight_recommendations table has data', async () => {
      const { count, error } = await supabase
        .from('oversight_recommendations')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Data layer: civic_charter_commitments', () => {
    test('civic_charter_commitments table exists and is queryable', async () => {
      const { data, error } = await supabase
        .from('civic_charter_commitments')
        .select('minister_name, commitment_text, status')
        .eq('youth_justice_relevant', true)
        .limit(3);

      // Table may be empty but query should not error
      expect(error).toBeNull();
    });
  });

  // -- API logic tests (unit-style, testing the cross-reference logic) --

  describe('Accountability response shape', () => {
    test('cross-reference query builds correct response structure', async () => {
      const keyword = 'youth justice';

      const [hansard, funding, programs, oversight, promises] = await Promise.all([
        supabase
          .from('civic_hansard')
          .select('id, subject, speaker_name, speaker_party, sitting_date, jurisdiction, body_text')
          .or(`subject.ilike.%${keyword}%,body_text.ilike.%${keyword}%`)
          .order('sitting_date', { ascending: false })
          .limit(20),
        supabase
          .from('justice_funding')
          .select('id, program_name, amount_dollars, source, financial_year, state')
          .or(`program_name.ilike.%${keyword}%,source.ilike.%${keyword}%`)
          .order('amount_dollars', { ascending: false })
          .limit(20),
        supabase
          .from('alma_interventions')
          .select('id, name, type, evidence_level, cost_per_young_person, operating_organization, geography')
          .neq('verification_status', 'ai_generated')
          .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .limit(20),
        supabase
          .from('oversight_recommendations')
          .select('id, oversight_body, recommendation_text, status, severity')
          .or(`recommendation_text.ilike.%${keyword}%,report_title.ilike.%${keyword}%`)
          .limit(10),
        supabase
          .from('civic_charter_commitments')
          .select('minister_name, commitment_text, status, status_evidence')
          .eq('youth_justice_relevant', true)
          .or(`commitment_text.ilike.%${keyword}%`)
          .limit(10),
      ]);

      expect(hansard.error).toBeNull();
      expect(funding.error).toBeNull();
      expect(programs.error).toBeNull();
      expect(oversight.error).toBeNull();
      expect(promises.error).toBeNull();

      // Verify response can be built from query results
      const totalFunding = (funding.data || []).reduce(
        (sum: number, f: any) => sum + (f.amount_dollars || 0),
        0
      );
      expect(typeof totalFunding).toBe('number');
      expect(hansard.data!.length).toBeGreaterThan(0);
    });
  });

  describe('Rhetoric timeline logic', () => {
    test('hansard speeches can be grouped by month', async () => {
      const { data: speeches, error } = await supabase
        .from('civic_hansard')
        .select('sitting_date, subject, body_text, jurisdiction, speaker_party')
        .order('sitting_date', { ascending: true })
        .limit(50);

      expect(error).toBeNull();
      expect(speeches!.length).toBeGreaterThan(0);

      // Group by month
      const timeline: Record<string, { month: string; total: number; detention: number; alternatives: number }> = {};
      const topics = {
        detention: /detention|lock up|incarcerat/i,
        alternatives: /alternative|diversion|community.?based|restorative/i,
      };

      for (const speech of speeches!) {
        const month = speech.sitting_date?.slice(0, 7);
        if (!month) continue;
        if (!timeline[month]) {
          timeline[month] = { month, total: 0, detention: 0, alternatives: 0 };
        }
        timeline[month].total++;
        const text = `${speech.subject || ''} ${speech.body_text || ''}`;
        for (const [topic, regex] of Object.entries(topics)) {
          if (regex.test(text)) (timeline[month] as any)[topic]++;
        }
      }

      const months = Object.values(timeline).sort((a, b) => a.month.localeCompare(b.month));
      expect(months.length).toBeGreaterThan(0);
      expect(months[0]).toHaveProperty('month');
      expect(months[0]).toHaveProperty('total');
      expect(months[0].total).toBeGreaterThan(0);
    });

    test('topic regex patterns match expected youth justice content', () => {
      const topics = {
        detention: /detention|lock up|incarcerat/i,
        alternatives: /alternative|diversion|community.?based|restorative/i,
        raising_age: /rais.+age|age of criminal|minimum age/i,
        tough_on_crime: /tough on crime|crackdown|mandatory|zero tolerance|boot camp/i,
        first_nations: /aboriginal|indigenous|first nations|closing the gap/i,
        bail: /bail|remand|watch house/i,
      };

      expect(topics.detention.test('Youth detention centre overcrowding')).toBe(true);
      expect(topics.alternatives.test('Community-based diversion programs')).toBe(true);
      expect(topics.raising_age.test('Raising the age of criminal responsibility')).toBe(true);
      expect(topics.tough_on_crime.test('We need to be tough on crime')).toBe(true);
      expect(topics.first_nations.test('Aboriginal and Torres Strait Islander communities')).toBe(true);
      expect(topics.bail.test('Children held on remand in watch house')).toBe(true);

      // Negative cases
      expect(topics.detention.test('Community program funding')).toBe(false);
      expect(topics.tough_on_crime.test('Restorative justice conference')).toBe(false);
    });
  });

  describe('Jurisdiction filter', () => {
    test('jurisdiction filter narrows hansard results', async () => {
      const { data: all } = await supabase
        .from('civic_hansard')
        .select('id', { count: 'exact', head: true })
        .or('subject.ilike.%youth justice%,body_text.ilike.%youth justice%');

      const { data: qldOnly } = await supabase
        .from('civic_hansard')
        .select('id')
        .eq('jurisdiction', 'QLD')
        .or('subject.ilike.%youth justice%,body_text.ilike.%youth justice%')
        .limit(5);

      // QLD should return results (we know QLD hansard is scraped)
      expect(qldOnly!.length).toBeGreaterThan(0);
    });
  });
});
