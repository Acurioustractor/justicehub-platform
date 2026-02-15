import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type ProgramRow = {
  id: string;
  name: string;
  organization: string;
  organization_id: string | null;
  alma_intervention_id: string | null;
  relationship_type: string | null;
};

type OrgRow = {
  id: string;
  name: string;
  slug: string | null;
};

type AlmaRow = {
  id: string;
  name: string;
  operating_organization: string | null;
  linked_community_program_id: string | null;
};

type MatchMethod =
  | 'name_exact'
  | 'name_and_org_exact'
  | 'name_token_overlap'
  | 'organization_anchor_single';

type LinkDecision = {
  program_id: string;
  program_name: string;
  alma_intervention_id: string;
  alma_name: string;
  match_method: MatchMethod;
  confidence: number;
};

type ManualLinkOverride = {
  program_id: string;
  alma_intervention_id: string;
  confidence: number;
  reason: string;
};

// Curated, human-verified overrides only. Keep this list small and auditable.
const MANUAL_LINK_OVERRIDES: ManualLinkOverride[] = [
  {
    program_id: '7d439016-1965-4757-90cf-0cd69257d856',
    alma_intervention_id: '757652ce-05e8-47f3-9d2d-e1fa58e98ea1',
    confidence: 0.99,
    reason:
      'Program description aligns directly with Oochiumpa Youth Services ALMA record (Operation Luna cohort + outcomes).',
  },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalize(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ORG_STOPWORDS = new Set([
  'the',
  'and',
  'pty',
  'ltd',
  'limited',
  'inc',
  'incorporated',
  'co',
  'company',
  'services',
  'service',
  'consultancy',
  'consulting',
  'collective',
  'council',
  'program',
  'programs',
  'initiative',
  'initiatives',
  'group',
  'foundation',
  'association',
  'organisation',
  'organization',
]);

function coreOrganizationName(value: string | null | undefined): string {
  const base = normalize(value);
  if (!base) return '';
  const tokens = base.split(' ').filter((token) => token && !ORG_STOPWORDS.has(token));
  return tokens.join(' ').trim();
}

function containsEitherDirection(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length < 4 || b.length < 4) return false;
  return a.includes(b) || b.includes(a);
}

function tokenOverlapScore(a: string, b: string): number {
  const aTokens = new Set(normalize(a).split(' ').filter(Boolean));
  const bTokens = new Set(normalize(b).split(' ').filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const denominator = Math.max(aTokens.size, bTokens.size);
  return intersection / denominator;
}

async function main() {
  const { data: programs, error: programsError } = await supabase
    .from('registered_services')
    .select('id, name, organization, organization_id, alma_intervention_id, relationship_type');
  if (programsError) throw programsError;

  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug');
  if (orgError) throw orgError;

  const { data: interventions, error: interventionsError } = await supabase
    .from('alma_interventions')
    .select('id, name, operating_organization, linked_community_program_id');
  if (interventionsError) throw interventionsError;

  const orgRows = (organizations || []) as OrgRow[];
  const programRows = (programs || []) as ProgramRow[];
  const almaRows = (interventions || []) as AlmaRow[];

  const orgByAlias = new Map<string, OrgRow[]>();
  const orgSearchIndex: Array<{
    org: OrgRow;
    fullName: string;
    coreName: string;
    slug: string;
    coreSlug: string;
  }> = [];

  function addOrgAlias(alias: string, org: OrgRow) {
    if (!alias) return;
    const list = orgByAlias.get(alias) || [];
    list.push(org);
    orgByAlias.set(alias, list);
  }

  for (const org of orgRows) {
    const fullName = normalize(org.name);
    const coreName = coreOrganizationName(org.name);
    const slug = normalize(org.slug || '');
    const coreSlug = coreOrganizationName(org.slug || '');
    addOrgAlias(fullName, org);
    addOrgAlias(coreName, org);
    addOrgAlias(slug, org);
    addOrgAlias(coreSlug, org);
    orgSearchIndex.push({ org, fullName, coreName, slug, coreSlug });
  }

  const organizationMatches: Array<{ program_id: string; organization_id: string; method: string }> = [];
  const organizationNeedsReview: Array<{ program_id: string; organization: string }> = [];

  for (const program of programRows) {
    if (program.organization_id) continue;
    const normalized = normalize(program.organization);
    const coreNormalized = coreOrganizationName(program.organization);
    const directMatches = [
      ...(orgByAlias.get(normalized) || []),
      ...(orgByAlias.get(coreNormalized) || []),
    ];
    const uniqueDirect = new Map(directMatches.map((match) => [match.id, match]));
    const matches = [...uniqueDirect.values()];

    if (matches.length === 1) {
      const matchedOrg = matches[0];
      const { error } = await supabase
        .from('registered_services')
        .update({ organization_id: matchedOrg.id })
        .eq('id', program.id);
      if (error) {
        console.error('Failed to update organization_id', program.id, error.message);
      } else {
        organizationMatches.push({
          program_id: program.id,
          organization_id: matchedOrg.id,
          method: 'organization_alias_exact',
        });
      }
      continue;
    }

    type Candidate = { org: OrgRow; score: number; method: string };
    const candidates: Candidate[] = [];
    for (const entry of orgSearchIndex) {
      const candidateFulls = [entry.fullName, entry.slug].filter(Boolean);
      const candidateCores = [entry.coreName, entry.coreSlug].filter(Boolean);

      if (candidateFulls.includes(normalized) || candidateCores.includes(coreNormalized)) {
        candidates.push({ org: entry.org, score: 1, method: 'organization_alias_exact' });
        continue;
      }

      if (
        containsEitherDirection(normalized, entry.fullName) ||
        containsEitherDirection(normalized, entry.slug)
      ) {
        candidates.push({ org: entry.org, score: 0.97, method: 'organization_alias_contains' });
        continue;
      }

      if (
        containsEitherDirection(coreNormalized, entry.coreName) ||
        containsEitherDirection(coreNormalized, entry.coreSlug)
      ) {
        candidates.push({ org: entry.org, score: 0.94, method: 'organization_core_contains' });
        continue;
      }

      const overlap = Math.max(
        tokenOverlapScore(coreNormalized, entry.coreName),
        tokenOverlapScore(coreNormalized, entry.coreSlug)
      );
      if (overlap >= 0.92) {
        candidates.push({
          org: entry.org,
          score: Number(overlap.toFixed(2)),
          method: 'organization_core_overlap',
        });
      }
    }

    const byOrgId = new Map<string, Candidate>();
    for (const candidate of candidates) {
      const existing = byOrgId.get(candidate.org.id);
      if (!existing || candidate.score > existing.score) {
        byOrgId.set(candidate.org.id, candidate);
      }
    }
    const ranked = [...byOrgId.values()].sort((a, b) => b.score - a.score);

    const top = ranked[0];
    const runnerUp = ranked[1];
    if (top && top.score >= 0.94 && (!runnerUp || top.score - runnerUp.score >= 0.05)) {
      const { error } = await supabase
        .from('registered_services')
        .update({ organization_id: top.org.id })
        .eq('id', program.id);
      if (error) {
        console.error('Failed to update organization_id', program.id, error.message);
      } else {
        organizationMatches.push({
          program_id: program.id,
          organization_id: top.org.id,
          method: top.method,
        });
      }
    } else {
      organizationNeedsReview.push({ program_id: program.id, organization: program.organization });
    }
  }

  const almaByName = new Map<string, AlmaRow[]>();
  for (const alma of almaRows) {
    const key = normalize(alma.name);
    if (!key) continue;
    const list = almaByName.get(key) || [];
    list.push(alma);
    almaByName.set(key, list);
  }

  const linkUpdates: LinkDecision[] = [];
  const linkNeedsReview: Array<{ program_id: string; program_name: string; reason: string }> = [];
  const manualOverridesApplied: Array<{
    program_id: string;
    alma_intervention_id: string;
    confidence: number;
    reason: string;
  }> = [];

  for (const program of programRows) {
    if (program.alma_intervention_id) continue;

    const normalizedProgramName = normalize(program.name);
    const nameExactMatches = almaByName.get(normalizedProgramName) || [];

    let bestMatch: LinkDecision | null = null;
    const manualOverride = MANUAL_LINK_OVERRIDES.find(
      (override) => override.program_id === program.id
    );
    if (manualOverride) {
      const manualAlma = almaRows.find((row) => row.id === manualOverride.alma_intervention_id);
      if (manualAlma) {
        const alreadyLinkedToOtherProgram =
          manualAlma.linked_community_program_id &&
          manualAlma.linked_community_program_id !== program.id;
        if (!alreadyLinkedToOtherProgram) {
          bestMatch = {
            program_id: program.id,
            program_name: program.name,
            alma_intervention_id: manualAlma.id,
            alma_name: manualAlma.name,
            match_method: 'organization_anchor_single',
            confidence: manualOverride.confidence,
          };
          manualOverridesApplied.push({
            program_id: manualOverride.program_id,
            alma_intervention_id: manualOverride.alma_intervention_id,
            confidence: manualOverride.confidence,
            reason: manualOverride.reason,
          });
        }
      }
    }

    if (!bestMatch && nameExactMatches.length === 1) {
      bestMatch = {
        program_id: program.id,
        program_name: program.name,
        alma_intervention_id: nameExactMatches[0].id,
        alma_name: nameExactMatches[0].name,
        match_method: 'name_exact',
        confidence: 0.97,
      };
    } else if (!bestMatch && nameExactMatches.length > 1) {
      const orgExact = nameExactMatches.filter(
        (match) => normalize(match.operating_organization) === normalize(program.organization)
      );
      if (orgExact.length === 1) {
        bestMatch = {
          program_id: program.id,
          program_name: program.name,
          alma_intervention_id: orgExact[0].id,
          alma_name: orgExact[0].name,
          match_method: 'name_and_org_exact',
          confidence: 0.99,
        };
      }
    }

    if (!bestMatch) {
      let candidate: AlmaRow | null = null;
      let bestScore = 0;
      for (const intervention of almaRows) {
        if (
          intervention.linked_community_program_id &&
          intervention.linked_community_program_id !== program.id
        ) {
          continue;
        }
        const score = tokenOverlapScore(program.name, intervention.name);
        if (score > bestScore) {
          bestScore = score;
          candidate = intervention;
        }
      }
      if (candidate && bestScore >= 0.85) {
        bestMatch = {
          program_id: program.id,
          program_name: program.name,
          alma_intervention_id: candidate.id,
          alma_name: candidate.name,
          match_method: 'name_token_overlap',
          confidence: Number(bestScore.toFixed(2)),
        };
      }
    }

    if (!bestMatch) {
      const programOrgFull = normalize(program.organization);
      const programOrgCore = coreOrganizationName(program.organization);

      const orgAnchoredCandidates = almaRows.filter((intervention) => {
        if (
          intervention.linked_community_program_id &&
          intervention.linked_community_program_id !== program.id
        ) {
          return false;
        }
        const interventionOrg = normalize(intervention.operating_organization);
        const interventionName = normalize(intervention.name);
        const interventionOrgCore = coreOrganizationName(intervention.operating_organization);
        const interventionNameCore = coreOrganizationName(intervention.name);
        return (
          containsEitherDirection(programOrgFull, interventionOrg) ||
          containsEitherDirection(programOrgFull, interventionName) ||
          containsEitherDirection(programOrgCore, interventionOrgCore) ||
          containsEitherDirection(programOrgCore, interventionNameCore)
        );
      });

      if (orgAnchoredCandidates.length === 1) {
        const candidate = orgAnchoredCandidates[0];
        bestMatch = {
          program_id: program.id,
          program_name: program.name,
          alma_intervention_id: candidate.id,
          alma_name: candidate.name,
          match_method: 'organization_anchor_single',
          confidence: 0.9,
        };
      }
    }

    if (!bestMatch || bestMatch.confidence < 0.9) {
      linkNeedsReview.push({
        program_id: program.id,
        program_name: program.name,
        reason: bestMatch ? `Low confidence (${bestMatch.confidence})` : 'No deterministic match',
      });
      continue;
    }

    const relationshipType = `alma_${bestMatch.match_method}`;
    const { error: updateProgramError } = await supabase
      .from('registered_services')
      .update({
        alma_intervention_id: bestMatch.alma_intervention_id,
        relationship_type: relationshipType,
      })
      .eq('id', program.id);

    if (updateProgramError) {
      console.error('Failed to update registered_services link', program.id, updateProgramError.message);
      continue;
    }

    await supabase
      .from('alma_interventions')
      .update({ linked_community_program_id: program.id })
      .eq('id', bestMatch.alma_intervention_id)
      .is('linked_community_program_id', null);

    linkUpdates.push(bestMatch);
  }

  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      programs_total: programRows.length,
      organizations_matched: organizationMatches.length,
      organizations_needing_review: organizationNeedsReview.length,
      links_created: linkUpdates.length,
      links_needing_review: linkNeedsReview.length,
      manual_overrides_applied: manualOverridesApplied.length,
    },
    manual_overrides_applied: manualOverridesApplied,
    organization_matches: organizationMatches,
    organization_needs_review: organizationNeedsReview.slice(0, 200),
    link_updates: linkUpdates,
    link_needs_review: linkNeedsReview.slice(0, 300),
  };

  const outputPath = path.resolve(process.cwd(), 'scripts/jobs/output/link-programs-to-alma-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('Linking completed.');
  console.log(`- Organization matches: ${organizationMatches.length}`);
  console.log(`- Program links created: ${linkUpdates.length}`);
  console.log(`- Review queue: ${organizationNeedsReview.length + linkNeedsReview.length}`);
  console.log(`- Report: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error('Failed to link programs to ALMA');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
