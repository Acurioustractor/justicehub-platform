# ALMA Signal Refinements: Community Voice, Indigenous Parity, Economic Mobility

**Date**: January 2, 2026
**Status**: Implementation Ready
**Purpose**: Add missing signal families to ALMA that track community voice, Indigenous parity, and economic mobility

---

## Current Signal Framework

ALMA currently tracks four signal families:

```
Current ALMA Signals
├── System Pressure
│   ├── Remand rates
│   ├── Average detention length
│   ├── Staff turnover
│   └── Incident reporting spikes
│
├── Community Capability
│   ├── Indigenous governance presence
│   ├── Workforce stability
│   ├── Cultural continuity
│   └── Youth participation in decisions
│
├── Intervention Health
│   ├── Program continuity beyond grants
│   ├── Staff burnout indicators
│   ├── Administrative burden
│   └── Adaptation speed
│
└── Trajectory
    ├── Re-entry patterns
    ├── School reconnection
    ├── Justice contact spacing
    └── Family reunification durability
```

---

## Gap Analysis: What's Missing

### GAP 1: Youth Voice

**Problem**: ALMA tracks system patterns but doesn't capture how youth experience the system.

**Why it matters**: Communities may look capable on paper while youth feel unheard.

### GAP 2: Indigenous Parity

**Problem**: Remand rates are tracked but not Indigenous-specific disparity analysis.

**Why it matters**: Overall "improvement" can mask widening gaps for Indigenous youth.

### GAP 3: Economic Mobility

**Problem**: Cultural continuity is tracked but not economic outcomes for families.

**Why it matters**: Programs can be culturally strong but leave families in poverty.

### GAP 4: Community Decision Power

**Problem**: Governance presence is tracked but not actual decision-making authority.

**Why it matters**: Indigenous governance can be performative (advisory) rather than real (authority).

---

## New Signal Families

### Signal Family 5: Community Voice

**Purpose**: Track whether youth and families feel heard by the system.

| Signal | Description | Source | Direction Indicates |
|--------|-------------|--------|---------------------|
| **Youth satisfaction** | Qualitative rating of system experience | Youth surveys, storyteller feedback | ↑ = Youth feel heard |
| **Family feedback** | Family assessment of intervention quality | Family surveys, program reports | ↑ = Families satisfied |
| **Cultural safety incidents** | Reports of cultural harm or insensitivity | Community reports, complaints | ↓ = Better cultural safety |
| **Youth-led initiative rate** | % of programs with youth co-design | Program audits | ↑ = More youth power |
| **Complaint resolution time** | Time to resolve community concerns | Organizational data | ↓ = Better responsiveness |

**Collection Method**:
- Quarterly surveys through Community Controlled organizations
- Storyteller interviews (with consent)
- Program exit surveys
- Community assembly feedback

**Sacred Boundaries**:
- Never identify individual youth
- Aggregate to program/region level only
- Youth opt-in only (no mandatory feedback)
- Community controls what gets shared

### Signal Family 6: Indigenous Parity

**Purpose**: Track whether racial disparities are closing or widening.

| Signal | Description | Source | Direction Indicates |
|--------|-------------|--------|---------------------|
| **Incarceration ratio** | Indigenous vs non-Indigenous detention rate | AIHW, state data | ↓ = Closing gap |
| **Remand disparity** | Indigenous vs non-Indigenous remand rate | State corrections | ↓ = Closing gap |
| **Funding equity** | % to Community Controlled vs mainstream | Grant databases | ↑ = Better equity |
| **Workforce representation** | Indigenous staff in justice sector | Organizational data | ↑ = Better representation |
| **Data sovereignty** | Communities controlling their own data | Community surveys | ↑ = More sovereignty |

**Collection Method**:
- Annual AIHW Indigenous supplement
- State-level corrections data
- JusticeHub funding database
- IAB quarterly audit

**Sacred Boundaries**:
- Never compare communities to each other
- Ratio is system accountability, not community blame
- Indigenous communities determine how their data is framed
- IAB veto on any parity data publication

