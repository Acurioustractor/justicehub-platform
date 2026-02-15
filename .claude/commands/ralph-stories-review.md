# Ralph Stories Review

Human review checkpoint for generated content before publishing to JusticeHub.

## Your Task

1. Find content pending review:
   - Check `ralph/drafts/` for articles with status "draft" or "review"
   - Check `ralph/briefs/` for briefs with status "draft"
   - Check `ralph/social/` for campaigns with status "draft"

2. For each item pending review, present:
   - Full content
   - Metadata (category, tags, target platform)
   - Auto-generated quality notes
   - Cultural sensitivity flags if any

3. Ask user for decision on each item:
   - **Approve**: Mark as approved, ready for publishing
   - **Edit**: User provides feedback, regenerate
   - **Reject**: Mark as rejected with reason
   - **Skip**: Leave for later review

4. For approved articles, offer to:
   - Export to JusticeHub Supabase format
   - Generate publishing script
   - Create social promotion content

## Review Checklist

For each piece of content, verify:

### Brand Alignment
- [ ] Voice matches JusticeHub tone (empowering, community-centered)
- [ ] Appropriate acknowledgments included
- [ ] No organization-centric language
- [ ] Action-oriented where appropriate

### Cultural Sensitivity
- [ ] First Nations content reviewed by community (if applicable)
- [ ] Traditional Owner acknowledgment present (if applicable)
- [ ] No appropriation of lived experience
- [ ] Respectful terminology used

### Technical Quality
- [ ] Appropriate length for type
- [ ] Clear structure and flow
- [ ] Compelling headline/title
- [ ] Effective excerpt/summary
- [ ] Relevant tags and categories

### Publishing Readiness
- [ ] Featured image suggestion included
- [ ] SEO metadata present
- [ ] Internal links suggested
- [ ] Call to action included

## Output Format

```
# Content Review Queue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. Article: "Youth Mentorship Program Launch"
**Category**: Seeds 🌱
**File**: ralph/drafts/seeds-youth-program.md
**Generated**: 2025-01-07

### Content Preview
───────────────────────────────────────────────────
[First 500 characters of content...]
───────────────────────────────────────────────────

### Quality Notes
✓ Brand voice consistent
✓ Appropriate length (1,024 words)
⚠ Consider adding community quote
✓ Call to action present

### Decision Required
What would you like to do with this content?
```

## After Review

Update the content status in:
- The file's frontmatter/metadata
- `ralph/stories-prd.json` if task is fully approved
- `ralph/stories-progress.txt` with review notes

## Export Format

For approved articles, generate JusticeHub-compatible JSON:

```json
{
  "title": "Article Title",
  "slug": "article-slug",
  "content": "<article HTML content>",
  "excerpt": "Brief summary...",
  "category": "seeds",
  "tags": ["tag1", "tag2"],
  "status": "draft",
  "author_id": null,
  "featured_image_url": null,
  "reading_time_minutes": 5,
  "metadata": {
    "generated_by": "ralph-storyteller",
    "reviewed_at": "ISO timestamp",
    "reviewer_notes": "Any human notes"
  }
}
```
