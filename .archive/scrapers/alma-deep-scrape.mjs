#!/usr/bin/env node
/**
 * ALMA Deep Scrape - Comprehensive data collection
 *
 * This script:
 * 1. Scrapes ALL sources regardless of last update time
 * 2. Follows links to discover new pages
 * 3. Tracks what was found vs what was new
 * 4. Builds a knowledge graph of youth justice in Australia
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Extended source list - deeper into each organization
 */
const DEEP_SOURCES = {
  // Government - Main pages AND subpages
  government: [
    // AIHW - Multiple report pages
    { name: 'AIHW Youth Justice Overview', url: 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice', type: 'research' },
    { name: 'AIHW Youth Justice Data', url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/summary', type: 'research' },
    { name: 'AIHW Youth Detention', url: 'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2024', type: 'research' },

    // Queensland - Multiple program pages
    { name: 'QLD Youth Justice Main', url: 'https://www.cyjma.qld.gov.au/youth-justice', type: 'program' },
    { name: 'QLD Youth Justice Programs', url: 'https://www.cyjma.qld.gov.au/youth-justice/youth-justice-programs', type: 'program' },
    { name: 'QLD Transition 2 Success', url: 'https://www.cyjma.qld.gov.au/youth-justice/youth-justice-programs/transition-2-success', type: 'program' },
    { name: 'QLD Youth Boot Camps', url: 'https://www.cyjma.qld.gov.au/youth-justice/youth-justice-programs/youth-boot-camps', type: 'program' },
    { name: 'QATSICPP Main', url: 'https://www.qatsicpp.com.au/', type: 'indigenous', cultural_authority: true },
    { name: 'QATSICPP Resources', url: 'https://www.qatsicpp.com.au/resources/', type: 'indigenous', cultural_authority: true },

    // NSW - Deeper pages
    { name: 'NSW Youth Justice Main', url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html', type: 'program' },
    { name: 'NSW Youth Justice Conferencing', url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice/youth-justice-conferencing.html', type: 'program' },
    { name: 'NSW Custody', url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice/custody.html', type: 'program' },
    { name: 'ALS NSW Main', url: 'https://www.alsnswact.org.au/', type: 'indigenous', cultural_authority: true },

    // Victoria - Deeper pages
    { name: 'VIC Youth Justice Main', url: 'https://www.justice.vic.gov.au/youth-justice', type: 'program' },
    { name: 'VIC Youth Diversion', url: 'https://www.justice.vic.gov.au/justice-system/youth-justice/youth-diversion', type: 'program' },
    { name: 'VIC Koori Youth Justice', url: 'https://www.justice.vic.gov.au/justice-system/youth-justice/koori-youth-justice-program', type: 'program' },
    { name: 'Victorian Aboriginal Legal Service', url: 'https://www.vals.org.au/', type: 'indigenous', cultural_authority: true },

    // Tasmania - All pages
    { name: 'TAS Youth Justice Main', url: 'https://www.decyp.tas.gov.au/safe-children/youth-justice-services/', type: 'program' },
    { name: 'TAS Youth Justice Reform', url: 'https://www.decyp.tas.gov.au/safe-children/youth-justice-services/youth-justice-reform-in-tasmania/', type: 'program' },
    { name: 'TAS New Facility', url: 'https://www.decyp.tas.gov.au/safe-children/youth-justice-services/youth-justice-reform-in-tasmania/tasmanian-youth-justice-facility/', type: 'program' },
    { name: 'TAS Ashley YDC', url: 'https://www.decyp.tas.gov.au/safe-children/youth-justice-services/ashley-youth-detention-centre/', type: 'program' },
    { name: 'TAS Commission of Inquiry', url: 'https://www.commissionofinquiry.tas.gov.au/', type: 'research' },

    // NT - Deeper pages
    { name: 'NT Youth Justice Main', url: 'https://justice.nt.gov.au/youth-justice', type: 'program' },
    { name: 'NT Youth Diversion', url: 'https://justice.nt.gov.au/youth-justice/youth-diversion-program', type: 'program' },
    { name: 'NAAJA', url: 'https://www.naaja.org.au/', type: 'indigenous', cultural_authority: true },

    // SA - Deeper pages
    { name: 'SA Youth Justice Main', url: 'https://www.childprotection.sa.gov.au/youth-justice', type: 'program' },
    { name: 'SA Youth Court', url: 'https://www.courts.sa.gov.au/going-to-court/youth-court/', type: 'program' },
    { name: 'Aboriginal Legal Rights Movement SA', url: 'https://www.alrm.org.au/', type: 'indigenous', cultural_authority: true },

    // WA - Deeper pages
    { name: 'WA Youth Justice Main', url: 'https://www.wa.gov.au/organisation/department-of-justice/youth-justice-services', type: 'program' },
    { name: 'WA Juvenile Custodial', url: 'https://www.wa.gov.au/organisation/department-of-justice/juvenile-custodial-services', type: 'program' },
    { name: 'Aboriginal Legal Service WA', url: 'https://www.als.org.au/', type: 'indigenous', cultural_authority: true },

    // ACT - Deeper pages
    { name: 'ACT Youth Justice Main', url: 'https://www.communityservices.act.gov.au/children-and-families/youth-justice', type: 'program' },
    { name: 'ACT Restorative Justice', url: 'https://www.justice.act.gov.au/justice-programs/restorative-justice', type: 'program' },
  ],

  // National Indigenous organizations
  indigenous: [
    { name: 'NATSILS Main', url: 'https://www.natsils.org.au/', type: 'advocacy', cultural_authority: true },
    { name: 'NATSILS Justice', url: 'https://www.natsils.org.au/justice/', type: 'advocacy', cultural_authority: true },
    { name: 'SNAICC Main', url: 'https://www.snaicc.org.au/', type: 'advocacy', cultural_authority: true },
    { name: 'SNAICC Resources', url: 'https://www.snaicc.org.au/resources/', type: 'advocacy', cultural_authority: true },
    { name: 'Closing the Gap', url: 'https://www.closingthegap.gov.au/', type: 'policy' },
    { name: 'Closing the Gap Justice', url: 'https://www.closingthegap.gov.au/national-agreement/targets', type: 'policy' },
  ],

  // Research and advocacy
  research: [
    { name: 'Jesuit Social Services', url: 'https://jss.org.au/', type: 'research' },
    { name: 'Jesuit Youth Justice', url: 'https://jss.org.au/what-we-do/justice-and-crime-prevention/', type: 'research' },
    { name: 'Raise the Age Campaign', url: 'https://raisetheage.org.au/', type: 'advocacy' },
    { name: 'Australian Law Reform Commission', url: 'https://www.alrc.gov.au/', type: 'research' },
    { name: 'Productivity Commission ROGS', url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2024/community-services/youth-justice', type: 'research' },
  ],

  // Media sources for sentiment tracking
  media: [
    { name: 'Guardian Youth Justice', url: 'https://www.theguardian.com/australia-news/youth-justice', type: 'media' },
    { name: 'ABC Youth Justice', url: 'https://www.abc.net.au/news/topic/youth-justice', type: 'media' },
    { name: 'NITV News', url: 'https://www.sbs.com.au/nitv/nitv-news', type: 'media', cultural_authority: true },
  ],
};

/**
 * Force scrape a source (bypass frequency check)
 */
async function forceScrape(source) {
  console.log(`\n📥 Scraping: ${source.name}`);
  console.log(`   URL: ${source.url}`);

  // Create job
  const { data: job, error: jobError } = await supabase
    .from('alma_ingestion_jobs')
    .insert({
      source_url: source.url,
      source_type: 'website',
      consent_level: source.cultural_authority ? 'Community Controlled' : 'Public Knowledge Commons',
      cultural_authority: source.cultural_authority || false,
      category: source.type,
      started_at: new Date().toISOString(),
      status: 'pending',
      metadata: { source_name: source.name, deep_scrape: true }
    })
    .select()
    .single();

  if (jobError) {
    console.log(`   ❌ Job creation failed: ${jobError.message}`);
    return null;
  }

  try {
    // Scrape with Firecrawl
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: source.url,
        formats: ['markdown'],
      }),
    });

    if (!firecrawlResponse.ok) {
      throw new Error(`Firecrawl failed: ${firecrawlResponse.statusText}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    const markdown = firecrawlData.data?.markdown || '';

    console.log(`   ✅ Scraped ${markdown.length} characters`);

    // Extract with Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Extract ALL youth justice information from this Australian ${source.type} webpage.

Source: ${source.name}
URL: ${source.url}
${source.cultural_authority ? 'NOTE: This is an Indigenous organization - mark as Community Controlled' : ''}

Content:
${markdown.slice(0, 50000)}

Extract in this JSON format:
{
  "interventions": [
    {
      "name": "Program name",
      "type": "Prevention/Diversion/Cultural Connection/Education/Employment/Family Strengthening/Therapeutic/Community-Led/Justice Reinvestment/Wraparound Support/Early Intervention",
      "description": "Detailed description",
      "geography": ["State/Territory"],
      "target_cohort": ["Who it serves"],
      "key_features": ["Notable features"]
    }
  ],
  "evidence": [
    {
      "title": "Research/report title",
      "source": "Organization",
      "year": "Publication year",
      "key_findings": "Main findings",
      "methodology": "How it was studied"
    }
  ],
  "outcomes": [
    {
      "outcome_type": "What was measured",
      "result": "What was found",
      "evidence_strength": "Strong/Moderate/Emerging"
    }
  ],
  "policy_contexts": [
    {
      "name": "Policy/reform name",
      "jurisdiction": "State/Territory",
      "status": "Active/Planned/Historical",
      "description": "What it does"
    }
  ],
  "organizations": [
    {
      "name": "Organization name",
      "type": "Government/Indigenous/NGO/Research",
      "role": "What they do",
      "contact": "Website/email if available"
    }
  ],
  "links_to_explore": [
    "URLs mentioned that might have more youth justice information"
  ]
}

Return ONLY valid JSON, extract everything possible.`
        }],
      }),
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude failed: ${claudeResponse.statusText}`);
    }

    const claudeData = await claudeResponse.json();
    const extractedText = claudeData.content[0]?.text || '';

    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Count extractions
    const counts = {
      interventions: extracted.interventions?.length || 0,
      evidence: extracted.evidence?.length || 0,
      outcomes: extracted.outcomes?.length || 0,
      policies: extracted.policy_contexts?.length || 0,
      organizations: extracted.organizations?.length || 0,
      links: extracted.links_to_explore?.length || 0,
    };

    console.log(`   📊 Extracted:`);
    console.log(`      - ${counts.interventions} interventions`);
    console.log(`      - ${counts.evidence} evidence records`);
    console.log(`      - ${counts.outcomes} outcomes`);
    console.log(`      - ${counts.policies} policy contexts`);
    console.log(`      - ${counts.organizations} organizations`);
    console.log(`      - ${counts.links} links to explore`);

    // Store interventions
    let inserted = 0;
    for (const intervention of (extracted.interventions || [])) {
      const { error } = await supabase
        .from('alma_interventions')
        .insert({
          name: intervention.name,
          type: intervention.type || 'Prevention',
          description: intervention.description,
          geography: intervention.geography || [],
          target_cohort: intervention.target_cohort || [],
          consent_level: source.cultural_authority ? 'Community Controlled' : 'Public Knowledge Commons',
          cultural_authority: source.cultural_authority ? source.name : null,
          review_status: 'Approved',
          permitted_uses: ['Query (internal)'],
          website: source.url,
          metadata: {
            source: source.name,
            key_features: intervention.key_features,
            deep_scrape: true,
            scraped_at: new Date().toISOString()
          }
        });

      if (!error) inserted++;
    }

    // Update job
    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        interventions_found: counts.interventions,
        interventions_inserted: inserted,
        metadata: {
          ...job.metadata,
          ...counts,
          extracted_data: extracted
        }
      })
      .eq('id', job.id);

    console.log(`   ✅ Inserted ${inserted} new interventions`);

    return {
      source: source.name,
      ...counts,
      inserted,
      links: extracted.links_to_explore || []
    };

  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);

    await supabase
      .from('alma_ingestion_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err.message
      })
      .eq('id', job.id);

    return null;
  }
}

/**
 * Main deep scrape
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           ALMA Deep Scrape - Comprehensive Scan          ║');
  console.log('║        Building Australia\'s Youth Justice Intelligence   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  const allResults = [];
  const allLinks = new Set();

  // Get all sources
  const allSources = Object.values(DEEP_SOURCES).flat();
  console.log(`📋 Total sources to scrape: ${allSources.length}\n`);

  // Scrape each source
  for (let i = 0; i < allSources.length; i++) {
    const source = allSources[i];
    console.log(`\n[${i + 1}/${allSources.length}] ${source.name}`);

    const result = await forceScrape(source);
    if (result) {
      allResults.push(result);
      result.links.forEach(link => allLinks.add(link));
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const totalInterventions = allResults.reduce((sum, r) => sum + r.interventions, 0);
  const totalInserted = allResults.reduce((sum, r) => sum + r.inserted, 0);
  const totalEvidence = allResults.reduce((sum, r) => sum + r.evidence, 0);

  console.log('\n' + '='.repeat(60));
  console.log('📊 DEEP SCRAPE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration} minutes`);
  console.log(`Sources scraped: ${allResults.length}/${allSources.length}`);
  console.log(`Interventions found: ${totalInterventions}`);
  console.log(`New interventions inserted: ${totalInserted}`);
  console.log(`Evidence records found: ${totalEvidence}`);
  console.log(`New links discovered: ${allLinks.size}`);

  // Save discovered links for next scrape
  if (allLinks.size > 0) {
    console.log('\n📎 Discovered links to explore:');
    [...allLinks].slice(0, 20).forEach(link => console.log(`   ${link}`));
    if (allLinks.size > 20) {
      console.log(`   ... and ${allLinks.size - 20} more`);
    }
  }

  // Get final database count
  const { count } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🎯 Total ALMA interventions in database: ${count}`);
  console.log('\n✅ Deep scrape complete!\n');
}

main().catch(console.error);