### Signal Family 7: Economic Mobility

**Purpose**: Track whether interventions improve economic outcomes.

| Signal | Description | Source | Direction Indicates |
|--------|-------------|--------|---------------------|
| **Post-program employment** | Sustained employment 12+ months | Program follow-up | ↑ = Economic stability |
| **Family income trajectory** | Family income change post-intervention | Census data, surveys | ↑ = Economic improvement |
| **Local economic circulation** | Money staying in community | Community economic data | ↑ = Economic health |
| **Indigenous business creation** | New Indigenous businesses from programs | Business registrations | ↑ = Economic empowerment |
| **Housing stability** | Sustained housing post-program | Program follow-up | ↑ = Stability |

**Collection Method**:
- 12-month and 24-month program follow-ups
- Census data (aggregated)
- Community economic surveys
- Indigenous business network data

**Sacred Boundaries**:
- Economic data never linked to individuals
- Communities opt-in to economic tracking
- Failure is system failure, not individual failure
- Economic "success" doesn't mean extractive employment

### Signal Family 8: Community Decision Power

**Purpose**: Track whether communities have real power, not just advisory roles.

| Signal | Description | Source | Direction Indicates |
|--------|-------------|--------|---------------------|
| **Funding decision authority** | % of funding decisions made by community | Grant process audits | ↑ = Community power |
| **Policy co-design rate** | Government policies with community co-design | Policy audits | ↑ = Community power |
| **Veto exercise frequency** | IAB/community vetoes of harmful partnerships | IAB records | ↑ = Power being used |
| **Program design authority** | % of programs designed by communities | Program audits | ↑ = Community ownership |
| **Data control** | Communities controlling access to their data | JusticeHub audits | ↑ = Data sovereignty |

**Collection Method**:
- IAB quarterly reports
- Community authority surveys
- Partnership audits
- JusticeHub access logs

**Sacred Boundaries**:
- Power is structural, not performative
- Advisory roles don't count as authority
- Communities self-report their power level
- IAB validates community power claims

---

## Updated Signal Architecture

```
ALMA Signal Framework v2.0

├── System Pressure (existing)
│   └── [unchanged]
│
├── Community Capability (existing)
│   └── [unchanged]
│
├── Intervention Health (existing)
│   └── [unchanged]
│
├── Trajectory (existing)
│   └── [unchanged]
│
├── Community Voice (NEW)
│   ├── Youth satisfaction
│   ├── Family feedback
│   ├── Cultural safety incidents
│   ├── Youth-led initiative rate
│   └── Complaint resolution time
│
├── Indigenous Parity (NEW)
│   ├── Incarceration ratio
│   ├── Remand disparity
│   ├── Funding equity
│   ├── Workforce representation
│   └── Data sovereignty
│
├── Economic Mobility (NEW)
│   ├── Post-program employment
│   ├── Family income trajectory
│   ├── Local economic circulation
│   ├── Indigenous business creation
│   └── Housing stability
│
└── Community Decision Power (NEW)
    ├── Funding decision authority
    ├── Policy co-design rate
    ├── Veto exercise frequency
    ├── Program design authority
    └── Data control
```

---

## Database Schema Changes

### New Tables

