#!/usr/bin/env npx tsx
/**
 * Seed the offshore-detention / regional-processing jurisprudence (refugee
 * re-centring). These are the landmark cases the Background Paper's tool exists
 * to surface: Australia's policy adjudicated across Australian, Pacific and UN
 * fora. Hand-curated (no scraping), each with a verified official-source link.
 *
 * Governance (matches the paper's dual-control): source='seed_data',
 * verified=true ONLY when the authoritative link resolves (or is a known
 * canonical domain that bot-blocks HEAD), human_confirmed=false (a pro bono
 * legal reviewer still signs off). Skips any citation already in the matrix.
 *
 * Usage:
 *   npx tsx scripts/justice-matrix-seed-offshore-detention.ts            (dry run + link check)
 *   npx tsx scripts/justice-matrix-seed-offshore-detention.ts --apply
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

// Domains that legitimately 403 a bot HEAD but are the canonical source.
const CANONICAL_BOTBLOCK = /paclii\.org|austlii\.edu\.au|refworld\.org|ohchr\.org|un\.org/i;

interface Seed {
  case_citation: string;
  jurisdiction: string;
  year: number;
  court: string;
  strategic_issue: string;
  key_holding: string;
  authoritative_link: string;
  country_code: string;
  region: string;
  categories: string[];
  outcome: 'favorable' | 'adverse';
  precedent_strength: 'high' | 'medium' | 'low';
}

const REFUGEE_CATS = ['refugee', 'asylum', 'non-refoulement', 'immigration detention'];

const SEEDS: Seed[] = [
  {
    case_citation: 'Namah v Pato [2016] PGSC 13; SC1497',
    jurisdiction: 'Papua New Guinea',
    year: 2016,
    court: 'Supreme Court of Papua New Guinea',
    strategic_issue:
      'Legality of Australia\'s offshore detention of asylum seekers transferred to the Manus Island Regional Processing Centre under the Australia-PNG arrangement; right to personal liberty under s42 of the PNG Constitution.',
    key_holding:
      'Detention of the transferees was unconstitutional and illegal. The 2014 constitutional amendment purporting to authorise detention of foreign nationals under a bilateral arrangement was invalid. The Court ordered both governments to take immediate steps to end the detention; PNG announced the centre would close the next day.',
    authoritative_link: 'http://www.paclii.org/pg/cases/PGSC/2016/13.html',
    country_code: 'PG',
    region: 'Asia Pacific',
    categories: [...REFUGEE_CATS, 'offshore processing', 'regional processing'],
    outcome: 'favorable',
    precedent_strength: 'high',
  },
  {
    case_citation: 'A v Australia, Communication No. 560/1993, UN Doc CCPR/C/59/D/560/1993',
    jurisdiction: 'International (UN Human Rights Committee)',
    year: 1997,
    court: 'UN Human Rights Committee',
    strategic_issue:
      'Whether prolonged mandatory immigration detention of an asylum seeker (over three years) breached the prohibition on arbitrary detention and the right to judicial review of detention under ICCPR article 9.',
    key_holding:
      'Immigration detention is not arbitrary per se, but must be justified as reasonable, necessary and proportionate in the circumstances and reassessed as it continues. Australia breached article 9(1) and 9(4). The first major international ruling against Australia\'s mandatory detention regime.',
    authoritative_link: 'https://www.refworld.org/jurisprudence/caselaw/hrc/1997/en/95885',
    country_code: 'AU',
    region: 'International',
    categories: [...REFUGEE_CATS, 'arbitrary detention', 'ICCPR'],
    outcome: 'favorable',
    precedent_strength: 'high',
  },
  {
    case_citation: 'Plaintiff M68/2015 v Minister for Immigration and Border Protection [2016] HCA 1',
    jurisdiction: 'Australia (National)',
    year: 2016,
    court: 'High Court of Australia',
    strategic_issue:
      'Constitutional validity of the Commonwealth\'s participation in and funding of the detention of asylum seekers at the Nauru Regional Processing Centre.',
    key_holding:
      'The Commonwealth\'s conduct in procuring and funding the Nauru detention was authorised by s198AHA of the Migration Act and was constitutionally valid. Offshore detention upheld under Australian law, the direct counterpoint to Namah v Pato in PNG.',
    authoritative_link: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2016/1.html',
    country_code: 'AU',
    region: 'Asia Pacific',
    categories: [...REFUGEE_CATS, 'offshore processing', 'regional processing'],
    outcome: 'adverse',
    precedent_strength: 'high',
  },
  {
    case_citation: 'NZYQ v Minister for Immigration, Citizenship and Multicultural Affairs [2023] HCA 37',
    jurisdiction: 'Australia (National)',
    year: 2023,
    court: 'High Court of Australia',
    strategic_issue:
      'Whether indefinite immigration detention of a non-citizen who cannot be removed in the reasonably foreseeable future is within Commonwealth power.',
    key_holding:
      'Indefinite detention where there is no real prospect of removal in the reasonably foreseeable future is punitive and beyond the power conferred by the Migration Act and the Constitution. Overruled Al-Kateb v Godwin and ordered release. A landmark reversal.',
    authoritative_link: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2023/37.html',
    country_code: 'AU',
    region: 'Asia Pacific',
    categories: [...REFUGEE_CATS, 'indefinite detention'],
    outcome: 'favorable',
    precedent_strength: 'high',
  },
  {
    case_citation: 'Al-Kateb v Godwin [2004] HCA 37',
    jurisdiction: 'Australia (National)',
    year: 2004,
    court: 'High Court of Australia',
    strategic_issue:
      'Whether a stateless person who cannot be removed from Australia may be detained indefinitely under the Migration Act.',
    key_holding:
      'By a 4:3 majority the Migration Act authorised indefinite detention of a non-citizen who could not be removed, and that detention was constitutionally valid. Overruled in 2023 by NZYQ; included as the precedent NZYQ displaced.',
    authoritative_link: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2004/37.html',
    country_code: 'AU',
    region: 'Asia Pacific',
    categories: [...REFUGEE_CATS, 'indefinite detention'],
    outcome: 'adverse',
    precedent_strength: 'high',
  },
  {
    case_citation: 'CPCF v Minister for Immigration and Border Protection [2015] HCA 1',
    jurisdiction: 'Australia (National)',
    year: 2015,
    court: 'High Court of Australia',
    strategic_issue:
      'Lawfulness of detaining at sea, and taking towards another country, a group of Tamil asylum seekers intercepted en route to Australia.',
    key_holding:
      'By a 4:3 majority the Maritime Powers Act authorised the detention of the asylum seekers at sea; the detention was lawful and no damages were payable.',
    authoritative_link: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2015/1.html',
    country_code: 'AU',
    region: 'Asia Pacific',
    categories: [...REFUGEE_CATS, 'interception at sea', 'non-refoulement'],
    outcome: 'adverse',
    precedent_strength: 'high',
  },
  {
    case_citation: 'Plaintiff S156/2013 v Minister for Immigration and Border Protection [2014] HCA 22',
    jurisdiction: 'Australia (National)',
    year: 2014,
    court: 'High Court of Australia',
    strategic_issue:
      'Validity of the designation of Papua New Guinea as a regional processing country and the removal of asylum seekers there under the Migration Act.',
    key_holding:
      'The designation power and the removal provisions (ss198AB and 198AD) were within Commonwealth legislative power and valid; the challenge to offshore processing failed.',
    authoritative_link: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2014/22.html',
    country_code: 'AU',
    region: 'Asia Pacific',
    categories: [...REFUGEE_CATS, 'offshore processing', 'regional processing'],
    outcome: 'adverse',
    precedent_strength: 'high',
  },
  {
    case_citation: 'Ruddock v Vadarlis [2001] FCA 1329 (the Tampa case)',
    jurisdiction: 'Australia (National)',
    year: 2001,
    court: 'Federal Court of Australia (Full Court)',
    strategic_issue:
      'Whether the Commonwealth executive had power, absent statutory authority, to detain and remove asylum seekers rescued by the MV Tampa and prevent them entering Australia.',
    key_holding:
      'By a 2:1 majority the executive had a non-statutory power under s61 of the Constitution to prevent non-citizens entering Australia and to detain them for that purpose; the first-instance habeas order was reversed. The case that opened the Pacific Solution.',
    authoritative_link: 'https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/FCA/2001/1329.html',
    country_code: 'AU',
    region: 'Asia Pacific',
    categories: [...REFUGEE_CATS, 'executive power', 'interception at sea'],
    outcome: 'adverse',
    precedent_strength: 'high',
  },
];

async function linkStatus(url: string): Promise<{ ok: boolean; note: string }> {
  const headers = {
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    accept: 'text/html,*/*;q=0.8',
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    let res: Response;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers });
    } catch {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers });
    }
    if (res.ok || (res.status >= 300 && res.status < 400)) return { ok: true, note: `${res.status}` };
    if (res.status === 403 && CANONICAL_BOTBLOCK.test(url)) return { ok: true, note: '403 bot-block (canonical, accepted)' };
    return { ok: false, note: `${res.status}` };
  } catch (e) {
    return { ok: false, note: (e as Error).message?.slice(0, 50) || 'fetch error' };
  } finally {
    clearTimeout(t);
  }
}

