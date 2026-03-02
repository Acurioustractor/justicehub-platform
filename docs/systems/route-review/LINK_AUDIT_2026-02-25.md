# Internal Link Audit

Date: 2026-02-25

- Broken static internal href references found: 68
- Unique missing/invalid static paths: 47
- Literal template href strings (`${...}` in quoted href): 2
- Unique literal template href strings: 2

## Missing Static Paths

| Missing Path | Count | Example Sources |
|---|---:|---|
| `/admin/programs/new` | 3 | `src/app/admin/page.tsx`<br/>`src/app/admin/programs/page.tsx` |
| `/admin/services/import` | 3 | `src/app/admin/page.tsx`<br/>`src/app/admin/services/page.tsx` |
| `/dashboard` | 3 | `src/components/navigation/OrgNavigation.tsx` |
| `/wiki/mindaroo-strategic-pitch` | 3 | `src/app/flywheel/page.tsx`<br/>`src/app/visuals/page.tsx`<br/>`src/app/wiki/page.tsx` |
| `/wiki/three-scenarios-budget` | 3 | `src/app/flywheel/page.tsx`<br/>`src/app/visuals/page.tsx`<br/>`src/app/wiki/page.tsx` |
| `/admin/art-innovation/new` | 2 | `src/app/admin/art-innovation/page.tsx` |
| `/admin/funding/new` | 2 | `src/app/admin/funding/page.tsx` |
| `/admin/research/scrape` | 2 | `src/app/admin/research/page.tsx` |
| `/support` | 2 | `src/app/contact/page.tsx`<br/>`src/app/how-it-works/page.tsx` |
| `/wiki/design-tools-guide` | 2 | `src/app/flywheel/page.tsx`<br/>`src/app/visuals/page.tsx` |
| `/wiki/executive-summary` | 2 | `src/app/wiki/page.tsx` |
| `/wiki/justicehub-planning` | 2 | `src/app/wiki/page.tsx` |
| `/wiki/one-page-overview` | 2 | `src/app/wiki/page.tsx` |
| `/youth-scout/forgot-password` | 2 | `src/app/youth-scout/talent-login/page.tsx`<br/>`src/app/youth-scout/youth-login/page.tsx` |
| `/youth-scout/talent-preview` | 2 | `src/app/youth-scout/page.tsx`<br/>`src/app/youth-scout/talent-login/page.tsx` |
| `/youth-scout/youth-preview` | 2 | `src/app/youth-scout/page.tsx`<br/>`src/app/youth-scout/youth-login/page.tsx` |
| `/admin/funding/applications` | 1 | `src/app/admin/funding/page.tsx` |
| `/admin/funding/reports` | 1 | `src/app/admin/funding/page.tsx` |
| `/admin/funding/scrape` | 1 | `src/app/admin/funding/page.tsx` |
| `/book-experience` | 1 | `src/components/about/build-process-section.tsx` |
| `/BUDGET_SUMMARY.md` | 1 | `src/app/preplanning/page.tsx` |
| `/community` | 1 | `src/app/roadmap/page.tsx` |
| `/community-programs/nominate` | 1 | `src/app/community-programs/page-content.tsx` |
| `/dashboard/dreamtrack` | 1 | `src/app/talent-scout/page.tsx` |
| `/dashboard/youth` | 1 | `src/app/talent-scout/page.tsx` |
| `/docs/NT_BASELINE_COMPARISON_REPORT` | 1 | `src/app/intelligence/nt-showcase/page.tsx` |
| `/economics-report` | 1 | `src/components/about/economics-section.tsx` |
| `/FUNDING_PITCH_TEMPLATES.md` | 1 | `src/app/preplanning/page.tsx` |
| `/grassroots/apply` | 1 | `src/app/grassroots/page-content.tsx` |
| `/JUSTICEHUB_PLANNING.md` | 1 | `src/app/preplanning/page.tsx` |
| `/media` | 1 | `src/app/contact/page.tsx` |
| `/partners` | 1 | `src/app/contact/page.tsx` |
| `/people/benjamin-knight` | 1 | `src/app/test-auth/page.tsx` |
| `/resources/funder-prospectus.pdf` | 1 | `src/app/for-funders/page.tsx` |
| `/stories/share` | 1 | `src/app/about/roadmap/page.tsx` |
| `/stories/submit` | 1 | `src/app/community-programs/page-content.tsx` |
| `/stories/walking-toward-justice-a-personal-journey` | 1 | `src/app/wiki/mindaroo-pitch/one-pager/page.mdx` |
| `/vision-2030-report` | 1 | `src/components/about/vision-section.tsx` |
| `/wiki/admin-quick-start` | 1 | `src/app/wiki/page.tsx` |
| `/wiki/admin-routes-complete` | 1 | `src/app/wiki/page.tsx` |
| `/wiki/admin-user-guide` | 1 | `src/app/wiki/page.tsx` |
| `/wiki/auto-linking-complete` | 1 | `src/app/wiki/page.tsx` |
| `/wiki/budget-summary` | 1 | `src/app/wiki/page.tsx` |
| `/wiki/centre-of-excellence-complete` | 1 | `src/app/wiki/page.tsx` |
| `/wiki/empathy-ledger-full-integration` | 1 | `src/app/wiki/page.tsx` |
| `/wiki/sovereignty-flywheel-visual` | 1 | `src/app/flywheel/page.tsx` |
| `/wiki/strategic-overview` | 1 | `src/app/wiki/page.tsx` |

## Literal Template Href Strings

| Invalid Href Literal | Count | Example Sources |
|---|---:|---|
| `/network/${node.id}` | 1 | `src/components/SimpleNodesMap.tsx` |
| `/organizations/${basecamp.slug}` | 1 | `src/components/coe/BasecampMap.tsx` |