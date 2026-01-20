#!/usr/bin/env node
/**
 * ALMA Link Follower - Scrape discovered links
 *
 * Processes the 269+ links discovered during deep scrape.
 * Prioritizes by relevance and extracts new entities.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import FirecrawlApp from '@mendable/firecrawl-js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Generate SHA256 hash of content
 */
function hashContent(content) {
  return createHash('sha256').update(content).digest('hex');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pdfDir = join(root, 'data', 'pdfs');

// Ensure PDF directory exists
if (!existsSync(pdfDir)) {
  mkdirSync(pdfDir, { recursive: true });
}

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

// Initialize LLM clients with fallback chain
const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;
const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;
const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

// Track which provider is working
let currentProvider = 'anthropic';
let providerFailures = { anthropic: 0, groq: 0, openai: 0 };

/**
 * Call LLM with fallback chain: Anthropic -> Groq -> OpenAI
 */
async function callLLMWithFallback(prompt, maxTokens = 4000) {
  const providers = [
    { name: 'anthropic', client: anthropic },
    { name: 'groq', client: groq },
    { name: 'openai', client: openai }
  ].filter(p => p.client && providerFailures[p.name] < 3);

  for (const provider of providers) {
    try {
      let response;

      if (provider.name === 'anthropic') {
        response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        });
        currentProvider = 'anthropic';
        providerFailures.anthropic = 0;
        return response.content[0].text;

      } else if (provider.name === 'groq') {
        response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        });
        currentProvider = 'groq';
        providerFailures.groq = 0;
        return response.choices[0].message.content;

      } else if (provider.name === 'openai') {
        response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        });
        currentProvider = 'openai';
        providerFailures.openai = 0;
        return response.choices[0].message.content;
      }

    } catch (error) {
      const isCreditsError = error.message?.includes('credit') ||
                            error.message?.includes('quota') ||
                            error.message?.includes('rate') ||
                            error.status === 429 ||
                            error.status === 402;

      if (isCreditsError) {
        providerFailures[provider.name]++;
        console.log(`   ⚠️ ${provider.name} unavailable (credits/quota), trying fallback...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error('All LLM providers exhausted');
}

/**
 * Priority keywords for youth justice relevance
 */
const HIGH_PRIORITY_KEYWORDS = [
  'youth-justice',
  'youth-detention',
  'youth-diversion',
  'young-offender',
  'juvenile',
  'youth-program',
  'conferencing',
  'restorative',
  'koori',
  'aboriginal',
  'indigenous',
  'intervention',
  'prevention',
  'recidivism',
  'rehabilitation'
];

/**
 * Detect document type from URL
 */
function detectDocumentType(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('annual-report') || lowerUrl.includes('annualreport')) return 'annual_report';
  if (lowerUrl.includes('budget') || lowerUrl.includes('expenditure')) return 'budget_paper';
  if (lowerUrl.includes('inquiry') || lowerUrl.includes('royal-commission')) return 'inquiry_report';
  if (lowerUrl.includes('evaluation') || lowerUrl.includes('review')) return 'evaluation_report';
  if (lowerUrl.includes('policy') || lowerUrl.includes('strategy')) return 'policy_document';
  if (lowerUrl.includes('research') || lowerUrl.includes('study')) return 'academic_paper';
  if (lowerUrl.includes('statistic') || lowerUrl.includes('data') || lowerUrl.includes('rogs')) return 'statistical_report';
  if (lowerUrl.includes('.gov.au')) return 'government_report';
  return 'other';
}

/**
 * Detect organization from URL
 */
function detectOrganization(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('aihw.gov.au')) return 'Australian Institute of Health and Welfare';
  if (lowerUrl.includes('pc.gov.au')) return 'Productivity Commission';
  if (lowerUrl.includes('abs.gov.au')) return 'Australian Bureau of Statistics';
  if (lowerUrl.includes('aic.gov.au')) return 'Australian Institute of Criminology';
  if (lowerUrl.includes('nsw.gov.au')) return 'NSW Government';
  if (lowerUrl.includes('vic.gov.au')) return 'Victorian Government';
  if (lowerUrl.includes('qld.gov.au')) return 'Queensland Government';
  if (lowerUrl.includes('wa.gov.au')) return 'Western Australian Government';
  if (lowerUrl.includes('sa.gov.au')) return 'South Australian Government';
  if (lowerUrl.includes('nt.gov.au')) return 'Northern Territory Government';
  if (lowerUrl.includes('tas.gov.au')) return 'Tasmanian Government';
  if (lowerUrl.includes('act.gov.au')) return 'ACT Government';
  if (lowerUrl.includes('snaicc.org.au')) return 'SNAICC';
  if (lowerUrl.includes('humanrights.gov.au')) return 'Australian Human Rights Commission';
  return null;
}

/**
 * Detect authority level from URL
 */
function detectAuthorityLevel(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.gov.au')) return 'government_official';
  if (lowerUrl.includes('aihw') || lowerUrl.includes('abs') || lowerUrl.includes('aic')) return 'primary_source';
  if (lowerUrl.includes('university') || lowerUrl.includes('.edu.au')) return 'peer_reviewed';
  if (lowerUrl.includes('snaicc') || lowerUrl.includes('aboriginal') || lowerUrl.includes('indigenous')) return 'community_voice';
  if (lowerUrl.includes('news') || lowerUrl.includes('media')) return 'media';
  return 'grey_literature';
}

const MEDIUM_PRIORITY_KEYWORDS = [
  'youth',
  'children',
  'family',
  'community-service',
  'child-protection',
  'welfare',
  'support-service'
];

/**
 * Calculate link priority based on URL
 */
function calculatePriority(url) {
  const urlLower = url.toLowerCase();

  // High priority
  for (const keyword of HIGH_PRIORITY_KEYWORDS) {
    if (urlLower.includes(keyword)) return 10;
  }

  // Medium priority
  for (const keyword of MEDIUM_PRIORITY_KEYWORDS) {
    if (urlLower.includes(keyword)) return 5;
  }

  // PDF bonus
  if (urlLower.endsWith('.pdf')) return 7;

  // Report/data bonus
  if (urlLower.includes('report') || urlLower.includes('data')) return 6;

  return 1;
}

/**
 * Detect jurisdiction from URL
 */
function detectJurisdiction(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('.vic.gov.au') || urlLower.includes('victoria')) return 'VIC';
  if (urlLower.includes('.qld.gov.au') || urlLower.includes('queensland')) return 'QLD';
  if (urlLower.includes('.nsw.gov.au') || urlLower.includes('new-south-wales')) return 'NSW';
  if (urlLower.includes('.nt.gov.au') || urlLower.includes('northern-territory')) return 'NT';
  if (urlLower.includes('.sa.gov.au') || urlLower.includes('south-australia')) return 'SA';
  if (urlLower.includes('.wa.gov.au') || urlLower.includes('western-australia')) return 'WA';
  if (urlLower.includes('.tas.gov.au') || urlLower.includes('tasmania')) return 'TAS';
  if (urlLower.includes('.act.gov.au') || urlLower.includes('canberra')) return 'ACT';
  if (urlLower.includes('aihw.gov.au') || urlLower.includes('pc.gov.au')) return 'National';

  return 'Unknown';
}

/**
 * Get pending links from database
 */
async function getPendingLinks(limit = 100, priorityFilter = null) {
  let query = supabase
    .from('alma_discovered_links')
    .select('*')
    .eq('status', 'pending');

  // Filter by priority if specified
  if (priorityFilter !== null) {
    query = query.lte('priority', priorityFilter);
  }

  // Order by priority (1 = highest, 5 = lowest)
  // Order by priority DESCENDING (higher priority = process first)
  query = query.order('priority', { ascending: false }).limit(limit);

  const { data: links, error } = await query;

  if (error) {
    console.log(`❌ Error fetching links: ${error.message}`);
    return [];
  }

  return links;
}

/**
 * Update link status
 */
async function updateLinkStatus(id, status, errorMessage = null) {
  await supabase
    .from('alma_discovered_links')
    .update({
      status,
      error_message: errorMessage,
      scraped_at: new Date().toISOString()
    })
    .eq('id', id);
}

/**
 * Check if URL is a PDF
 */
function isPdfUrl(url) {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?') || lowerUrl.includes('/pdf/');
}

/**
 * Download PDF from URL
 */
async function downloadPdf(url) {
  // Create filename from URL
  const urlParts = url.split('/');
  let filename = urlParts[urlParts.length - 1].split('?')[0];
  if (!filename.endsWith('.pdf')) {
    filename = filename.replace(/[^a-z0-9]/gi, '_') + '.pdf';
  }
  const filepath = join(pdfDir, filename);

  // Check if already downloaded
  if (existsSync(filepath)) {
    console.log(`   📁 Using cached: ${filename}`);
    return filepath;
  }

  console.log(`   📥 Downloading PDF...`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 60000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(filepath, Buffer.from(buffer));

    const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(1);
    console.log(`   ✅ Downloaded: ${sizeMB} MB`);

    return filepath;
  } catch (error) {
    console.log(`   ❌ PDF download error: ${error.message}`);
    return null;
  }
}

/**
 * Parse PDF and extract text locally
 */
async function parsePdfLocal(filepath) {
  console.log(`   📄 Parsing PDF locally...`);

  try {
    const buffer = readFileSync(filepath);
    const uint8Array = new Uint8Array(buffer);

    const loadingTask = getDocument({
      data: uint8Array,
      useSystemFonts: true
    });
    const doc = await loadingTask.promise;

    // Extract text from all pages (limit to first 100 pages for very large PDFs)
    let fullText = '';
    const maxPages = Math.min(doc.numPages, 100);

    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
      fullText += pageText + '\n\n';
    }

    console.log(`   ✅ Extracted ${fullText.length} chars from ${maxPages} pages`);

    // Get file stats
    const stats = statSync(filepath);

    return {
      markdown: fullText,
      links: [],
      filePath: filepath,
      fileSize: stats.size,
      pageCount: doc.numPages,
      fileHash: hashContent(fullText)
    };
  } catch (error) {
    console.log(`   ❌ PDF parse error: ${error.message}`);
    return null;
  }
}

/**
 * Scrape a link (handles both web pages and PDFs)
 */
async function scrapeLink(link) {
  console.log(`\n📥 Scraping: ${link.url}`);

  // Skip invalid URLs
  if (link.url.startsWith('mailto:') || link.url.startsWith('tel:')) {
    console.log(`   ⏭️ Skipping non-http URL`);
    return null;
  }

  try {
    // Handle PDFs locally to avoid Firecrawl timeouts
    if (isPdfUrl(link.url)) {
      console.log(`   📑 Detected PDF - processing locally`);
      const filepath = await downloadPdf(link.url);
      if (!filepath) return null;
      return await parsePdfLocal(filepath);
    }

    // Regular web page - use Firecrawl
    const result = await firecrawl.scrapeUrl(link.url, {
      formats: ['markdown', 'links'],
      timeout: 30000
    });

    if (!result || !result.markdown) {
      console.log(`   ⚠️ No content returned`);
      return null;
    }

    console.log(`   ✅ Scraped ${result.markdown.length} chars`);
    return result;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Extract entities from content
 */
async function extractEntities(content, jurisdiction) {
  if (content.length < 200) return null;

  const prompt = `Extract ALL youth justice information from this Australian ${jurisdiction} content. Be THOROUGH.

IMPORTANT: Look for:
1. Programs and services (diversion, rehabilitation, support)
2. Research findings and statistics
3. Royal Commission/Inquiry recommendations
4. Government reports (ROGS, AIHW, ABS data)
5. Court cases or legal precedents
6. Detention facilities
7. Policy changes or reforms

Return ONLY valid JSON (no markdown, no code blocks):
{
  "interventions": [
    {
      "name": "Program/service name",
      "type": "Prevention|Diversion|Cultural Connection|Education/Employment|Family Strengthening|Therapeutic|Community-Led|Justice Reinvestment|Wraparound Support|Early Intervention",
      "description": "Detailed description (2-3 sentences)",
      "target_cohort": ["Target groups"],
      "geography": ["${jurisdiction}", "specific locations"],
      "operating_org": "Organization running it"
    }
  ],
  "research": [
    {
      "title": "Report/study title",
      "source": "Organization (e.g., AIHW, Productivity Commission, University)",
      "year": "Publication year",
      "key_findings": ["Finding 1", "Finding 2"],
      "statistics": [{"metric": "e.g., recidivism rate", "value": "e.g., 54%", "context": "explanation"}]
    }
  ],
  "inquiries": [
    {
      "name": "Inquiry/Royal Commission name",
      "year": "Year",
      "recommendations": ["Key recommendation 1", "Key recommendation 2"],
      "status": "implemented|pending|rejected"
    }
  ],
  "cases": [
    {
      "name": "Case name or citation",
      "year": "Year",
      "significance": "Why this case matters for youth justice",
      "outcome": "What was decided"
    }
  ],
  "statistics": [
    {
      "metric": "What is measured (e.g., youth detention rate)",
      "value": "The number/percentage",
      "year": "Year of data",
      "jurisdiction": "${jurisdiction}",
      "source": "Data source"
    }
  ],
  "fundingMentions": [
    {
      "amount": "Dollar amount",
      "program": "What it funds",
      "year": "Budget year"
    }
  ]
}

Extract EVERYTHING relevant to youth justice - programs, data, recommendations, cases.

Content:
${content.substring(0, 35000)}`;

  try {
    const responseText = await callLLMWithFallback(prompt, 4000);
    if (currentProvider !== 'anthropic') {
      console.log(`   🔄 Using ${currentProvider} for extraction`);
    }

    let jsonText = responseText;
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.log(`   ❌ Extraction error: ${error.message}`);
    return null;
  }
}

/**
 * Store extracted entities with source linking
 */
async function storeEntities(entities, sourceUrl, jurisdiction, rawContentId, sourceDocId) {
  if (!entities) return { inserted: 0, entityIds: [] };

  let inserted = 0;
  const entityIds = [];

  for (const intervention of (entities.interventions || [])) {
    try {
      const { data: existing } = await supabase
        .from('alma_interventions')
        .select('id')
        .ilike('name', intervention.name)
        .limit(1);

      if (existing && existing.length > 0) {
        // Link existing entity to source if we have a source doc
        if (sourceDocId) {
          await linkEntityToSource('intervention', existing[0].id, sourceDocId, {
            citationContext: `Found in ${sourceUrl}`
          });
        }
        continue;
      }

      const { data, error } = await supabase.from('alma_interventions').insert({
        name: intervention.name,
        description: intervention.description,
        type: intervention.type,
        geography: intervention.geography || [jurisdiction],
        target_cohort: intervention.target_cohort || ['Young people aged 10-17'],
        consent_level: 'Public Knowledge Commons',
        review_status: 'Approved',
        permitted_uses: ['Query (internal)'],
        source_url: sourceUrl,
        source_date: new Date().toISOString()
      }).select('id').single();

      if (!error && data) {
        inserted++;
        entityIds.push({ type: 'intervention', id: data.id });
        console.log(`   ✅ Inserted: ${intervention.name}`);

        // Link to raw content
        if (rawContentId) {
          await linkContentToEntity(rawContentId, 'intervention', data.id);
        }

        // Link to source document
        if (sourceDocId) {
          await linkEntityToSource('intervention', data.id, sourceDocId, {
            citationContext: `Extracted from ${sourceUrl}`
          });
        }
      }
    } catch (e) {
      // Skip
    }
  }

  return { inserted, entityIds };
}

/**
 * Store raw content for re-processing and audit trail
 */
async function storeRawContent(url, content, options = {}) {
  const contentHash = hashContent(content);

  // Check if already stored
  const { data: existing } = await supabase
    .from('alma_raw_content')
    .select('id')
    .eq('content_hash', contentHash)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const { data, error } = await supabase
    .from('alma_raw_content')
    .insert({
      source_url: url,
      source_type: options.sourceType || 'webpage',
      raw_content: content,
      content_hash: contentHash,
      file_path: options.filePath || null,
      file_size_bytes: options.fileSize || null,
      file_mime_type: options.mimeType || null,
      file_hash: options.fileHash || null,
      extraction_method: options.extractionMethod || 'firecrawl',
      page_count: options.pageCount || null,
      word_count: content.split(/\s+/).length,
      processing_status: 'pending'
    })
    .select('id')
    .single();

  if (error) {
    console.log(`   ⚠️ Failed to store raw content: ${error.message}`);
    return null;
  }

  return data.id;
}

/**
 * Store source document for PDFs and important reports
 */
async function storeSourceDocument(url, metadata = {}) {
  // Check if already stored
  const { data: existing } = await supabase
    .from('alma_source_documents')
    .select('id')
    .eq('source_url', url)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const { data, error } = await supabase
    .from('alma_source_documents')
    .insert({
      title: metadata.title || url.split('/').pop() || 'Untitled Document',
      document_type: metadata.documentType || 'other',
      source_url: url,
      source_organization: metadata.organization || null,
      file_path: metadata.filePath || null,
      file_name: metadata.fileName || null,
      file_size_bytes: metadata.fileSize || null,
      file_hash: metadata.fileHash || null,
      page_count: metadata.pageCount || null,
      downloaded_at: new Date().toISOString(),
      jurisdiction: metadata.jurisdiction || null,
      authority_level: metadata.authorityLevel || 'grey_literature'
    })
    .select('id')
    .single();

  if (error) {
    console.log(`   ⚠️ Failed to store source document: ${error.message}`);
    return null;
  }

  console.log(`   📄 Stored source document: ${metadata.title || url}`);
  return data.id;
}

/**
 * Link entity to source document
 */
async function linkEntityToSource(entityType, entityId, sourceDocumentId, context = {}) {
  const { error } = await supabase
    .from('alma_entity_sources')
    .upsert({
      entity_type: entityType,
      entity_id: entityId,
      source_document_id: sourceDocumentId,
      page_numbers: context.pageNumbers || null,
      section_reference: context.sectionReference || null,
      citation_context: context.citationContext || null
    }, { onConflict: 'entity_type,entity_id,source_document_id' });

  if (error) {
    console.log(`   ⚠️ Failed to link entity to source: ${error.message}`);
  }
}

/**
 * Link raw content to extracted entity
 */
async function linkContentToEntity(rawContentId, entityType, entityId) {
  if (!rawContentId) return;

  const { error } = await supabase
    .from('alma_content_entities')
    .upsert({
      raw_content_id: rawContentId,
      entity_type: entityType,
      entity_id: entityId,
      extraction_method: 'ai',
      extraction_confidence: 0.8
    }, { onConflict: 'raw_content_id,entity_type,entity_id' });

  if (error) {
    console.log(`   ⚠️ Failed to link content to entity: ${error.message}`);
  }
}

/**
 * Store new discovered links
 */
async function storeNewLinks(links, sourceUrl) {
  let stored = 0;

  for (const url of links) {
    // Skip if already exists
    const { data: existing } = await supabase
      .from('alma_discovered_links')
      .select('id')
      .eq('url', url)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Calculate priority
    const priority = calculatePriority(url);
    const jurisdiction = detectJurisdiction(url);

    // Only store relevant links
    if (priority >= 5) {
      const { error } = await supabase.from('alma_discovered_links').insert({
        url,
        discovered_from: sourceUrl,
        status: 'pending',
        priority,
        jurisdiction_hint: jurisdiction,
        predicted_relevance: priority
      });

      if (!error) stored++;
    }
  }

  return stored;
}

/**
 * Main execution
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const priorityArg = args.find(arg => arg.startsWith('--priority='));
  const limitArg = args.find(arg => arg.startsWith('--limit='));

  const priorityFilter = priorityArg ? parseInt(priorityArg.split('=')[1]) : null;
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          ALMA Link Follower - Exploring Discovered URLs   ║');
  if (priorityFilter !== null) {
    console.log(`║               Processing Priority ${priorityFilter} links (youth justice)   ║`);
  } else {
    console.log('║               Processing pending discovered links         ║');
  }
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Get pending links with optional priority filter
  const links = await getPendingLinks(limit, priorityFilter);
  console.log(`\n📋 Found ${links.length} pending links to process\n`);

  if (links.length === 0) {
    console.log('No pending links to process.');
    return;
  }

  let totalScraped = 0;
  let totalInterventions = 0;
  let totalNewLinks = 0;

  for (const link of links) {
    const jurisdiction = link.jurisdiction_hint || detectJurisdiction(link.url);
    const isPdf = isPdfUrl(link.url);

    // Scrape the link
    const result = await scrapeLink(link);

    if (!result) {
      await updateLinkStatus(link.id, 'error', 'Failed to scrape');
      continue;
    }

    totalScraped++;

    // Store raw content for re-processing and audit trail
    const rawContentId = await storeRawContent(link.url, result.markdown, {
      sourceType: isPdf ? 'pdf' : 'webpage',
      extractionMethod: isPdf ? 'pdfjs' : 'firecrawl',
      filePath: result.filePath || null,
      fileSize: result.fileSize || null,
      pageCount: result.pageCount || null
    });

    // For PDFs, also store as source document for citation linking
    let sourceDocId = null;
    if (isPdf) {
      sourceDocId = await storeSourceDocument(link.url, {
        title: link.title || link.url.split('/').pop().replace('.pdf', ''),
        documentType: detectDocumentType(link.url),
        organization: detectOrganization(link.url),
        jurisdiction: jurisdiction,
        filePath: result.filePath || null,
        pageCount: result.pageCount || null,
        authorityLevel: detectAuthorityLevel(link.url)
      });
    }

    // Extract entities
    const entities = await extractEntities(result.markdown, jurisdiction);

    if (entities && entities.interventions?.length > 0) {
      console.log(`   📊 Found ${entities.interventions.length} interventions`);

      // Store entities with source linking
      const { inserted } = await storeEntities(entities, link.url, jurisdiction, rawContentId, sourceDocId);
      totalInterventions += inserted;
    }

    // Update raw content status
    if (rawContentId) {
      await supabase
        .from('alma_raw_content')
        .update({ processing_status: 'completed', last_processed_at: new Date().toISOString() })
        .eq('id', rawContentId);
    }

    // Store new discovered links
    if (result.links && result.links.length > 0) {
      const newLinks = await storeNewLinks(result.links, link.url);
      if (newLinks > 0) {
        console.log(`   🔗 Discovered ${newLinks} new links`);
        totalNewLinks += newLinks;
      }
    }

    // Mark as scraped
    await updateLinkStatus(link.id, 'scraped');

    // Rate limiting
    await new Promise(r => setTimeout(r, 3000));
  }

  // Summary
  const duration = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('📊 LINK FOLLOWER SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Duration: ${duration} minutes`);
  console.log(`Links processed: ${totalScraped}/${links.length}`);
  console.log(`New interventions: ${totalInterventions}`);
  console.log(`New links discovered: ${totalNewLinks}`);

  // Get current totals
  const { count: interventionCount } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true });

  const { count: pendingCount } = await supabase
    .from('alma_discovered_links')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`\n🎯 Total ALMA interventions: ${interventionCount}`);
  console.log(`📋 Remaining pending links: ${pendingCount}`);
  console.log('\n✅ Link following complete!');
}

main().catch(console.error);
