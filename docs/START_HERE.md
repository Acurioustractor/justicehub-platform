# JusticeHub Documentation

**360 files simplified to 80**. One source of truth per system. **Agent-navigable** for autonomous AI work.

---

## 🤖 For AI Agents

This wiki is structured for **autonomous navigation and task execution**.

**Navigation Protocol**:
1. Identify your goal → Find relevant system below
2. Read `systems/[system]/index.md` → Understand architecture
3. Choose a task from `systems/[system]/tasks/` → Execute specific action
4. Follow action blocks → Run commands
5. Validate success → Check criteria
6. Troubleshoot if needed → Follow decision trees

**Machine-Readable**: Metadata frontmatter, JSON schemas, validation criteria in every doc.

---

## 🧭 Systems Map

| System | Purpose | Entry Point | Common Tasks |
|--------|---------|-------------|--------------|
| **[ALMA](systems/alma/)** | Ethical intelligence tracking | [index.md](systems/alma/index.md) | Ingest media, query signals, dashboard setup |
| **[Profiles](systems/profiles/)** | Profile management & linking | [index.md](systems/profiles/index.md) | Link profiles, edit profiles, flag content |
| **[Empathy Ledger](systems/empathy-ledger/)** | Story integration (link-based) | [index.md](systems/empathy-ledger/index.md) | Sync profiles, fetch stories |
| **[Scraper](systems/scraper/)** | Automated data ingestion | [index.md](systems/scraper/index.md) | Scrape sources, automate workflows |
| **[Admin](systems/admin/)** | Admin workflows | [index.md](systems/admin/index.md) | User management, moderation |

---

## 🚀 Quick Navigation

### New to JusticeHub?
→ [Operations: Deployment Quick Start](operations/deployment/QUICK_START.md)

### Need to Deploy?
→ [Operations: Deployment](operations/deployment/)

