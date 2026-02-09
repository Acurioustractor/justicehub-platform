# Disability and Youth Justice: Service Mapping

**Purpose:** Map existing services for young people with disability in contact with the justice system, identify gaps, and guide JusticeHub service directory priorities.

**Target Population:** Young people aged 10-25 with cognitive disability, intellectual disability, FASD, acquired brain injury, or severe mental illness who are at risk of or currently involved with the justice system.

---

## Current State Analysis

### Services That Exist (Mapped in JusticeHub)

#### Assessment and Diagnosis
| Service | Location | Specialisation | JusticeHub Status |
|---------|----------|----------------|-------------------|
| Youth Justice Psychology Services (NSW) | NSW | Cognitive assessment in custody | Identified, needs enrichment |
| Queensland Neurodevelopmental Disability Framework | QLD | Statewide disability screening | In progress — needs monitoring |
| Victorian Youth Justice Disability Advisors | VIC | Custody and community support | Not yet mapped |
| South Australia CAIDS-Q | SA | Intellectual disability screening | Not yet mapped |
| NDIS Support Coordination | National | Plan management and service connection | Partial mapping — justice-specific pathways unclear |

#### Legal Support
| Service | Location | Specialisation | JusticeHub Status |
|---------|----------|----------------|-------------------|
| Intellectual Disability Rights Service (IDRS) | NSW | Legal advocacy for people with disability | Not yet mapped |
| Villamanta Disability Rights Legal Centre | VIC | Disability-focused legal service | Not yet mapped |
| Queensland Advocacy for Inclusion | QLD | Individual and systemic advocacy | Not yet mapped |
| Aboriginal Disability Justice Campaign | National | Indigenous disability justice advocacy | Not yet mapped |

#### Diversion and Court Support
| Service | Location | Specialisation | JusticeHub Status |
|---------|----------|----------------|-------------------|
| NSW Mental Health Diversion Program | NSW | Court diversion for mental health | Partial mapping |
| Queensland Drug and Mental Health Court | QLD | Specialist court with therapeutic approach | Not yet mapped |
| Victorian Specialist Courts | VIC | Cognitive impairment, mental health, Koori | Partial mapping |
| Intellectual Disability Diversion Program (IDDP) | NSW | Diversion for intellectual disability | Not yet mapped |

#### Accommodation and Housing
| Service | Location | Specialisation | JusticeHub Status |
|---------|----------|----------------|-------------------|
| Supported Accommodation (NDIS SIL) | National | Specialist disability accommodation | Partial — justice exit pathways unclear |
| Youth Justice Community Residences | Various | Supervised community accommodation | State-by-state variation, incomplete mapping |
| Foyer Housing Models | Various | Education + housing for young people | Limited justice-specific mapping |

#### Therapeutic Support
| Service | Location | Specialisation | JusticeHub Status |
|---------|----------|----------------|-------------------|
| FASD Hub Australia | National | FASD diagnostic and support services | Not yet mapped |
| Justice Health (custody-based) | NSW, VIC, QLD, WA | Health services in youth detention | Partial mapping |
| Orygen Youth Mental Health | National | Youth mental health services | Partial — justice partnerships unclear |
| headspace | National | Youth mental health — some justice partnerships | Mapped, but disability justice intersection not highlighted |

### Major Service Gaps

#### 1. Culturally Safe Assessment for Indigenous Young People
**Gap:** No culturally validated disability screening tools exist
**Impact:** Indigenous young people's needs go unrecognised; over-representation continues
**Priority:** Critical

#### 2. FASD-Specific Services
**Gap:** Limited diagnostic capacity; few justice-specific FASD supports
**Impact:** Young people with FASD navigate system without appropriate accommodation
**Priority:** High

#### 3. Communication Support in Police/Court Processes
**Gap:** Limited access to communication partners/support persons
**Impact:** Young people with cognitive impairment "agree" to things they don't understand
**Priority:** High

#### 4. Transition from Custody to Community
**Gap:** NDIS plans often suspended or difficult to reactivate; housing instability
**Impact:** Young people with disability cycle back into custody
**Priority:** Critical

#### 5. Early Intervention (Pre-Justice Contact)
**Gap:** Schools and child protection lack disability screening; services siloed
**Impact:** Disability not identified until crisis point
**Priority:** Critical

---

## Recommended Service Categories for JusticeHub

### New Categories to Add

```yaml
disability_support:
  name: "Disability Support Services"
  description: "Services for young people with cognitive, intellectual, or developmental disability"
  subcategories:
    - cognitive_assessment
    - fasd_support
    - intellectual_disability
    - autism_support
    - acquired_brain_injury
    - communication_support
    - ndis_navigation
    
justice_disability_intersection:
  name: "Justice and Disability"
  description: "Services specifically addressing the intersection of disability and youth justice"
  subcategories:
    - disability_aware_legal_aid
    - cognitive_impairment_diversion
    - court_communication_support
    - disability_support_in_detention
    - throughcare_disability
    - fasd_justice_programs

culturally_safe_disability:
  name: "Culturally Safe Disability Services"
  description: "Disability services designed for and by First Nations communities"
  subcategories:
    - indigenous_disability_advocacy
    - aboriginal_community_controlled_disability
    - cultural_disability_assessment
    - remote_indigenous_disability
```

### Service Tags to Implement

