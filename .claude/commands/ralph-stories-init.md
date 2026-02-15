# Ralph Stories Init

Initialize a new JusticeHub content project using the Ralph Wiggum methodology.

## Your Task

1. Create the ralph/ directory structure if it doesn't exist:
   ```
   ralph/
   ├── stories-prd.json      # Content production requirements
   ├── stories-progress.txt  # Progress log
   ├── briefs/               # Story idea briefs
   ├── drafts/               # Article drafts
   └── social/               # Social media content
   ```

2. Initialize the stories-prd.json with a starter content plan based on:
   - Current date and quarter
   - JusticeHub's content categories (seeds, growth, harvest, roots)
   - A mix of article and social content tasks

3. Create stories-progress.txt with header

4. Set up the SQLite database (ralph/stories.db) with the schema from the SKILL.md

5. Run the TrendScout agent to populate initial trends:
   - Check existing JusticeHub stories for gaps
   - Identify underrepresented categories
   - Note any seasonal or timely topics

6. Report initialization summary to user

## Output Format

After initialization, display:
- Number of tasks in PRD
- Database tables created
- Initial trends captured
- Next steps for user

## Example PRD Structure

```json
{
  "project": "JusticeHub Content - [Quarter] [Year]",
  "description": "Autonomous content pipeline for JusticeHub stories",
  "created": "[ISO date]",
  "config": {
    "require_human_review": true,
    "auto_publish": false,
    "categories": ["seeds", "growth", "harvest", "roots"]
  },
  "features": [
    {
      "id": "unique-id",
      "priority": 1,
      "type": "article|social_campaign|brief",
      "category": "seeds|growth|harvest|roots",
      "title": "Content title",
      "brief": "Description of what to create",
      "acceptance_criteria": ["List of criteria"],
      "passes": false
    }
  ]
}
```
