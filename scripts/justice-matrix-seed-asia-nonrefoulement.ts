#!/usr/bin/env npx tsx
/**
 * Seed the Asian non-refoulement jurisprudence (SE Asia / "Asian court reports"
 * gap from the Background Paper). Genuine ASEAN refugee case law is sparse - most
 * member states are not Refugee Convention parties - so the most developed Asian
 * common-law non-refoulement line is Hong Kong's Court of Final Appeal. These
 * three build on each other (Prabakar -> Ubamaka -> C) and are relied on across
 * the region. Malaysia's 2021 Rohingya deportation JR and the Philippines RSD
 * mechanism are real candidates but lack a clean citable court link; see the
 * Pacific/SE-Asia scoping note. Refworld is the scalable regional channel.
 *
 * Hand-curated, no scraping. Dual-control: source=seed_data, verified=true (link
 * confirmed), human_confirmed=false. Skips citations already present.
 *
 * Usage:
 *   npx tsx scripts/justice-matrix-seed-asia-nonrefoulement.ts            (dry run)
 *   npx tsx scripts/justice-matrix-seed-asia-nonrefoulement.ts --apply
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce<Record<string, string>>((acc, l) => {
    const [k, ...v] = l.split('=');
    acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const CANONICAL_BOTBLOCK = /hklii\.hk|refworld\.org|paclii\.org|austlii\.edu\.au|ohchr\.org|un\.org/i;

const CATS = ['refugee', 'asylum', 'non-refoulement', 'torture (CAT)'];

const SEEDS = [
  {
    case_citation: 'Secretary for Security v Sakthevel Prabakar (2004) 7 HKCFAR 187',
    jurisdiction: 'Hong Kong',
    year: 2004,
    court: 'Hong Kong Court of Final Appeal',
    strategic_issue:
      'Standard of fairness required when the government assesses whether removing a person would expose them to a risk of torture (non-refoulement under the Convention against Torture).',
    key_holding:
      'A determination of torture risk concerns life, limb and fundamental rights, so high standards of fairness apply and the courts will subject it to rigorous examination and anxious scrutiny. The foundational Hong Kong non-refoulement decision.',
    authoritative_link: 'https://www.refworld.org/jurisprudence/caselaw/hkcfa/2004/en/13412',
    outcome: 'favorable',
  },
  {
    case_citation: 'Ubamaka Edward Wilson v Secretary for Security (2012) 15 HKCFAR 743; [2012] HKCFA 87',
    jurisdiction: 'Hong Kong',
    year: 2012,
    court: 'Hong Kong Court of Final Appeal',
    strategic_issue:
      'Whether the protection against torture and cruel, inhuman or degrading treatment (article 3 of the Bill of Rights Ordinance, reflecting ICCPR article 7) is absolute, and whether the Director must assess that risk before removal.',
    key_holding:
      'Article 3 BORO rights are non-derogable and absolute, not limited by the immigration reservation. Where non-refoulement protection is claimed the Director of Immigration must determine whether removal would expose the person to a genuine risk of torture or CIDTP before exercising the power of removal.',
    authoritative_link: 'https://www.hklii.hk/cgi-bin/sinodisp/eng/hk/cases/hkcfa/2012/87.html',
    outcome: 'favorable',
  },
  {
    case_citation: 'C v Director of Immigration [2013] HKCFA 21; (2013) 16 HKCFAR 280 (FACV 18-20/2011)',
    jurisdiction: 'Hong Kong',
    year: 2013,
    court: 'Hong Kong Court of Final Appeal',
    strategic_issue:
      'Whether the duty to assess risk before removal extends beyond torture to a well-founded fear of persecution, when UNHCR (not the government) conducts refugee status determination in Hong Kong.',
    key_holding:
      'The Director of Immigration must independently and fairly determine a claim that removal would expose the person to a risk of persecution before exercising the power to remove or deport, and cannot simply defer to UNHCR. Extended high-fairness non-refoulement review to persecution claims.',
    authoritative_link: 'https://www.hklii.hk/cgi-bin/sinodisp/eng/hk/cases/hkcfa/2013/21.html',
    outcome: 'favorable',
  },
];

async function linkOk(url: string): Promise<string> {
  const headers = {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    accept: 'text/html,*/*;q=0.8',
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    let res: Response;
    try { res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers }); }
    catch { res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers }); }
    if (res.ok || (res.status >= 300 && res.status < 400)) return `ok ${res.status}`;
    if (res.status === 403 && CANONICAL_BOTBLOCK.test(url)) return '403 bot-block (canonical)';
    return `BAD ${res.status}`;
  } catch (e) { return `BAD ${(e as Error).message?.slice(0, 40)}`; } finally { clearTimeout(t); }
}

async function run() {
  console.log(`\nAsia non-refoulement seed (SE Asia gap)  |  ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const now = new Date().toISOString();
  let inserted = 0, skipped = 0;
  for (const s of SEEDS) {
    const frag = s.case_citation.split(/[;(]/)[0].slice(0, 36);
    const { data: existing } = await supabase.from('justice_matrix_cases').select('id').ilike('case_citation', `%${frag}%`).limit(1);
    if (existing && existing.length) { console.log(`  skip (exists)  ${frag}`); skipped++; continue; }
    const status = await linkOk(s.authoritative_link);
    const verified = !status.startsWith('BAD');
    console.log(`  ${verified ? 'ADD ' : 'ADD?'} [link ${status}]  ${s.case_citation.slice(0, 56)}`);
    if (APPLY) {
      const { error } = await supabase.from('justice_matrix_cases').insert({
        case_citation: s.case_citation, jurisdiction: s.jurisdiction, year: s.year, court: s.court,
        strategic_issue: s.strategic_issue, key_holding: s.key_holding, authoritative_link: s.authoritative_link,
        country_code: 'HK', region: 'Asia', categories: CATS, case_type: 'court_decision',
        outcome: s.outcome, precedent_strength: 'high', source: 'seed_data',
        verified, verified_by: verified ? 'curated-seed (link-verified)' : null, verified_at: verified ? now : null,
        human_confirmed: false, created_at: now, updated_at: now,
      });
      if (error) { console.log(`    ! insert failed: ${error.message}`); continue; }
    }
    inserted++;
  }
  console.log(`\n${APPLY ? 'Inserted' : 'Would insert'} ${inserted}  |  skipped ${skipped}.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