```yaml
disability_tags:
  - cognitive_impairment
  - intellectual_disability
  - fasd
  - autism
  - adhd
  - acquired_brain_injury
  - communication_difficulty
  - sensory_processing
  - ndis_registered
  - justice_experience_staff
  - culturally_safe_indigenous
  - trauma_informed_disability
  - youth_specific
  - court_support_available
  - police_interview_support
  - detention_visiting
  - throughcare_provided
```

---

## Priority Organisations for Enrichment

### National Priority
| Organisation | Why Priority | Current Status |
|--------------|--------------|----------------|
| FASD Hub Australia | Only national FASD coordination | Not in system |
| VALID (VIC) | Leading disability justice advocacy | Not in system |
| First People's Disability Network | Indigenous disability rights | Not in system |
| NOFASD Australia | FASD information and support | Not in system |
| IDRS (NSW) | Intellectual disability legal rights | Not in system |

### State-Based Priority

**NSW:**
- Intellectual Disability Rights Service (IDRS)
- NSW Council for Intellectual Disability
- Justice Advocacy Service
- Fetal Alcohol Spectrum Disorder (FASD) support services

**Victoria:**
- Villamanta Disability Rights Legal Centre
- Youth Disability Advocacy Service
- Action for More Independence and Dignity in Accommodation (AMIDA)

**Queensland:**
- Queensland Advocacy for Inclusion
- Epic Employment (disability employment with justice experience)
- Community Living Association

**South Australia:**
- Disability Justice Advocacy SA
- Brain Injury SA (youth programs)

**Western Australia:**
- Developmental Disability WA
- WA Association for Mental Health (youth justice programs)

**Northern Territory:**
- NT Disability Services (youth justice specific)
- Aboriginal Disability Justice Campaign (Northern Australia)

**Tasmania:**
- Disability Voices Tasmania
- Advocacy Tasmania

**ACT:**
- ACT Disability, Aged and Carer Advocacy Service (ADACAS)
- ACT Youth Disability Advocacy Service

---

## Data Integration Opportunities

### NDIS Data (de-identified)
- Youth justice referral pathways to NDIS
- Plan utilisation for justice-involved young people
- Support coordination gaps
- *Note: Requires partnership with NDIA*

### AIHW Youth Justice Data
- Disability prevalence by jurisdiction
- Diversion outcomes for young people with disability
- Recidivism rates by disability type
- *Note: Already referenced, could be linked*

### Education Data
- Suspension/expulsion rates for students with disability
- School exclusions and subsequent justice contact
- Special education to justice pathway
- *Note: Complex data sharing requirements*

### Child Protection Data
- Children in care with disability
- Care-to-custody trajectories
- OOHC placement changes and justice outcomes
- *Note: State-based variation in recording*

---

## Recommended Content for JusticeHub

### Articles to Develop
1. "Understanding FASD in Youth Justice Contexts"
2. "Your Rights: Disability and Police Interactions"
3. "Navigating Court with a Cognitive Disability"
4. "NDIS and Justice: What Families Need to Know"
5. "Culturally Safe Disability Assessment for Aboriginal Young People"

### Service Finder Enhancements
- Filter: "Services for people with cognitive disability"
- Filter: "FASD-informed services"
- Filter: "Communication support available"
- Filter: "NDIS-registered providers with justice experience"
- Filter: "Indigenous-led disability services"

### Stories to Collect
- Lived experience: Young person with disability navigating court
- Lived experience: Family advocating for child's needs in justice system
- Practitioner perspective: Lawyer working with client with cognitive impairment
- Practitioner perspective: Youth worker supporting NDIS access post-release

---

## Implementation Roadmap

### Phase 1: Foundation (Immediate)
- [ ] Add disability_justice and cognitive_impairment tags to existing services
- [ ] Create new service category: Disability Support Services
- [ ] Map 5 priority national organisations (FASD Hub, VALID, FPDN, NOFASD, IDRS)
- [ ] Add disability indicator to youth justice service criteria

### Phase 2: Enrichment (1-2 months)
- [ ] Scrape state-based disability advocacy organisations
- [ ] Research NDIS providers with youth justice specialisation
- [ ] Identify FASD diagnostic services by state
- [ ] Map cognitive impairment diversion programs

### Phase 3: Integration (2-3 months)
- [ ] Develop disability-specific service finder filters
- [ ] Create resource articles on disability justice intersection
- [ ] Link to ALMA intelligence on disability-justice programs
- [ ] Collect and publish lived experience stories (with consent)

### Phase 4: Advocacy (Ongoing)
- [ ] Track Disability Royal Commission recommendation implementation
- [ ] Monitor state/territory disability screening rollouts
- [ ] Advocate for service gap closures through platform data

---

## Measurement

### Success Metrics
- Services tagged with disability specialisation: Target 50+
- Organisations with FASD expertise: Target 15+
- Indigenous disability services: Target 20+
- Articles on disability justice: Target 5+
- Lived experience stories: Target 3+

### Impact Indicators
- Search volume for disability-related service queries
- Referrals to disability-specific services
- User feedback on service appropriateness
- Advocacy outcomes informed by platform data

---

**Document Status:** Draft for review
**Last Updated:** February 2026
**Next Review:** Quarterly (align with ALMA funding priorities review)
**Owner:** JusticeHub Content and Research Team
