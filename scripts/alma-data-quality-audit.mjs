import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
);

async function runAudit() {
  console.log('=== ALMA DATA QUALITY AUDIT ===\n');
  
  // Check schema for interventions
  console.log('## Checking ALMA INTERVENTIONS Schema...');
  const { data: intSample, error: intSchemaError } = await supabase
    .from('alma_interventions')
    .select('*')
    .limit(1);
  
  if (intSample && intSample.length > 0) {
    console.log('Columns:', Object.keys(intSample[0]));
  } else {
    console.log('Schema error:', intSchemaError);
  }
  
  // Check schema for evidence
  console.log('\n## Checking ALMA EVIDENCE Schema...');
  const { data: evSample, error: evSchemaError } = await supabase
    .from('alma_evidence')
    .select('*')
    .limit(1);
  
  if (evSample && evSample.length > 0) {
    console.log('Columns:', Object.keys(evSample[0]));
  } else {
    console.log('Schema error:', evSchemaError);
  }
  
  // 1. ALMA Interventions - actual query
  console.log('\n## 1. ALMA INTERVENTIONS DATA QUALITY');
  const { data: interventions, error: intError } = await supabase
    .from('alma_interventions')
    .select('id, description, evidence_level, cost_per_young_person, type, geography, verification_status', { count: 'exact' });
  
  if (intError) {
    console.log('ERROR:', intError);
  } else if (interventions) {
    const verified = interventions.filter(i => i.verification_status !== 'ai_generated');
    console.log(`Total records: ${interventions.length}`);
    console.log(`Verified (non-AI): ${verified.length}`);
    console.log(`AI-generated (excluded): ${interventions.length - verified.length}`);
    console.log('\nMissing fields (verified interventions):');
    console.log(`  - Description: ${verified.filter(i => !i.description).length}`);
    console.log(`  - Evidence level: ${verified.filter(i => !i.evidence_level).length}`);
    console.log(`  - Cost per young person: ${verified.filter(i => !i.cost_per_young_person).length}`);
    console.log(`  - Type: ${verified.filter(i => !i.type).length}`);
    console.log(`  - Geography: ${verified.filter(i => !i.geography || Object.keys(i.geography || {}).length === 0).length}`);
  }
  
  // 2. ALMA Evidence
  console.log('\n## 2. ALMA EVIDENCE DATA QUALITY');
  const { data: evidence, error: evError } = await supabase
    .from('alma_evidence')
    .select('id, source_url', { count: 'exact' });
  
  if (evError) {
    console.log('ERROR:', evError);
  } else if (evidence) {
    console.log(`Total records: ${evidence.length}`);
    console.log(`Missing source URL: ${evidence.filter(e => !e.source_url).length}`);
  }
  
  // 3. ALMA Research Findings
  console.log('\n## 3. ALMA RESEARCH FINDINGS');
  const { data: findings, error: findError } = await supabase
    .from('alma_research_findings')
    .select('finding_type', { count: 'exact' });
  
  if (findError) {
    console.log('ERROR:', findError);
  } else if (findings) {
    const counts = {};
    findings.forEach(f => {
      counts[f.finding_type] = (counts[f.finding_type] || 0) + 1;
    });
    console.log(`Total records: ${findings.length}`);
    console.log('Distribution by type:');
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
  }
  
  // 4. ALMA Media Articles
  console.log('\n## 4. ALMA MEDIA ARTICLES');
  const { data: media, error: medError } = await supabase
    .from('alma_media_articles')
    .select('id, headline', { count: 'exact' });
  
  if (medError) {
    console.log('ERROR:', medError);
  } else if (media) {
    console.log(`Total records: ${media.length}`);
    console.log(`Missing headline: ${media.filter(m => !m.headline).length}`);
  }
  
  // 5. ROGS Justice Spending
  console.log('\n## 5. ROGS JUSTICE SPENDING');
  const { data: rogs, error: rogsError } = await supabase
    .from('rogs_justice_spending')
    .select('rogs_section', { count: 'exact' });
  
  if (rogsError) {
    console.log('ERROR:', rogsError);
  } else if (rogs) {
    const counts = {};
    rogs.forEach(r => {
      counts[r.rogs_section] = (counts[r.rogs_section] || 0) + 1;
    });
    console.log(`Total records: ${rogs.length}`);
    console.log('Distribution by rogs_section:');
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([section, count]) => {
      console.log(`  - ${section}: ${count}`);
    });
  }
  
  // 6. ALMA Stories
  console.log('\n## 6. ALMA STORIES');
  const { data: stories, error: storError } = await supabase
    .from('alma_stories')
    .select('story_type', { count: 'exact' });
  
  if (storError) {
    console.log('ERROR:', storError);
  } else if (stories) {
    const counts = {};
    stories.forEach(s => {
      counts[s.story_type] = (counts[s.story_type] || 0) + 1;
    });
    console.log(`Total records: ${stories.length}`);
    console.log('Distribution by type:');
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
  }
  
  // 7. Justice Matrix Cases
  console.log('\n## 7. JUSTICE MATRIX CASES');
  const { data: cases, error: caseError } = await supabase
    .from('justice_matrix_cases')
    .select('outcome, precedent_strength', { count: 'exact' });
  
  if (caseError) {
    console.log('ERROR:', caseError);
  } else if (cases) {
    const outcomeCount = {};
    const precedentCount = {};
    cases.forEach(c => {
      outcomeCount[c.outcome] = (outcomeCount[c.outcome] || 0) + 1;
      precedentCount[c.precedent_strength] = (precedentCount[c.precedent_strength] || 0) + 1;
    });
    console.log(`Total records: ${cases.length}`);
    console.log('Distribution by outcome:');
    Object.entries(outcomeCount).sort((a, b) => b[1] - a[1]).forEach(([outcome, count]) => {
      console.log(`  - ${outcome}: ${count}`);
    });
    console.log('Distribution by precedent strength:');
    Object.entries(precedentCount).sort((a, b) => b[1] - a[1]).forEach(([strength, count]) => {
      console.log(`  - ${strength}: ${count}`);
    });
  }
  
  console.log('\n=== AUDIT COMPLETE ===');
}

runAudit().catch(console.error);