```sql
-- Community Voice Signals
CREATE TABLE alma_community_voice_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  region TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'youth_satisfaction',
    'family_feedback',
    'cultural_safety_incidents',
    'youth_led_initiative_rate',
    'complaint_resolution_time'
  )),
  value DECIMAL(5,2),
  direction TEXT CHECK (direction IN ('increasing', 'decreasing', 'stable')),
  measurement_period TEXT, -- 'Q1 2026', 'H1 2026', etc.
  source TEXT,
  consent_level TEXT DEFAULT 'Community Controlled',
  notes TEXT,

  -- Ensure community consent
  community_authority TEXT NOT NULL,
  consent_given_at TIMESTAMPTZ NOT NULL
);

-- Indigenous Parity Signals
CREATE TABLE alma_indigenous_parity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  state TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'incarceration_ratio',
    'remand_disparity',
    'funding_equity',
    'workforce_representation',
    'data_sovereignty'
  )),
  value DECIMAL(10,2), -- Ratio or percentage
  direction TEXT CHECK (direction IN ('closing', 'widening', 'stable')),
  baseline_value DECIMAL(10,2),
  baseline_year INTEGER,
  measurement_period TEXT,
  source TEXT,
  notes TEXT,

  -- IAB approval required
  iab_approved BOOLEAN DEFAULT FALSE,
  iab_approved_at TIMESTAMPTZ,
  iab_approved_by TEXT
);

-- Economic Mobility Signals
CREATE TABLE alma_economic_mobility_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  region TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'post_program_employment',
    'family_income_trajectory',
    'local_economic_circulation',
    'indigenous_business_creation',
    'housing_stability'
  )),
  value DECIMAL(5,2), -- Percentage or rate
  direction TEXT CHECK (direction IN ('increasing', 'decreasing', 'stable')),
  measurement_period TEXT,
  source TEXT,
  consent_level TEXT DEFAULT 'Community Controlled',
  notes TEXT,

  -- Community consent
  community_authority TEXT NOT NULL,
  consent_given_at TIMESTAMPTZ NOT NULL
);

-- Community Decision Power Signals
CREATE TABLE alma_community_power_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  region TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'funding_decision_authority',
    'policy_co_design_rate',
    'veto_exercise_frequency',
    'program_design_authority',
    'data_control'
  )),
  value DECIMAL(5,2), -- Percentage
  direction TEXT CHECK (direction IN ('increasing', 'decreasing', 'stable')),
  measurement_period TEXT,
  source TEXT,
  notes TEXT,

  -- Self-reported by community
  reported_by TEXT NOT NULL,
  validated_by_iab BOOLEAN DEFAULT FALSE
);

-- RLS Policies
ALTER TABLE alma_community_voice_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_indigenous_parity_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_economic_mobility_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_community_power_signals ENABLE ROW LEVEL SECURITY;

-- Community Controlled access only
CREATE POLICY "community_voice_access" ON alma_community_voice_signals
  FOR SELECT USING (
    consent_level = 'Public Knowledge Commons'
    OR auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'community' = community_authority
  );

-- IAB approval required for parity data
CREATE POLICY "parity_access" ON alma_indigenous_parity_signals
  FOR SELECT USING (
    iab_approved = TRUE
    OR auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'role' = 'iab_member'
  );
```

### Migration Script

```sql
-- ALMA Signal Refinements Migration
-- Version: 2026-01-02
-- Purpose: Add Community Voice, Indigenous Parity, Economic Mobility, Community Power signals

BEGIN;

-- Create new signal tables
CREATE TABLE IF NOT EXISTS alma_community_voice_signals (...);
CREATE TABLE IF NOT EXISTS alma_indigenous_parity_signals (...);
CREATE TABLE IF NOT EXISTS alma_economic_mobility_signals (...);
CREATE TABLE IF NOT EXISTS alma_community_power_signals (...);

-- Add signal_family enum update
ALTER TYPE alma_signal_family ADD VALUE IF NOT EXISTS 'community_voice';
ALTER TYPE alma_signal_family ADD VALUE IF NOT EXISTS 'indigenous_parity';
ALTER TYPE alma_signal_family ADD VALUE IF NOT EXISTS 'economic_mobility';
ALTER TYPE alma_signal_family ADD VALUE IF NOT EXISTS 'community_power';

-- Update existing signal views
CREATE OR REPLACE VIEW alma_all_signals AS
  SELECT 'system_pressure' as family, * FROM alma_system_pressure_signals
  UNION ALL
  SELECT 'community_capability' as family, * FROM alma_community_capability_signals
  UNION ALL
  SELECT 'intervention_health' as family, * FROM alma_intervention_health_signals
  UNION ALL
  SELECT 'trajectory' as family, * FROM alma_trajectory_signals
  UNION ALL
  SELECT 'community_voice' as family, * FROM alma_community_voice_signals
  UNION ALL
  SELECT 'indigenous_parity' as family, * FROM alma_indigenous_parity_signals
  UNION ALL
  SELECT 'economic_mobility' as family, * FROM alma_economic_mobility_signals
  UNION ALL
  SELECT 'community_power' as family, * FROM alma_community_power_signals;

COMMIT;
```

