#!/usr/bin/env node
/**
 * ALMA weekly digest — produces a markdown report of the last 7 days of
 * enrichment activity. Pipes to stdout by default; with --notion writes
 * to a Notion page (requires NOTION_API_KEY + NOTION_ALMA_DIGEST_PAGE_ID).
 *
 * Designed to be a Monday-morning cron so admin sees movement without
 * having to remember to check the dashboard.
 *
 * Usage:
 *   node scripts/alma-weekly-digest.mjs                   # print markdown
 *   node scripts/alma-weekly-digest.mjs --save digest.md  # write to file
 *   node scripts/alma-weekly-digest.mjs --notion          # publish to Notion
 *   node scripts/alma-weekly-digest.mjs --days 30         # 30-day report
 *
 * Cron:
 *   0 8 * * 1  cd /path/to/JusticeHub && node scripts/alma-weekly-digest.mjs --save logs/digest-$(date +%Y-%m-%d).md
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const days = parseInt(args.find((_, i) => args[i - 1] === '--days') || '7', 10);
const savePath = args[args.indexOf('--save') + 1];
const wantSave = args.includes('--save');
const wantNotion = args.includes('--notion');

function fmtNum(n) {
  return (n || 0).toLocaleString('en-AU');
}

function fmtPct(numerator, denominator) {
  if (!denominator) return '0%';
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

async function main() {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const sinceLabel = new Date(since).toLocaleDateString('en-AU');
  const today = new Date().toLocaleDateString('en-AU');

  // Parallel queries
  const [
    approvedRes,
    rejectedRes,
    outreachRes,
    candidatesProducedRes,
    coverageRes,
    repairLeftRes,
    pendingLeftRes,
    providerRes,
  ] = await Promise.all([
    supabase
      .from('alma_org_enrichment_candidates')
      .select('id, organization_id, provenance, reviewed_at, extracted_fields')
      .eq('status', 'approved')
      .gte('reviewed_at', since)
      .limit(5000),
    supabase
      .from('alma_org_enrichment_candidates')
      .select('id, rejection_reason')
      .eq('status', 'rejected')
      .gte('reviewed_at', since)
      .limit(5000),
    supabase
      .from('organization_outreach_log')
      .select('id, response_status')
      .gte('sent_at', since)
      .limit(5000),
    supabase
      .from('alma_org_enrichment_candidates')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .eq('source', 'website_scrape'),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .neq('archived', true)
      .eq('is_indigenous_org', false)
      .or('website_url.not.is.null,website.not.is.null'),
    supabase
      .from('alma_org_enrichment_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_data_repair'),
    supabase
      .from('alma_org_enrichment_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review'),
    supabase
      .from('alma_org_enrichment_candidates')
      .select('provenance, confidence, status')
      .gte('created_at', since)
      .limit(5000),
  ]);

  const approved = approvedRes.data || [];
  const rejected = rejectedRes.data || [];
  const outreach = outreachRes.data || [];
  const candidatesProduced = candidatesProducedRes.count || 0;
  const eligible = coverageRes.count || 0;
  const repairLeft = repairLeftRes.count || 0;
  const pendingLeft = pendingLeftRes.count || 0;
  const providerRows = providerRes.data || [];

  // Approvals by actor
  const humanApprovals = approved.filter((a) => !a.provenance?.auto_approved_by).length;
  const autoApprovals = approved.length - humanApprovals;

  // Fields filled (count occurrences across approved)
  const fieldsFilled = { email: 0, phone: 0, logo: 0, history: 0, annual_report: 0 };
  for (const a of approved) {
    const ext = a.extracted_fields || {};
    if (ext.contact_email) fieldsFilled.email++;
    if (ext.contact_phone) fieldsFilled.phone++;
    if (ext.logo_url) fieldsFilled.logo++;
    if (ext.history_summary) fieldsFilled.history++;
    if (ext.annual_report_url) fieldsFilled.annual_report++;
  }

  // Reject reasons
  const rejectByReason = {};
  for (const r of rejected) {
    const k = r.rejection_reason || 'unspecified';
    rejectByReason[k] = (rejectByReason[k] || 0) + 1;
  }

  // Outreach response breakdown
  const outreachByStatus = {};
  for (const o of outreach) {
    outreachByStatus[o.response_status] = (outreachByStatus[o.response_status] || 0) + 1;
  }
  const replyRate = outreach.length
    ? ((outreachByStatus.responded || 0) + (outreachByStatus.claimed || 0)) / outreach.length
    : 0;
  const bounceRate = outreach.length ? (outreachByStatus.bounced || 0) / outreach.length : 0;

  // Provider quality this period
  const providerStats = {};
  for (const p of providerRows) {
    const name = p.provenance?.llm_provider;
    if (!name) continue;
    if (!providerStats[name]) providerStats[name] = { count: 0, conf_total: 0, mismatch: 0 };
    providerStats[name].count++;
    providerStats[name].conf_total += Number(p.confidence) || 0;
    if (p.status === 'pending_data_repair') providerStats[name].mismatch++;
  }

  // Drift signal: if any provider's avg confidence dropped below 0.4 in
  // this window, flag it.
  const driftFlags = [];
  for (const [name, s] of Object.entries(providerStats)) {
    if (s.count >= 20) {
      const avg = s.conf_total / s.count;
      if (avg < 0.4) driftFlags.push(`${name} avg confidence ${(avg * 100).toFixed(0)}% (low — check provider)`);
      if (s.mismatch / s.count > 0.5) {
        driftFlags.push(`${name} mismatch rate ${((s.mismatch / s.count) * 100).toFixed(0)}% (high)`);
      }
    }
  }

  // Coverage today
  const { count: approvedTotal } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved');
  const approvedOrgsCovered = approvedTotal || 0; // upper bound; same org can have multiple approvals

  // Build markdown
  const md = `# ALMA enrichment digest

**Window:** ${sinceLabel} → ${today} (${days} days)

## Coverage
- Approvals all-time: **${fmtNum(approvedOrgsCovered)}** (approx ${fmtPct(approvedOrgsCovered, eligible)} of ${fmtNum(eligible)} eligible)
- Pending review queue: **${fmtNum(pendingLeft)}**
- URL repair queue: **${fmtNum(repairLeft)}**

## Last ${days} days

### Approvals
- **${fmtNum(approved.length)}** total — ${fmtNum(humanApprovals)} human · ${fmtNum(autoApprovals)} auto
- Fields landed: email ${fmtNum(fieldsFilled.email)} · phone ${fmtNum(fieldsFilled.phone)} · logo ${fmtNum(fieldsFilled.logo)} · history ${fmtNum(fieldsFilled.history)} · annual_report ${fmtNum(fieldsFilled.annual_report)}

### Rejections
- **${fmtNum(rejected.length)}** total
${Object.entries(rejectByReason)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([k, n]) => `  - ${n}× ${k}`)
  .join('\n')}

### Outreach
- **${fmtNum(outreach.length)}** attempts logged
- Reply rate: **${(replyRate * 100).toFixed(1)}%**, bounce rate: **${(bounceRate * 100).toFixed(1)}%**
${Object.entries(outreachByStatus)
  .sort((a, b) => b[1] - a[1])
  .map(([k, n]) => `  - ${n}× ${k}`)
  .join('\n')}

### New candidates produced
- **${fmtNum(candidatesProduced)}** new rows from website_scrape

### LLM provider quality (this period)
| Provider | Candidates | Avg confidence | Mismatch % |
|---|---|---|---|
${Object.entries(providerStats)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([name, s]) => {
    const avg = (s.conf_total / s.count).toFixed(3);
    const mm = ((s.mismatch / s.count) * 100).toFixed(1);
    return `| ${name} | ${fmtNum(s.count)} | ${avg} | ${mm}% |`;
  })
  .join('\n')}

${
  driftFlags.length > 0
    ? `## ⚠️ Drift signals\n\n${driftFlags.map((d) => `- ${d}`).join('\n')}`
    : '## ✓ No drift signals'
}

---
_Generated by scripts/alma-weekly-digest.mjs at ${new Date().toISOString()}._
`;

  console.log(md);

  if (wantSave && savePath) {
    mkdirSync(dirname(savePath), { recursive: true });
    writeFileSync(savePath, md);
    console.error(`\nSaved to ${savePath}`);
  }

  if (wantNotion) {
    const notionKey = env.NOTION_API_KEY;
    const pageId = env.NOTION_ALMA_DIGEST_PAGE_ID;
    if (!notionKey || !pageId) {
      console.error('--notion requested but NOTION_API_KEY / NOTION_ALMA_DIGEST_PAGE_ID missing');
      process.exit(1);
    }
    // Append as a new child block — simplest path that always works
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${notionKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: `Digest ${today}` } }],
            },
          },
          {
            object: 'block',
            type: 'code',
            code: {
              rich_text: [{ type: 'text', text: { content: md.slice(0, 2000) } }],
              language: 'markdown',
            },
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`Notion publish failed: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
    console.error('Published to Notion.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
