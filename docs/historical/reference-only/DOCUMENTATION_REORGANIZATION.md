# Documentation Reorganization - 2026-01-01

## Summary

Cleaned up **99 markdown files** from root directory, organizing them into proper locations.

## New Structure

```
JusticeHub/
├── README.md                    # Main project README (kept in root)
├── CLAUDE.md                    # Claude Code instructions (kept in root)
├── PROJECT_MASTER_INDEX.md      # Master index (kept in root)
│
├── docs/
│   ├── alma/                    # ALMA-specific documentation (22 files)
│   │   ├── ALMA_ARCHITECTURE_VISUAL.md
│   │   ├── ALMA_COMPLETE_SYSTEM.md
│   │   ├── ALMA_DATABASE_MAPPING_VERIFIED.md
│   │   ├── ALMA_FIXES_APPLIED.md
│   │   ├── ALMA_INGESTION_STATUS_2025-12-31.md
│   │   ├── ALMA_OPPORTUNITY_ONE_PAGER.md
│   │   ├── ALMA_REVENUE_MODEL_COMMUNITY_BENEFIT.md
│   │   ├── ALMA_TECHNICAL_IMPLEMENTATION_PLAN.md
│   │   └── ... (14 more ALMA docs)
│   │
│   ├── PRF/                     # PRF Fellowship application docs
│   │   ├── Benjamin_Knight_CV_PRF_Fellowship_2026.md
│   │   ├── PRF_APPLICATION_DRAFT_RESPONSES.md
│   │   └── ... (other PRF docs)
│   │
│   ├── archived/
│   │   ├── old-root-docs/       # 56 legacy docs from root
│   │   │   ├── AUNTY_CORRINE_*.md
│   │   │   ├── BLOG_DRAFT_*.md
│   │   │   ├── DEPLOY_*.md
│   │   │   ├── MINDAROO_*.md
│   │   │   ├── MOUNT_ISA_*.md
│   │   │   ├── NSW_GRANT_*.md
│   │   │   ├── PHASE_*.md
│   │   │   ├── QUEENSLAND_*.md
│   │   │   ├── SESSION_*.md
│   │   │   ├── STORY_*.md
│   │   │   └── ... (other archived docs)
│   │   │
│   │   ├── blog-drafts/         # Old blog drafts folder
│   │   ├── content/             # Old content folder
│   │   ├── final documents/     # Old final documents folder
│   │   └── projects/            # Old projects folder
│   │
│   └── (existing docs structure)
│
├── config/                      # Config files (kept)
├── data/                        # Data files (kept)
├── logs/                        # Log files (kept)
├── scripts/                     # Scripts (kept)
│   ├── check-alma-data.mjs
│   ├── check-intervention-status.mjs
│   ├── check-metadata-fields.mjs
│   ├── publish-all-interventions.mjs
│   └── organize-root-docs.sh
│
├── src/                         # Source code
├── supabase/                    # Database migrations
├── public/                      # Public assets
└── ...
```

## What Was Moved

### ALMA Documentation (22 files → docs/alma/)
All files starting with `ALMA_*`:
- Architecture & technical plans
- Ingestion status & methodology
- Revenue models & opportunities
- Styling fixes & database mapping
- Integration guides

### Project-Specific Docs (56 files → docs/archived/old-root-docs/)

**Aunty Corrine Project**:
- Interview analysis, project summaries, story drafts

**PRF Fellowship**:
- CV, application responses, research summaries

**Grant Applications**:
- NSW grant analysis, toolkit, quick start
- Mindaroo pitches, slides, strategic pitch

**Mount Isa**:
- Aunties analysis, platform strategy

**Queensland**:
- Program analysis, deep dives

**Visualizations & Design**:
- AI visualization prompts, Napkin AI prompts
- Figma guides, design systems

**Session Notes**:
- Development session summaries
- Phase/Week completion docs

**Setup & Deployment**:
- Deploy checklists, setup guides
- Implementation status docs

**Storytelling & Content**:
- Story structure analysis, ownership frameworks
- Social media templates
- Blog drafts

**Strategy & Planning**:
- Budget alignment, backend enhancement
- Sector-wide framing, strategic reviews

### Folders Moved (→ docs/archived/)
- `blog-drafts/` - Old blog draft content
- `content/` - Legacy content files
- `final documents/` - Old final documents
- `projects/` - Old project files

## What Remained in Root

Only 3 essential files:
1. **README.md** - Main project README
2. **CLAUDE.md** - Claude Code agent instructions
3. **PROJECT_MASTER_INDEX.md** - Master documentation index

## Files Kept in Place

### Active Directories:
- `config/` - Configuration files (ALMA schema, etc.)
- `data/` - Active data files
- `logs/` - Log files
- `scripts/` - Utility scripts
- `src/` - Source code
- `supabase/` - Database migrations
- `public/` - Public assets

## Benefits

✅ **Clean Root**: 99 files → 3 files
✅ **Organized by Topic**: ALMA docs together, archived docs together
✅ **Easier Navigation**: Clear folder structure
✅ **Preserved History**: All old docs in `docs/archived/`
✅ **Maintained Accessibility**: Important docs easily findable

## Finding Old Documents

All legacy root documentation is in:
```
docs/archived/old-root-docs/
```

To find a specific doc:
```bash
# Search by name
find docs/archived -name "*AUNTY*"

# Search by content
grep -r "specific text" docs/archived/
```

## Active ALMA Documentation

Current ALMA work is in:
```
docs/alma/
```

Key files:
- `ALMA_DATABASE_MAPPING_VERIFIED.md` - Database structure verification
- `ALMA_FIXES_APPLIED.md` - Recent fixes log
- `ALMA_TECHNICAL_IMPLEMENTATION_PLAN.md` - Full technical plan
- `ALMA_REVENUE_MODEL_COMMUNITY_BENEFIT.md` - Business model

---

**Reorganized**: 2026-01-01
**By**: Claude Code
**Reason**: Clean up root directory for better project organization