async function run() {
  console.log(`\nOffshore-detention seed (refugee re-centring)  |  ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const now = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;
  let linkBad = 0;

  for (const s of SEEDS) {
    // Dedup on a distinctive citation fragment (the neutral citation).
    const frag = s.case_citation.split(';')[0].slice(0, 40);
    const { data: existing } = await supabase
      .from('justice_matrix_cases')
      .select('id')
      .ilike('case_citation', `%${frag}%`)
      .limit(1);
    if (existing && existing.length) {
      console.log(`  skip (exists)  ${s.case_citation.slice(0, 60)}`);
      skipped++;
      continue;
    }

    const link = await linkStatus(s.authoritative_link);
    if (!link.ok) linkBad++;
    const verified = link.ok;
    console.log(`  ${verified ? 'ADD ' : 'ADD?'} [link ${link.note}]  ${s.case_citation.slice(0, 60)}`);

    if (APPLY) {
      const { error } = await supabase.from('justice_matrix_cases').insert({
        case_citation: s.case_citation,
        jurisdiction: s.jurisdiction,
        year: s.year,
        court: s.court,
        strategic_issue: s.strategic_issue,
        key_holding: s.key_holding,
        authoritative_link: s.authoritative_link,
        country_code: s.country_code,
        region: s.region,
        categories: s.categories,
        case_type: 'court_decision',
        outcome: s.outcome,
        precedent_strength: s.precedent_strength,
        source: 'seed_data',
        verified, // true only when the official link resolves
        verified_by: verified ? 'curated-seed (link-verified)' : null,
        verified_at: verified ? now : null,
        human_confirmed: false, // awaits pro bono legal review (dual-control)
        created_at: now,
        updated_at: now,
      });
      if (error) {
        console.log(`    ! insert failed: ${error.message}`);
        continue;
      }
    }
    inserted++;
  }

  console.log(
    `\n${APPLY ? 'Inserted' : 'Would insert'} ${inserted}  |  skipped ${skipped} (already present)  |  links failing verify ${linkBad}.`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
