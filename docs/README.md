# JusticeHub Documentation

Welcome to JusticeHub documentation. This guide helps you find what you need quickly.

---

## 🚀 Start Here

**New to JusticeHub?**
- [Main README](../README.md) - Project overview
- [Deployment Guide](guides/deployment/DEPLOY_NOW.md) - Get JusticeHub running
- [ALMA Quick Start](guides/alma/ALMA_QUICK_START.md) - Understand the intelligence system

**Need to build a feature?**
1. Start with [Spec Template](specs/TEMPLATE.md)
2. Review with `/act-code-reviewer` (see [Workflow](#spec-workflow) below)
3. Implement only after "Ship It" approval

---

## 📁 Directory Structure

```
docs/
├── guides/              # How-to guides for current features
│   ├── alma/           # ALMA Intelligence system
│   ├── automation/     # GitHub Actions, automated workflows
│   ├── deployment/     # Setup, secrets, deployment
│   ├── empathy-ledger/ # Empathy Ledger integration
│   └── brand/          # Brand guidelines
│
├── specs/              # Feature specifications (approved before implementation)
│   └── TEMPLATE.md     # Start here for new features
│
├── architecture/       # System design decisions
│   ├── DOCS_REORGANIZATION_PLAN.md
│   └── PROJECT_MASTER_INDEX.md
│
├── completed/          # Completed implementation reports
│   ├── DEPLOYMENT_SUCCESS.md
│   ├── ALMA_UNIFICATION_COMPLETE.md
│   └── ...
│
└── archive/            # Outdated/superseded documentation
```

---

## 📚 Guides by Topic

### ALMA Intelligence System
[ALMA](guides/alma/) is JusticeHub's ethical intelligence layer - tracking system patterns, not profiling individuals.

- **[ALMA Quick Start](guides/alma/ALMA_QUICK_START.md)** - Get started with ALMA
- **[Data Presentation Strategy](guides/alma/ALMA_DATA_PRESENTATION_STRATEGY.md)** - How to present ALMA signals
- **[Analytics Studio Plan](guides/alma/ALMA_ANALYTICS_STUDIO_PLAN.md)** - Advanced analytics
- **[Scrollytelling Guides](guides/alma/)** - Visual storytelling with data

**Core Principle**: ALMA uses **signals** (direction indicators), not **scores** (rankings).

### Automation & Monitoring
GitHub Actions workflows that keep JusticeHub running automatically.

- **[Automation README](guides/automation/AUTOMATION_README.md)** - Overview of all automations
- **[Quick Start](guides/automation/AUTOMATION_QUICK_START.md)** - Set up automation
- **[GitHub Actions Setup](guides/automation/GITHUB_ACTIONS_SETUP.md)** - Configure workflows
- **[Data Ingestion Plan](guides/automation/DATA_INGESTION_AUTOMATION_PLAN.md)** - Automated data collection

**Current Automations**:
- Daily Empathy Ledger profile sync (4am UTC)
- Health monitoring (every 6 hours)
- ALMA continuous ingestion

### Deployment & Setup
Get JusticeHub deployed and configured.

- **[Deploy Now](guides/deployment/DEPLOY_NOW.md)** - ⭐ Main deployment guide
- **[Bitwarden Secrets](guides/deployment/BITWARDEN_SECRETS.md)** - Secrets management
- **[GitHub Secrets Setup](guides/deployment/GITHUB_SECRETS_SETUP.md)** - CI/CD secrets
- **[Telegram Setup](guides/deployment/TELEGRAM_SETUP.md)** - Notification alerts
- **[Quick Reference](guides/deployment/QUICK_REFERENCE.md)** - Common commands
- **[Supabase Types](guides/deployment/SUPABASE_TYPES_QUICKSTART.md)** - TypeScript types

### Empathy Ledger Integration
JusticeHub integrates with Empathy Ledger using **link-based architecture** (not data duplication).

- **[Integration Guide](guides/empathy-ledger/EMPATHY_LEDGER_INTEGRATION_CORRECTED.md)** - How EL integration works

**Core Principle**: JusticeHub stores `empathy_ledger_profile_id` (reference only), not profile data. Empathy Ledger remains the source of truth.

### Brand Guidelines
- **[Brand Components](guides/brand/BRAND_COMPONENTS.md)** - Design system

---

## 🏗️ Architecture Decisions

High-level system design and strategy documents.

- **[Docs Reorganization Plan](architecture/DOCS_REORGANIZATION_PLAN.md)** - How this structure was created
- **[Project Master Index](architecture/PROJECT_MASTER_INDEX.md)** - Project overview

---

## ✅ Completed Work

Reports documenting completed features and milestones.

- **[Deployment Success](completed/DEPLOYMENT_SUCCESS.md)** - 100% automation operational
- **[ALMA Unification Complete](completed/ALMA_UNIFICATION_COMPLETE.md)** - ALMA system unified
- **[Media Sentiment Tracking](completed/MEDIA_SENTIMENT_TRACKING_COMPLETE.md)** - Sentiment analysis live
- [See all completed work →](completed/)

---

## 📝 Spec Workflow

JusticeHub follows DHH-inspired "specs before code" approach.

### 1. Create Spec from Template
```bash
cp docs/specs/TEMPLATE.md docs/specs/$(date +%y%m%d)a-feature-name.md
```

### 2. Fill in Requirements
- User story
- Cultural protocol check ⚠️
- ALMA integration check (if applicable)
- Technical approach
- Test plan

### 3. Review Against ACT Values
```
/act-code-reviewer docs/specs/260102a-feature-name.md
```

### 4. Iterate if Rejected
- Create iteration b, c, etc.
- Address reviewer feedback
- Resubmit for review

### 5. Implement After "Ship It"
Only write code after spec is approved.

---

## 🛡️ Cultural Protocols

JusticeHub enforces these as **code**, not just policy:

### Sacred Boundaries (NEVER Allowed)

1. **Youth Profiling** - No risk scores, prediction of reoffending, or rankings
2. **Family Support Data Exposure** - Family data stays in its source system
3. **Empathy Ledger Data Duplication** - Link-based architecture only
4. **ALMA Scores** - Use signals (direction), not scores (rankings)

### Always Enforce

1. **System Observation** - Track remand rates (system), not youth behavior (individuals)
2. **Link-Based EL Integration** - Store references, not duplicate data
3. **Real-Time Consent** - Consent revocations processed immediately
4. **Human Decision-Making** - ALMA suggests, humans decide

---

## 🔍 Finding What You Need

### "How do I deploy JusticeHub?"
→ [guides/deployment/DEPLOY_NOW.md](guides/deployment/DEPLOY_NOW.md)

### "How does ALMA work?"
→ [guides/alma/ALMA_QUICK_START.md](guides/alma/ALMA_QUICK_START.md)

### "How does Empathy Ledger integration work?"
→ [guides/empathy-ledger/EMPATHY_LEDGER_INTEGRATION_CORRECTED.md](guides/empathy-ledger/EMPATHY_LEDGER_INTEGRATION_CORRECTED.md)

### "What automations are running?"
→ [guides/automation/AUTOMATION_README.md](guides/automation/AUTOMATION_README.md)

### "I want to build a new feature"
→ [specs/TEMPLATE.md](specs/TEMPLATE.md)

### "What's been completed recently?"
→ [completed/](completed/)

---

## 🤝 Contributing

### Adding Documentation
- Guides → `/docs/guides/[topic]/`
- Architecture decisions → `/docs/architecture/`
- Completed work → `/docs/completed/`

### Building Features
1. Create spec from template
2. Review with ACT Code Reviewer
3. Iterate until approved
4. Implement
5. Move spec to `/docs/completed/` after deployment

---

## 📞 Support

**Bitwarden CLI**: `bw --help`
**GitHub Actions**: `gh run list --limit 10`
**Telegram Alerts**: @justicehub_alerts_bot

**Emergency**: Check [completed/DEPLOYMENT_SUCCESS.md](completed/DEPLOYMENT_SUCCESS.md) for troubleshooting

---

*Last Updated: January 2, 2026*
*Structure: DHH-inspired (organize by purpose, catch issues in specs)*
*Philosophy: Youth justice system reform through system observation, not individual optimization*
