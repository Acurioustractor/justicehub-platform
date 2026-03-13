/**
 * Tests for ALMA data quality patterns
 *
 * Verifies that the critical filtering pattern (excluding ai_generated records)
 * is correctly applied, and that data quality guards work as expected.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Skip if no DB credentials (CI without secrets)
const describeWithDB = supabaseUrl && supabaseKey ? describe : describe.skip;

describeWithDB('ALMA verification_status filtering', () => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  it('should never return ai_generated interventions in standard queries', async () => {
    const { data, error } = await supabase
      .from('alma_interventions')
      .select('id, name, verification_status')
      .neq('verification_status', 'ai_generated')
      .limit(100);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Verify none have ai_generated status
    const aiGenerated = data?.filter((d) => d.verification_status === 'ai_generated') ?? [];
    expect(aiGenerated).toHaveLength(0);
  });

  it('ai_generated records should exist but be excluded', async () => {
    // Verify ai_generated records actually exist in the table
    const { count: aiCount } = await supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'ai_generated');

    // We know from audits there are 279 ai_generated records
    expect(aiCount).toBeGreaterThan(0);

    // Verify filtered count is less than total
    const { count: totalCount } = await supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true });

    const { count: filteredCount } = await supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated');

    expect(filteredCount).toBeLessThan(totalCount!);
    expect(totalCount! - filteredCount!).toBe(aiCount);
  });

  it('verified interventions should have non-empty names and types', async () => {
    const { data, error } = await supabase
      .from('alma_interventions')
      .select('name, type')
      .eq('verification_status', 'verified')
      .limit(50);

    expect(error).toBeNull();
    for (const row of data ?? []) {
      expect(row.name).toBeTruthy();
      expect(row.name.length).toBeGreaterThan(2);
      expect(row.type).toBeTruthy();
    }
  });
});

describeWithDB('ALMA evidence linkage integrity', () => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  it('intervention_evidence links should reference valid interventions', async () => {
    const { data: links, error } = await supabase
      .from('alma_intervention_evidence')
      .select('intervention_id, evidence_id')
      .limit(50);

    expect(error).toBeNull();
    if (!links?.length) return;

    // Verify all intervention_ids exist
    const interventionIds = [...new Set(links.map((l) => l.intervention_id))];
    const { data: interventions } = await supabase
      .from('alma_interventions')
      .select('id')
      .in('id', interventionIds);

    expect(interventions?.length).toBe(interventionIds.length);
  });

  it('intervention_outcomes links should reference valid outcomes', async () => {
    const { data: links, error } = await supabase
      .from('alma_intervention_outcomes')
      .select('intervention_id, outcome_id')
      .limit(50);

    expect(error).toBeNull();
    if (!links?.length) return;

    // Verify all outcome_ids exist
    const outcomeIds = [...new Set(links.map((l) => l.outcome_id))];
    const { data: outcomes } = await supabase
      .from('alma_outcomes')
      .select('id')
      .in('id', outcomeIds);

    expect(outcomes?.length).toBe(outcomeIds.length);
  });
});

describeWithDB('Justice funding data quality', () => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  it('should have records with required fields', async () => {
    const { data, error } = await supabase
      .from('justice_funding')
      .select('id, source, recipient_name, amount_dollars')
      .limit(20);

    expect(error).toBeNull();
    for (const row of data ?? []) {
      expect(row.source).toBeTruthy();
      // recipient_name or amount should exist for meaningful records
      expect(row.recipient_name || row.amount_dollars).toBeTruthy();
    }
  });
});
