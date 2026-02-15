# Spec: [Feature Name]

**Date**: YYMMDD
**Author**: [Name]
**Status**: Draft | Review | Approved | Rejected
**Iteration**: a (first draft), b, c, etc.
**Project**: JusticeHub

---

## Summary

[1-2 sentences describing what this feature does]

---

## User Story

As a [role], I want to [action], so that [benefit].

**Example**: As a JusticeHub researcher, I want to see ALMA sentiment trends over time, so that I can identify when media coverage shifts toward punitive narratives.

---

## Requirements

### Must Have
- [ ] Requirement 1
- [ ] Requirement 2

### Nice to Have
- [ ] Optional requirement

### Out of Scope
- Explicitly not included: [list]

---

## Cultural Protocol Check ⚠️

### Does this optimize or rank people?
[ ] No - this observes systems (media sentiment, policy changes), not individuals

### Does this touch sacred fields or youth data?
[ ] No - youth privacy, family support data, elder consent not accessed
[ ] Uses aggregated/system-level data only

### Does this extract knowledge without consent?
[ ] No - all data access is consent-based
[ ] Empathy Ledger integration uses link-based architecture (not data duplication)

### Who does this serve?
[ ] Community - helps advocates understand systemic patterns
[ ] Not just organizational reporting

---

## ALMA Integration Check

### Does this use signals (direction) or scores (rankings)?
[ ] Signals - tracks trends, not absolute values
[ ] No engagement metrics or vanity numbers

### Which ALMA signal family does this relate to?
[ ] System Pressure (remand rates, media rhetoric, detention length)
[ ] Community Capability (Indigenous governance, cultural continuity)
[ ] Intervention Health (program continuity, trust retention)
[ ] Trajectory (reentry patterns, school reconnection)

---

## Technical Approach

### Which part of the system owns this?
- [ ] Frontend (Next.js /src/app/...)
- [ ] Backend (Supabase tables, RLS policies)
- [ ] Automation (GitHub Actions, scripts)
- [ ] ALMA Intelligence (media sentiment, pattern detection)

### Files to modify
1. `src/app/[path]/page.tsx` - [UI changes]
2. `supabase/migrations/...sql` - [schema changes]
3. `scripts/...mjs` - [automation changes]

### Configuration
[All configuration in code - TypeScript/SQL, not external JSON]

### Dependencies
[None | List of new dependencies with justification]

---

## Simplicity Check

### Is there an existing component/pattern that handles this?
[Yes/No - if yes, which component and why create new code?]

### What's the simplest implementation?
[Describe the boring, maintainable approach]

### Does this create new abstractions?
[If yes, justify why existing patterns insufficient]

---

## Test Plan

### Cultural Protocol Tests
- [ ] Verify no youth data exposed
- [ ] Verify ALMA uses signals, not scores
- [ ] Verify Empathy Ledger integration is link-based

### Functional Tests
- [ ] Test case 1
- [ ] Test case 2

### Integration Tests
- [ ] End-to-end test scenario

---

## Review History

| Date | Reviewer | Verdict | Notes |
|------|----------|---------|-------|
| YYMMDD | [name] | [Approved/Rejected] | [feedback] |

---

## Implementation Notes

[Added after approval - actual implementation details, database queries, component structure]

---

## Deployment Checklist

After implementation:
- [ ] Tests passing
- [ ] Supabase migrations applied
- [ ] RLS policies reviewed
- [ ] Documentation updated
- [ ] Merged to main
- [ ] Deployed to Vercel
- [ ] Verified in production

---

*Naming Convention: `YYMMDD-[iteration]-[slug].md`*
*Example: `260102a-media-sentiment-dashboard.md`*

*Review against: ACT Development Philosophy*
*Tool: `/act-code-reviewer` (when available for JusticeHub)*
