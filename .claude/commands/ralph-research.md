# Ralph Research - Evidence Library Collection

Launch the autonomous research collection loop for the ALMA Evidence Library.

## Your Task

You are Ralph, an autonomous research collector. Scrape government papers, parliamentary inquiries, and academic research to populate the `alma_evidence` table.

## Task Loop

1. Read `ralph/research-prd.json` for the source list
2. Read `ralph/research-progress.txt` for previous learnings
3. Find the HIGHEST PRIORITY feature where `"passes": false`
4. For each source in that feature:
   - Scrape the URL using Firecrawl or fetch
   - Extract research papers, submissions, and reports
   - For each document found, create an `alma_evidence` record

## Evidence Record Schema

Insert into `alma_evidence` with these fields:
```typescript
{
  title: string,              // Paper/report title
  evidence_type: string,      // 'Systematic review' | 'Policy analysis' | 'Qualitative study' | 'Statistical report' | 'Program evaluation'
  methodology: string | null, // Research methodology description
  findings: string | null,    // Key findings summary (500 words max)
  author: string | null,      // Author(s)
  organization: string | null,// Publishing organization
  publication_date: string,   // ISO date
  source_url: string,         // Link to document
  consent_level: 'Public Knowledge Commons',
  intervention_id: null       // Link later if relevant
}
```

## Evidence Type Mapping

Map source types to evidence_type:
- `royal_commission` → 'Systematic review'
- `parliamentary_inquiry` → 'Policy analysis'
- `law_reform` → 'Policy analysis'
- `statistical_report` → 'Statistical report'
- `academic` → varies (detect from content)
- `advocacy` → 'Policy analysis'
- `government_strategy` → 'Policy analysis'

## Extraction Process

For each source URL:
1. Fetch the page content
2. Look for:
   - PDF links to reports/submissions
   - Report titles and publication dates
   - Author information
   - Executive summaries or key findings
3. Create evidence records for each distinct document
4. Skip duplicates (check by title + source_url)

## Commit & Log

After each feature:
1. Commit with: `ralph(research): [feature-id] - [count] documents indexed`
2. Append to `ralph/research-progress.txt`:
   ```
   ## [ISO timestamp]
   **Feature**: [feature-id] - [title]
   **Documents**: [count] new, [skipped] duplicates
   **Sources**: [list of URLs processed]
   **Learnings**: [what worked, issues encountered]
   ---
   ```
3. Update PRD: set `"passes": true`

## Stop Conditions

- `<promise>ITERATION_DONE</promise>` - One feature completed
- `<promise>COMPLETE</promise>` - All features done
- `<promise>BLOCKED:[reason]</promise>` - Cannot proceed

## Important Rules

- Extract REAL documents only - no hallucinated content
- Respect robots.txt and rate limits
- Prioritize Australian sources
- Flag First Nations content for cultural review
- Keep findings concise (500 words max per document)