### Building a Feature?
→ Find your system in [Systems Map](#-systems-map) above

### Strategic Planning?
→ [Strategic: Architecture Overview](strategic/reference/ARCHITECTURE_OVERVIEW.md)

### Governance & Ethics?
→ [Governance Documents](strategic/governance/) - IAB, ethical review, justice metrics

### Looking for a Specific Task?
→ See [Task Index](#-task-index) below

---

## 📋 Task Index (Alphabetical)

Quick access to common tasks:

**A**
- [Add Media Source](systems/scraper/tasks/) (scraper)

**C**
- [Calculate ALMA Signals](systems/alma/) (ALMA)

**D**
- [Dashboard Setup (ALMA)](systems/alma/) (ALMA)
- [Deploy JusticeHub](operations/deployment/QUICK_START.md) (operations)

**E**
- [Edit Profile](systems/profiles/) (profiles)
- [Export ALMA Report](systems/alma/) (ALMA)

**I**
- [Ingest Media Articles](systems/alma/) (ALMA)

**L**
- [Link Profile to Entity](systems/profiles/) (profiles)

**Q**
- [Query ALMA Signals](systems/alma/) (ALMA)

**S**
- [Scrape Data Source](systems/scraper/) (scraper)
- [Sync Empathy Ledger Profiles](systems/empathy-ledger/) (empathy ledger)

---

## 🏗️ Systems (Detailed)

### ALMA Intelligence
**Path**: [systems/alma/](systems/alma/)

Ethical AI system that tracks **system patterns** (not individuals):
- Media sentiment tracking
- System pressure signals (remand rates, detention length)
- Community capability indicators
- Pattern recognition across time

**Sacred Boundaries**: ALMA uses **signals** (direction indicators), not **scores** (rankings). Never profiles individuals.

**Quick Start**: [systems/alma/QUICK_START.md](systems/alma/QUICK_START.md)

---

### Profiles
**Path**: [systems/profiles/](systems/profiles/)

Profile management system:
- Link profiles to services/programs/articles
- Flag inappropriate content
- Self-service editing
- Profile images and metadata

**Sacred Boundaries**: Youth privacy protected. Family support data NEVER exposed.

**Quick Start**: [systems/profiles/QUICK_START.md](systems/profiles/QUICK_START.md)

---

### Empathy Ledger Integration
**Path**: [systems/empathy-ledger/](systems/empathy-ledger/)

**Link-based architecture** (not data duplication):
- JusticeHub stores `empathy_ledger_profile_id` (reference only)
- Profile data fetched in real-time from Empathy Ledger
- Empathy Ledger remains source of truth
- Consent revocations processed immediately

**Sacred Boundaries**: NO profile data duplication. Links only.

**Quick Start**: [systems/empathy-ledger/QUICK_START.md](systems/empathy-ledger/QUICK_START.md)

---

### Scraper & Data Ingestion
**Path**: [systems/scraper/](systems/scraper/)

Automated data collection:
- Service directory scraping (headspace, Legal Aid, etc.)
- Media article ingestion
- Government data sources
- Automated workflows (GitHub Actions)

**Quick Start**: [systems/scraper/AUTOMATION.md](systems/scraper/AUTOMATION.md)

---

### Admin
**Path**: [systems/admin/](systems/admin/)

Admin workflows:
- User management
- Content moderation
- System configuration
- Analytics access

**Quick Start**: [systems/admin/QUICK_START.md](systems/admin/QUICK_START.md)

---

## ⚙️ Operations

### Deployment
**Path**: [operations/deployment/](operations/deployment/)

Setup and deployment:
- [Quick Start](operations/deployment/QUICK_START.md) - Get JusticeHub running
- [Environment Setup](operations/deployment/ENVIRONMENT.md)
- [Secrets Management](operations/deployment/SECRETS.md) (Bitwarden)
- [Troubleshooting](operations/deployment/TROUBLESHOOTING.md)

### Automation
**Path**: [operations/automation/](operations/automation/)

GitHub Actions and monitoring:
- Daily Empathy Ledger profile sync (4am UTC)
- Health monitoring (every 6 hours)
- ALMA media ingestion
- Data source checks

### Development
**Path**: [operations/development/](operations/development/)

Local development:
- [Setup Guide](operations/development/SETUP.md)
- [Supabase](operations/development/SUPABASE.md)
- [Database Schema](operations/development/DATABASE.md)

---

## 📐 Strategic

### Architecture
**Path**: [strategic/reference/](strategic/reference/)

System design:
- [Architecture Overview](strategic/reference/ARCHITECTURE_OVERVIEW.md)
- Database schema
- API reference
- Information architecture

### Roadmap & Plans
**Path**: [strategic/](strategic/)

Future direction:
- [Roadmap](strategic/ROADMAP.md)
- [Plans](strategic/plans/) - API integration, expansions, strategies

### Governance
**Path**: [strategic/governance/](strategic/governance/)

Ethical governance:
- [Indigenous Advisory Board](strategic/governance/INDIGENOUS_ADVISORY_BOARD.md) - IAB structure with veto power
- [Justice System Metrics 2036](strategic/governance/JUSTICE_SYSTEM_METRICS_2036.md) - 10-year system goals
- [Partnership Ethical Review](strategic/governance/PARTNERSHIP_ETHICAL_REVIEW.md) - Review process for all partnerships
- [Strategic Vision 2026-2036](strategic/STRATEGIC_VISION_2026-2036.md) - Comprehensive 10-year roadmap

---

## 🗄️ Historical

**Path**: [historical/](historical/)

**Archived for reference only** - Not actively maintained.

Contains:
- Old session notes
- Completed work summaries
- Superseded strategies
- Historical reference material

**Note**: Do not reference historical/ for current implementations. Use systems/ instead.

---

## 📖 Documentation Conventions

### Metadata Frontmatter
All system docs include:
```yaml
---
system: alma
type: guide | task | reference
difficulty: beginner | intermediate | advanced
prerequisites: [list]
duration: "5-10 minutes"
success_criteria: [list]
last_updated: YYYY-MM-DD
---
```

### File Naming
- **Guides**: `GUIDE.md`, `ARCHITECTURE.md`, `QUICK_START.md`
- **Tasks**: `verb-object.md` (e.g., `ingest-media.md`, `link-profile.md`)
- **Reference**: `noun.md` or `noun-schema.json` (e.g., `signals-schema.json`)

### Structure Pattern
```
systems/[system]/
├── index.md              # System overview + navigation
├── GUIDE.md              # Comprehensive guide
├── QUICK_START.md        # 5-minute setup
├── tasks/                # Discrete tasks
│   └── task-name.md
├── reference/            # Machine-readable schemas
│   └── schema.json
└── troubleshooting/      # Common errors
    └── error-name.md
```

---

## 🛡️ Cultural Protocols

JusticeHub enforces these as **code**, not just policy:

### Sacred Boundaries (NEVER Allowed)

1. **Youth Profiling** - No risk scores, prediction, or rankings
2. **Family Support Data Exposure** - Family data stays in source system
3. **Empathy Ledger Data Duplication** - Link-based architecture only
4. **ALMA Scores** - Use signals (direction), not scores (rankings)

### Always Enforce

1. **System Observation** - Track remand rates (system), not youth behavior (individuals)
2. **Link-Based EL Integration** - Store references, not duplicate data
3. **Real-Time Consent** - Consent revocations processed immediately
4. **Human Decision-Making** - ALMA suggests, humans decide

**Review Tool**: Use `/act-code-reviewer` before implementing features

---

## 📞 Support & Tools

**Bitwarden CLI**: `bw --help`
**GitHub Actions**: `gh run list --limit 10`
**Telegram Alerts**: @justicehub_alerts_bot

**Troubleshooting**: Check system-specific troubleshooting/ folders

---

## 🎯 Common Workflows

### Workflow 1: Deploy JusticeHub
1. [operations/deployment/QUICK_START.md](operations/deployment/QUICK_START.md)
2. [operations/deployment/SECRETS.md](operations/deployment/SECRETS.md)
3. [operations/deployment/TROUBLESHOOTING.md](operations/deployment/TROUBLESHOOTING.md) (if issues)

### Workflow 2: Set Up ALMA Dashboard
1. [systems/alma/QUICK_START.md](systems/alma/QUICK_START.md)
2. [systems/alma/](systems/alma/) (tasks/dashboard-setup.md)
3. Validate with provided tests

### Workflow 3: Sync Empathy Ledger Profiles
1. [systems/empathy-ledger/QUICK_START.md](systems/empathy-ledger/QUICK_START.md)
2. [systems/empathy-ledger/](systems/empathy-ledger/) (tasks/sync-profiles.md)
3. Verify links in database

### Workflow 4: Add New Media Source
1. [systems/scraper/GUIDE.md](systems/scraper/GUIDE.md)
2. [systems/scraper/](systems/scraper/) (tasks/add-source.md)
3. Test scraper locally
4. Add to automation

---

## 📊 Documentation Statistics

- **Total docs**: 80 (down from 360)
- **Systems**: 5 (ALMA, Profiles, Empathy Ledger, Scraper, Admin)
- **Active guides**: 80
- **Historical**: 19 (reference only)
- **Reduction**: 78%

**Organization**: Systems > Chronology. One source of truth per system.

---

*Last Updated: January 2, 2026*
*Structure: DHH-inspired (simplicity over cleverness)*
*Philosophy: Documentation as executable knowledge for humans and AI agents*
*Status: Agent-navigable, metadata-first, action-focused*