---

## Data Collection Plan

### Phase 1: Baseline (Q1 2026)

**Week 1-2**: Set up data sources
- [ ] Connect to AIHW Indigenous data API
- [ ] Partner with 3 Community Controlled orgs for youth voice pilot
- [ ] Design community survey instruments

**Week 3-4**: Collect baseline
- [ ] Indigenous parity: Current incarceration ratios by state
- [ ] Community voice: Pilot survey with Witta Harvest
- [ ] Economic mobility: Partner with Indigenous business network

### Phase 2: Pilot (Q2 2026)

**Month 1**: Youth voice pilot
- [ ] Survey youth at 5 Community Controlled programs
- [ ] Collect family feedback at program exit
- [ ] Track cultural safety incidents

**Month 2**: Parity tracking
- [ ] Establish quarterly AIHW data feed
- [ ] Track funding equity through JusticeHub grants
- [ ] Audit workforce representation

**Month 3**: Economic signals
- [ ] 12-month follow-up on employment outcomes
- [ ] Partner with community economic development orgs
- [ ] Track Indigenous business creation

### Phase 3: Full Implementation (Q3 2026+)

- All 8 signal families collecting data
- Quarterly ALMA reports include new signals
- IAB reviewing parity data before publication
- Dashboard visualizations for community voice

---

## Dashboard Integration

### New Dashboard Widgets

```
┌─────────────────────────────────────────────────────────────┐
│                    ALMA SIGNAL DASHBOARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SYSTEM PRESSURE          COMMUNITY CAPABILITY              │
│  ████████░░ 7.2           ██████████ 8.5                   │
│  ↑ increasing             → stable                          │
│                                                              │
│  INTERVENTION HEALTH      TRAJECTORY                        │
│  ██████░░░░ 6.0           ████████░░ 7.8                   │
│  ↓ decreasing             ↑ increasing                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    NEW SIGNAL FAMILIES                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  COMMUNITY VOICE          INDIGENOUS PARITY                 │
│  ██████████ 8.2           ████░░░░░░ 3.8 (ratio closing)   │
│  ↑ youth feeling heard    ↓ ratio improving                 │
│                                                              │
│  ECONOMIC MOBILITY        COMMUNITY POWER                   │
│  ████████░░ 6.5           ██████░░░░ 5.5                   │
│  ↑ employment improving   → stable                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

### We know this is working when:

1. **Community Voice**: Youth report feeling heard (>70% satisfaction)
2. **Indigenous Parity**: Incarceration ratio is declining year-over-year
3. **Economic Mobility**: Post-program employment sustained at 12 months
4. **Community Power**: IAB exercising veto power when needed

### We know this is failing when:

1. **Community Voice**: Survey response rate too low (<30%)
2. **Indigenous Parity**: Ratio is widening or data unavailable
3. **Economic Mobility**: Economic signals show no change
4. **Community Power**: IAB never exercises authority (performative)

---

## Integration with Justice System Metrics

These ALMA signals directly feed the 10-year justice system metrics:

| ALMA Signal | Justice System Metric |
|-------------|----------------------|
| Youth satisfaction | Diversion success |
| Incarceration ratio | Indigenous parity |
| Post-program employment | Recidivism reduction |
| Funding decision authority | Community power |
| Local economic circulation | Economic impact |

---

*Signals tell us direction. Actions determine destination.*

*Status: Implementation Ready*
*Next: Database migration, Witta Harvest pilot, AIHW data connection*
