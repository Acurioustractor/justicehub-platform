-- Justice Matrix: Issues (the weave object).
-- An Issue gathers cases + campaigns + evidence around one strategic question,
-- via shared `categories` tags, plus a curated playbook. Powers
-- /justice-matrix/issues and /justice-matrix/issues/[slug].
-- Applied to the live project 2026-05-30 via the Supabase MCP; this file
-- mirrors it for repo reproducibility (idempotent).

CREATE TABLE IF NOT EXISTS justice_matrix_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  question text NOT NULL,
  summary text,
  category_tags text[] NOT NULL DEFAULT '{}',
  hero_case_ids uuid[] DEFAULT '{}',
  playbook text,
  sort_order int DEFAULT 100,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE justice_matrix_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published issues" ON justice_matrix_issues;
CREATE POLICY "public read published issues" ON justice_matrix_issues
  FOR SELECT USING (is_published = true);

CREATE INDEX IF NOT EXISTS idx_jm_issues_category_tags ON justice_matrix_issues USING gin (category_tags);
CREATE INDEX IF NOT EXISTS idx_jm_issues_published ON justice_matrix_issues (is_published, sort_order);

-- Seed: 3 marquee refugee issues. hero_case_ids reference seeded refugee cases;
-- ON CONFLICT keeps this re-runnable without clobbering edits.
INSERT INTO justice_matrix_issues (slug, title, question, summary, category_tags, hero_case_ids, sort_order, playbook) VALUES
(
 'offshore-detention-third-country-transfer',
 'Offshore detention & third-country transfer',
 'When a state tries to move asylum seekers to a third country for processing, when does the law stop it?',
 'How courts constrain sending asylum seekers to a third country, and the advocacy that forced evacuations.',
 ARRAY['third-country-transfers','offshore-processing','offshore-detention','dublin-transfers'],
 ARRAY['590f7d53-9d84-4c28-8945-464dd20b0fba','58c8b528-09b1-4e57-8366-f02120b0f433','e3cfc3c7-26bb-47cc-a70e-267f6431ce09','5092a528-1faa-448c-b5d0-cab5ffa5f681']::uuid[],
 1,
 $pb$**Attack the designation, not the policy.** In *Plaintiff M70* the High Court did not hold offshore processing unlawful in principle. It struck down the Malaysia declaration because Malaysia did not meet the statutory criteria for a safe third country. Narrow the fight to the factual precondition the government has to satisfy.

**Build the receiving-state record.** *M.S.S.* and *N.S.* turned on evidence of systemic deficiencies in the receiving state, not on abstract principle. The win lived in the country-conditions file. The UK Supreme Court took the same path in *AAA (Rwanda)*: a real risk of refoulement from Rwanda's own asylum system made removal unlawful.

**The wall: *Sale*.** The US Supreme Court held non-refoulement did not reach the high seas. Where transfer happens before territory, the protective reasoning thins. Distinguish *Sale*; do not build on it.

**The movement half.** *#KidsOffNauru* narrowed the ask to children first and won evacuations; ARAN and *#GameOver* held the line on resettlement. A concrete, sympathetic group moves a government faster than the principle alone.

**Reusable kit:** the precondition attack (M70) plus the conditions record (M.S.S.) plus the children-first frame (#KidsOffNauru).$pb$
),
(
 'non-refoulement-high-seas',
 'Non-refoulement on the high seas',
 'Does the duty not to return people to danger apply before they reach your shore?',
 'Whether the duty not to return people to danger reaches the high seas: the Hirsi and Sale split.',
 ARRAY['pushbacks','extraterritorial-jurisdiction'],
 ARRAY['39c905da-a842-48b5-b99e-2d6ed8d6f5c4','827400ff-e00f-4705-b49d-66f862f7c361']::uuid[],
 2,
 $pb$**The contrast is the lesson.** *Hirsi Jamaa* (Strasbourg) and *Sale* (US Supreme Court) asked the same question and answered it in opposite directions.

**Hirsi: control, not territory.** Italy violated the Convention by intercepting people at sea and returning them to Libya. Jurisdiction follows effective control: a state that exercises control on the high seas carries its obligations with it. The case paired Article 3 with Article 4 of Protocol 4, so the collective nature of the expulsion did real work.

**Sale: the adverse anchor.** The US Supreme Court read non-refoulement as not binding on the high seas, leaving interdiction lawful in US law. Treat it as the case to distinguish, not the one to avoid.

**What failed.** Arguments that lean on territorial presence concede the ground the state most wants to hold.

**Reusable kit:** lead with extraterritorial-jurisdiction-as-control (Hirsi), pair the non-refoulement claim with a collective-expulsion claim, and document the absence of any individual assessment.$pb$
),
(
 'immigration-detention-oversight',
 'Immigration detention & judicial oversight',
 'Can a state detain non-citizens without a court promptly checking why?',
 'Whether non-citizens can be held without prompt judicial review, across courts and a venue-shifting campaign.',
 ARRAY['detention-conditions','judicial-oversight','jail-use','transit-zones'],
 ARRAY['dbffd6f1-1d3d-4a7c-b992-a4e6f1fec058','752ac316-0588-424e-b9d3-72abaa2933c7']::uuid[],
 3,
 $pb$**Target the missing safeguard.** *Lawyers for Human Rights* (South African Constitutional Court) struck down provisions allowing prolonged detention without prompt judicial review. The handle was the safeguard, not the detention power itself.

**Conditions plus procedure.** *Ilias and Ahmed* (Strasbourg) found violations tied to transit-zone confinement and an inadequate assessment of risk on removal. *M.S.S.* set a reception-and-detention-conditions floor under Article 3.

**Move the venue.** The Canadian End Immigration Detention campaign got every province to stop using provincial jails for immigration detention by September 2025. When the detention-in-principle fight is slow, move the venue fight.

**Reusable kit:** attack the absent prompt-review safeguard, build the conditions record, and where the principle will not move, move the venue.$pb$
)
ON CONFLICT (slug) DO NOTHING;
