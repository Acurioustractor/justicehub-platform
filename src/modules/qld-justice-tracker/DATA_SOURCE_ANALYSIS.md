# Queensland Youth Justice Data Source Analysis

## Overview
Before building any system, we need to understand:
1. What data sources actually exist
2. What specific data points they contain
3. How the data is structured
4. How frequently it's updated
5. What questions we can answer with this data

## Primary Data Sources Analysis

### 1. Children's Court Annual Reports
**Source**: Queensland Courts
**Format**: PDF Annual Reports
**Frequency**: Yearly
**Latest**: 2023-24 Report

**Key Data Points Available**:
- Total defendants by year
- Indigenous vs non-Indigenous breakdown
- Age distribution (10-17 years)
- Bail/remand statistics
- Time to finalization
- Offense categories
- Sentencing outcomes
- Geographic distribution

**What This Tells Us**:
- Overrepresentation rates
- System processing times
- Bail refusal patterns
- Sentencing disparities

### 2. Youth Detention Census
**Source**: Department of Children, Youth Justice and Multicultural Affairs
**Format**: PDF/Excel Quarterly Reports
**Frequency**: Quarterly
**Latest**: Q1 2024

**Key Data Points Available**:
- Daily detention population
- Demographic breakdown
- Remand vs sentenced
- Age groups
- Length of stay
- Capacity utilization
- Indigenous representation by age

**What This Tells Us**:
- Real-time detention numbers
- Overcrowding issues
- Remand rates
- Age patterns

### 3. Queensland Police Statistical Review
**Source**: Queensland Police Service
**Format**: PDF Annual Report + Online Dashboard
**Frequency**: Annual + Real-time dashboard
**Latest**: 2023-24

**Key Data Points Available**:
- Youth offender numbers
- Repeat offender rates
- Offense types
- Geographic hotspots
- Clearance rates
- Victim demographics

**What This Tells Us**:
- Crime patterns
- Repeat offending
- Geographic issues
- Enforcement effectiveness

### 4. State Budget Papers
**Source**: Queensland Treasury
**Format**: PDF Budget Documents
**Frequency**: Annual
**Latest**: 2024-25

**Key Data Points Available**:
- Total youth justice allocation
- Breakdown by category:
  - Detention operations
  - Community programs
  - Infrastructure
  - Administration
- Cost per detention bed day
- Program funding

**What This Tells Us**:
- Resource allocation
- Spending priorities
- Cost effectiveness
- Program investment

### 5. Queensland Audit Office Reports
**Source**: QAO
**Format**: PDF Performance Audits
**Frequency**: Irregular (topic-based)
**Latest**: "Managing Youth Justice Demand" (2024)

**Key Data Points Available**:
- System performance metrics
- Hidden costs analysis
- Accountability gaps
- Effectiveness measures
- Total system spending

**What This Tells Us**:
- True system costs
- Performance issues
- Accountability problems
- Waste identification

### 6. RTI Disclosure Logs
**Source**: Various departments
**Format**: Web listings + Released documents
**Frequency**: Ongoing
**Latest**: Current

**Key Data Points Available**:
- Internal reports
- Briefing notes
- Incident reports
- Policy documents
- Hidden statistics

**What This Tells Us**:
- Information government doesn't proactively release
- Internal concerns
- Incident patterns

## Data Relationships

```
Courts Data ←→ Police Data
     ↓              ↓
Detention Data ← Budget Data
     ↓              ↓
  Outcomes ← True Costs (Audit)
```

## Key Metrics We Can Track

### 1. Overrepresentation Index
- Indigenous % in detention ÷ Indigenous % in population
- Currently: ~20x overrepresentation

### 2. System Efficiency
- Average days to finalization
- Remand rates
- Bail refusal rates

### 3. Cost Analysis
- Cost per youth per day
- Detention vs community program costs
- Hidden costs (from audit reports)

### 4. Outcomes
- Repeat offender rates
- Program completion rates
- Reintegration success

## Data Gaps Identified

1. **Program Effectiveness**: Limited data on what actually works
2. **Individual Pathways**: No longitudinal tracking
3. **Early Intervention**: Minimal data on prevention
4. **Community Impact**: Limited victim/community data
5. **Real-time Data**: Most data is retrospective

## Recommended System Architecture

Based on this analysis, we should build:

### 1. Core Data Tables
- `court_proceedings` - Court appearance data
- `detention_census` - Daily detention numbers
- `police_incidents` - Youth crime data
- `budget_tracking` - Financial allocations
- `audit_findings` - Performance/accountability

### 2. Calculated Metrics
- Overrepresentation ratios
- Cost per outcome
- System efficiency scores
- Trend analysis

### 3. Data Quality Framework
- Source verification
- Update tracking
- Confidence scoring
- Change detection

### 4. Key Questions to Answer
1. Is overrepresentation getting better or worse?
2. What's the true cost of the current approach?
3. Where is the money actually going?
4. What are the real outcomes?
5. Who is accountable for failures?

## Next Steps

1. **Phase 1**: Set up core tables matching actual data structure
2. **Phase 2**: Build reliable extraction for each source
3. **Phase 3**: Create calculated metrics and insights
4. **Phase 4**: Build accountability dashboard
5. **Phase 5**: Automate monitoring and alerts