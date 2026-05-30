-- Justice Matrix Issues: add a `surface` gate + 5 more issues (1 refugee, 4 youth).
-- The surface gate stops shared category tags (e.g. detention-conditions, used by
-- both refugee and youth cases) from bleeding across domains: a refugee issue
-- shows only refugee/asylum items, a youth issue only the domestic ones.
-- Applied to the live project 2026-05-30 via the Supabase MCP; mirrored here.

ALTER TABLE justice_matrix_issues ADD COLUMN IF NOT EXISTS surface text NOT NULL DEFAULT 'refugee';
COMMENT ON COLUMN justice_matrix_issues.surface IS 'refugee | youth | all — gates which domain of cases/campaigns the issue gathers';

INSERT INTO justice_matrix_issues (slug, title, question, summary, surface, category_tags, hero_case_ids, sort_order, playbook) VALUES
(
 'access-to-asylum-transit-bans',
 'Access to asylum & the spread of transit bans',
 'Can a government switch off the right to claim asylum at its border?',
 'Litigation and advocacy against transit bans, entry restrictions, and rules that close the asylum door.',
 'refugee',
 ARRAY['asylum-access','border-restrictions','asylum-eligibility','executive-authority'],
 ARRAY['c3eea579-d481-482e-bf08-eab00d0015fa','7e5afb31-3690-4d9b-a532-374bdee02173','a3d34db0-0148-4b7b-8ead-17f3c2ed4e04']::uuid[],
 4,
 $pb$**Tie the rule to the statute.** *East Bay Sanctuary* and *Innovation Law Lab* both ran on the gap between an executive rule and what the immigration statute actually allows. The administrative-law and statutory-consistency arguments did the work, not sympathy.

**Protect the act of applying.** *Ruta* (South Africa) held the right to apply for asylum survives delay and even a criminal conviction; the Refugees Act read with non-refoulement governs over deportation. The win was procedural: you cannot be removed before your claim is heard.

**The movement half.** #WelcomeWithDignity coordinated the US civil-society response to asylum bans; the Canadian Council for Refugees fought the Safe Third Country Agreement. Both kept a public counter-narrative alive while the litigation ran.

**Reusable kit:** challenge the rule as beyond the statute (East Bay), defend the right to *apply* as distinct from the right to stay (Ruta), and pair litigation with a standing rapid-response coalition.$pb$
),
(
 'raise-the-age',
 'Raising the age of criminal responsibility',
 'How young is too young to be held criminally responsible, and why does the line keep moving?',
 'The campaign to lift the minimum age of criminal responsibility to at least 14, and the states that moved both ways.',
 'youth',
 ARRAY['raise-the-age','age-of-responsibility'],
 ARRAY['f88f81c9-05a5-4804-b517-698c8c7d91e4','06fc870e-cb2f-4d2f-9dcb-ed469ab12d07','c8017076-6818-4c30-97ff-71117bee3f10']::uuid[],
 5,
 $pb$**The medical consensus is the lever.** The case for 14 rests on brain-development evidence and the UN Committee on the Rights of the Child. Lead with the science, not the sentiment.

**Progress is not linear.** The ACT moved to 14 and Victoria legislated a rise in 2024; the Northern Territory reversed back to 10. The same reform can be won and lost in different jurisdictions in the same year. Treat each parliament as its own fight.

**The movement half.** The national Raise the Age coalition held one ask across every jurisdiction, which let a win in one place become pressure in the next.

**Reusable kit:** anchor on the developmental evidence and the international standard, run the fight jurisdiction by jurisdiction, and plan for the risk of regression after a win.$pb$
),
(
 'children-in-detention-inquiries',
 'Children in detention: the inquiries that exposed it',
 'What happens to children inside youth detention, and what have the inquiries found?',
 'Royal commissions and inspectorate reports into conditions, abuse, and the use of adult prisons for children.',
 'youth',
 ARRAY['detention-conditions','don-dale','banksia-hill','detention-abuse','adult-prison'],
 ARRAY['779186e0-fefc-4e17-9c54-2de932da67ea','a65acf72-2439-4c7c-96d6-f10668c953a1']::uuid[],
 6,
 $pb$**Conditions evidence forces the inquiry.** Footage and inspectorate reports (Don Dale, Banksia Hill, Unit 18, Ashley) turned isolated complaints into royal-commission findings. The record is the weapon.

**Findings are not change.** Don Dale produced a royal commission in 2017; the conditions cases kept recurring at Banksia Hill, the Queensland watch houses, and Unit 18. An inquiry that is not enforced becomes a citation for the next one.

**The movement half.** Close Don Dale and Close Ashley translated findings into a single demand: shut the facility. A concrete closure target outlasts a list of recommendations.

**Reusable kit:** build the conditions record, convert it into an independent inquiry, then attach a closure or enforcement demand so the findings bite.$pb$
),
(
 'justice-reinvestment-community-led',
 'Justice reinvestment & community-led alternatives',
 'What works instead of detention, and who should hold the money?',
 'The evidence for community-led, place-based alternatives to youth detention, and the money that follows.',
 'youth',
 ARRAY['justice-reinvestment','community-led','diversion'],
 ARRAY['ee628435-dbbc-4931-8c58-7ba75aace32b','c341b839-1c63-4e73-bbf8-2896e521601a']::uuid[],
 7,
 $pb$**Lead with the local result.** Maranguka in Bourke showed a sharp drop in police-recorded family violence and youth offending, with an independent KPMG cost-benefit behind it. A costed local win beats a national argument.

**Put the design in community hands.** The common thread across Maranguka and Change the Record is Aboriginal-led governance of both the program and the data. The reform is the transfer of control as much as the service.

**The evidence base is already written.** ALRC Pathways to Justice and the Closing the Gap youth-justice target give the national scaffolding. The work is funding what already works, not proving it again.

**Reusable kit:** fund a costed, community-governed, place-based model, measure it independently, and use the national reports as the mandate rather than the argument.$pb$
),
(
 'deaths-in-custody-recommendations',
 'Deaths in custody & the unfinished recommendations',
 'Thirty years after the royal commission, why do First Nations people keep dying in custody?',
 'The 1991 royal commission, its recommendations, and the gap between them and what was implemented.',
 'youth',
 ARRAY['deaths-in-custody','death-in-custody','rciadic'],
 ARRAY['4649d7dc-f3c0-4f22-9de2-3964429d1386']::uuid[],
 8,
 $pb$**The recommendations already exist.** The Royal Commission into Aboriginal Deaths in Custody (1991) made 339 recommendations. The fight is not for new findings; it is for implementation and the custody safeguards that follow from them.

**Notification saves lives.** The Custody Notification Service, a lawyer called for every First Nations person taken into custody, is the single measure most tied to preventing deaths. Expanding it is concrete and winnable.

**The movement half.** Change the Record and the custody-notification campaigns keep the toll visible and the recommendations on the public record.

**Reusable kit:** treat the 1991 recommendations as binding unfinished business, push the custody-notification safeguard jurisdiction by jurisdiction, and keep the count public.$pb$
)
ON CONFLICT (slug) DO NOTHING;
