# JusticeHub Complete Site Map & Route Plan

**Date:** January 4, 2026
**Purpose:** Comprehensive site architecture, route map, UI/UX specifications for every page
**Brand Philosophy:** "Truth needs no filter, accessible by design"

---

## 🎯 Site Architecture Overview

```
JusticeHub
├── Public Marketing (White BG, Bold Brand)
├── Intelligence/Data (Dark BG, ALMA Style)
├── Stewards (Green Accent, Community)
├── Admin/Dashboard (SimCity Style)
└── Utility Pages (Standard)
```

---

## 📊 SECTION 1: PUBLIC MARKETING PAGES

**Style:** White background, black borders, blunt data-driven messaging

### 1.1 Homepage `/`
**Route:** `src/app/page.tsx`
**Status:** ✅ Exists
**Purpose:** Immediate crisis intervention access + shocking truth

#### UI Structure
```tsx
<Navigation fixed />

{/* Hero - Above fold */}
<Hero className="h-screen flex items-center justify-center bg-white border-b-2 border-black">
  <RotatingStats>
    <Stat number="24x" context="Indigenous kids locked up vs non-Indigenous" />
    <Stat number="$1.1M" context="Per child per year. To make things worse." />
    <Stat number="95%" context="Don't reoffend with community programs" />
  </RotatingStats>

  <CTAPrimary href="/services">
    FIND HELP NOW
  </CTAPrimary>

  <CTASecondary href="#truth">
    SEE THE DATA
  </CTASecondary>
</Hero>

{/* Truth Section - Comparison */}
<ComparisonSection id="truth">
  <SuccessCard title="COMMUNITY PROGRAMS">
    <Stat>78%</Stat>
    <Result>Successfully stay out of detention</Result>
    <Cost>$10k per year</Cost>
  </SuccessCard>

  <FailureCard title="DETENTION">
    <Stat>15.5%</Stat>
    <Result>Success rate (lower than doing nothing)</Result>
    <Cost>$1.1M per year</Cost>
  </FailureCard>
</ComparisonSection>

{/* CTA to Services */}
<ActionSection>
  <Headline>Communities have the cure</Headline>
  <Grid>
    <ServiceCard href="/services">Crisis Support</ServiceCard>
    <ServiceCard href="/community-programs">Find Programs</ServiceCard>
    <ServiceCard href="/intelligence">See The Evidence</ServiceCard>
  </Grid>
</ActionSection>

{/* Steward CTA */}
<StewardSection bg="green-50">
  <CTASteward href="/stewards">
    PROTECT WHAT WORKS
  </CTASteward>
</StewardSection>

<Footer />
```

#### User Journey
1. **Crisis User:** Sees "FIND HELP NOW" → Services
2. **Curious Visitor:** Sees stats → Scrolls to data → Intelligence
3. **Community Member:** Sees "PROTECT WHAT WORKS" → Stewards
4. **Professional:** Sees evidence → Centre of Excellence

#### Accessibility
- [ ] Skip to main content
- [ ] High contrast mode support
- [ ] Keyboard navigation for carousel
- [ ] Screen reader announces stat changes
- [ ] Touch targets ≥ 44px

---

### 1.2 Services `/services`
**Route:** `src/app/services/page.tsx`
**Status:** ✅ Exists
**Purpose:** Immediate crisis intervention directory

#### UI Structure
```tsx
<Navigation />

<Hero>
  <Badge urgent>IMMEDIATE HELP AVAILABLE</Badge>
  <Headline>24/7 Crisis Support</Headline>
  <Body>Free, confidential, community-led</Body>
</Hero>

<FilterableDirectory>
  <Filters>
    <Filter by="location" />
    <Filter by="age-group" />
    <Filter by="crisis-type" />
    <Filter by="language" />
  </Filters>

  <ServiceCards>
    {services.map(service => (
      <ServiceCard>
        <Badge>{service.available ? "AVAILABLE NOW" : "Next available"}</Badge>
        <Name>{service.name}</Name>
        <Description>{service.help_with}</Description>
        <Contact>
          <Phone>{service.phone}</Phone>
          <Hours>{service.hours}</Hours>
        </Contact>
        <Languages>{service.languages}</Languages>
      </ServiceCard>
    ))}
  </ServiceCards>
</FilterableDirectory>

<EmergencyFooter>
  <Warning>In immediate danger? Call 000</Warning>
  <Alternatives>
    <Link>Lifeline 13 11 14</Link>
    <Link>Kids Helpline 1800 55 1800</Link>
  </Alternatives>
</EmergencyFooter>
```

#### User Flow
1. Land → See "AVAILABLE NOW" badges
2. Filter by location/need
3. Click to call/contact
4. (Future) Book appointment inline

#### Data Requirements
- Real-time availability status
- Multi-language support
- Geolocation for proximity sorting
- Cultural safety indicators

---

### 1.3 Community Programs `/community-programs`
**Route:** `src/app/community-programs/page.tsx`
**Status:** ✅ Exists
**Purpose:** Evidence-based program directory

#### UI Structure
```tsx
<Hero>
  <Stat>242</Stat>
  <Headline>Community Programs That Work</Headline>
  <Body>Evidence-based, community-led, proven results</Body>
</Hero>

<StatsBar>
  <Stat label="AVG SUCCESS RATE">78%</Stat>
  <Stat label="VS DETENTION">5x better</Stat>
  <Stat label="COST SAVINGS">$1.09M per youth</Stat>
</StatsBar>

<FilterableGrid>
  <Filters>
    <Filter by="outcome-type" />
    <Filter by="location" />
    <Filter by="age-group" />
    <Filter by="cultural-safety" />
  </Filters>

  <ProgramCards>
    {programs.map(program => (
      <ProgramCard>
        <SuccessBadge>{program.success_rate}%</SuccessBadge>
        <Name>{program.name}</Name>
        <Organization>{program.org}</Organization>
        <Outcomes>{program.outcomes}</Outcomes>
        <Evidence href={`/intelligence/programs/${program.id}`}>
          SEE THE DATA
        </Evidence>
      </ProgramCard>
    ))}
  </ProgramCards>
</FilterableGrid>

<CTAAdd href="/community-programs/add">
  ADD YOUR PROGRAM
</CTAAdd>
```

#### Individual Program `/community-programs/[id]`
```tsx
<ProgramDetail>
  <Header>
    <SuccessBadge large>{program.success_rate}%</SuccessBadge>
    <Title>{program.name}</Title>
    <Organization>{program.org}</Organization>
  </Header>

  <OutcomesSection>
    <Stat label="YOUTH SERVED">{program.youth_count}</Stat>
    <Stat label="SUCCESS RATE">{program.success_rate}%</Stat>
    <Stat label="AVG COST">${program.cost}</Stat>
  </OutcomesSection>

  <Evidence>
    <DataVisualization type="outcomes-over-time" />
    <ComparisonChart vs="detention" />
  </Evidence>

  <Contact>
    <CTA href={`mailto:${program.email}`}>REFER A YOUTH</CTA>
    <Info>{program.contact_info}</Info>
  </Contact>
</ProgramDetail>
```

---

### 1.4 About `/about`
**Route:** `src/app/about/page.tsx`
**Status:** ✅ Exists
**Purpose:** Mission, values, who we are

#### UI Structure
```tsx
<Hero>
  <Headline>Truth needs no filter</Headline>
  <Body>
    Australia locks up children. Communities have the cure.
    We're building the infrastructure to prove it.
  </Body>
</Hero>

<MissionSection>
  <SectionHeadline>What We Do</SectionHeadline>
  <Grid cols={3}>
    <Mission icon={<Database />}>
      <Title>Connect</Title>
      <Body>Link kids and families to what works</Body>
    </Mission>
    <Mission icon={<Shield />}>
      <Title>Protect</Title>
      <Body>Steward community knowledge and programs</Body>
    </Mission>
    <Mission icon={<TrendingUp />}>
      <Title>Prove</Title>
      <Body>Build evidence that communities work</Body>
    </Mission>
  </Grid>
</MissionSection>

<ValuesSection>
  <SectionHeadline>Our Principles</SectionHeadline>
  <Values>
    <Value>
      <Bold>Community First</Bold>
      <Body>Communities own their data, knowledge, and success</Body>
    </Value>
    <Value>
      <Bold>Evidence Over Emotion</Bold>
      <Body>Data-driven, research-backed, community-validated</Body>
    </Value>
    <Value>
      <Bold>Accessible By Design</Bold>
      <Body>WCAG AAA, keyboard navigable, screen reader optimized</Body>
    </Value>
  </Values>
</ValuesSection>

<TeamSection optional>
  {/* Only include if we want public team page */}
</TeamSection>
```

---

### 1.5 How It Works `/how-it-works`
**Route:** `src/app/how-it-works/page.tsx`
**Status:** ✅ Exists
**Purpose:** Explain the system, build trust

#### UI Structure
```tsx
<Hero>
  <Headline>How JusticeHub Works</Headline>
  <Body>From crisis to community, evidence to action</Body>
</Hero>

<FlowDiagram>
  <Step number="1">
    <Icon><Phone /></Icon>
    <Title>IMMEDIATE HELP</Title>
    <Body>24/7 crisis support, free and confidential</Body>
  </Step>

  <Arrow />

  <Step number="2">
    <Icon><Users /></Icon>
    <Title>COMMUNITY PROGRAMS</Title>
    <Body>Connect to proven, culturally safe programs</Body>
  </Step>

  <Arrow />

  <Step number="3">
    <Icon><TrendingUp /></Icon>
    <Title>TRACK OUTCOMES</Title>
    <Body>Measure success, build evidence, protect what works</Body>
  </Step>

  <Arrow />

  <Step number="4">
    <Icon><Database /></Icon>
    <Title>ALMA INTELLIGENCE</Title>
    <Body>Learn what works, guide resources, scale success</Body>
  </Step>
</FlowDiagram>

<ForWhoSection>
  <SectionHeadline>Who Is This For?</SectionHeadline>
  <Grid>
    <Audience>
      <Title>Youth & Families</Title>
      <Body>Find immediate help and community support</Body>
      <CTA href="/services">GET HELP NOW</CTA>
    </Audience>

    <Audience>
      <Title>Community Programs</Title>
      <Body>Share your success, protect your knowledge</Body>
      <CTA href="/community-programs/add">ADD YOUR PROGRAM</CTA>
    </Audience>

    <Audience>
      <Title>Policy Makers</Title>
      <Body>See what works, where to invest</Body>
      <CTA href="/intelligence">VIEW EVIDENCE</CTA>
    </Audience>

    <Audience>
      <Title>Stewards</Title>
      <Body>Protect community knowledge and programs</Body>
      <CTA href="/stewards">BECOME A STEWARD</CTA>
    </Audience>
  </Grid>
</ForWhoSection>
```

---

## 📈 SECTION 2: INTELLIGENCE & DATA PAGES

**Style:** Dark background (#0a0f16), ALMA green/orange, data visualization focus

### 2.1 Intelligence Hub `/intelligence`
**Route:** `src/app/intelligence/page.tsx`
**Status:** ✅ Exists
**Purpose:** Evidence dashboard, data storytelling

#### UI Structure
```tsx
<DarkLayout>
  <ProgressBar gradient="green-to-orange" />

  <Hero dark>
    <Badge>ALMA INTELLIGENCE</Badge>
    <Headline>Communities Work. Here's Proof.</Headline>
  </Hero>

  <StatsGrid dark>
    <Stat color="green">
      <Number>78%</Number>
      <Label>Community program success rate</Label>
    </Stat>

    <Stat color="orange">
      <Number>15.5%</Number>
      <Label>Detention success rate</Label>
    </Stat>

    <Stat color="green">
      <Number>$1.09M</Number>
      <Label>Saved per youth (vs detention)</Label>
    </Stat>
  </StatsGrid>

  <VisualizationGallery>
    <VizCard href="/intelligence/interventions">
      <Preview><InterventionsChart /></Preview>
      <Title>What Works</Title>
      <Body>Evidence-based intervention outcomes</Body>
    </VizCard>

    <VizCard href="/intelligence/portfolio">
      <Preview><PortfolioViz /></Preview>
      <Title>Investment Portfolio</Title>
      <Body>Where money goes, what it achieves</Body>
    </VizCard>

    <VizCard href="/intelligence/nt-showcase">
      <Preview><NTShowcaseViz /></Preview>
      <Title>NT Justice Reinvestment</Title>
      <Body>Real programs, real results</Body>
    </VizCard>
  </VisualizationGallery>

  <CTASection>
    <CTA href="/stewards">
      BECOME A DATA STEWARD
    </CTA>
  </CTASection>
</DarkLayout>
```

---

### 2.2 Interventions `/intelligence/interventions`
**Route:** `src/app/intelligence/interventions/page.tsx`
**Status:** ✅ Exists
**Purpose:** What works in youth justice (scrollytelling)

#### UI Structure (Scrollytelling)
```tsx
<ScrollytellingLayout dark>
  <Chapter>
    <Sticky>
      <Visualization type="interventions-comparison" />
    </Sticky>
    <Narrative>
      <Slide>
        <Headline>95% of programs work better than detention</Headline>
        <Body>Community-led interventions show 78% success rate</Body>
      </Slide>

      <Slide>
        <Headline>Detention fails 84.5% of the time</Headline>
        <Body>Yet we spend $1.1M per child to make things worse</Body>
      </Slide>

      <Slide>
        <Headline>Cultural programs lead the way</Headline>
        <Body>On-Country healing shows 92% success rate</Body>
        <DataPoint programs={culturalPrograms} />
      </Slide>
    </Narrative>
  </Chapter>

  <Chapter>
    <Sticky>
      <Visualization type="cost-comparison" />
    </Sticky>
    <Narrative>
      <Slide>
        <Headline>$10k vs $1.1M per year</Headline>
        <Body>Community programs cost 110x less than detention</Body>
      </Slide>
    </Narrative>
  </Chapter>

  <CTASection>
    <CTA href="/community-programs">
      FIND PROGRAMS THAT WORK
    </CTA>
  </CTASection>
</ScrollytellingLayout>
```

---

### 2.3 Evidence Detail `/intelligence/evidence/[id]`
**Route:** `src/app/intelligence/evidence/[id]/page.tsx`
**Status:** ✅ Exists
**Purpose:** Deep dive on specific evidence/research

#### UI Structure
```tsx
<DarkLayout>
  <Header>
    <Badge color="green">EVIDENCE</Badge>
    <Title>{evidence.title}</Title>
    <Meta>
      <Source>{evidence.source}</Source>
      <Date>{evidence.published_date}</Date>
    </Meta>
  </Header>

  <KeyFindings>
    <SectionHeadline>Key Findings</SectionHeadline>
    <FindingsGrid>
      {evidence.findings.map(finding => (
        <Finding>
          <Stat>{finding.stat}</Stat>
          <Description>{finding.description}</Description>
        </Finding>
      ))}
    </FindingsGrid>
  </KeyFindings>

  <Methodology>
    <SectionHeadline>Methodology</SectionHeadline>
    <Body>{evidence.methodology}</Body>
  </Methodology>

  <RelatedPrograms>
    <SectionHeadline>Programs Using This Evidence</SectionHeadline>
    <ProgramsList programs={evidence.programs} />
  </RelatedPrograms>
</DarkLayout>
```

---

### 2.4 Portfolio View `/intelligence/portfolio`
**Route:** `src/app/intelligence/portfolio/page.tsx`
**Status:** ✅ Exists
**Purpose:** Investment portfolio analysis (where money goes, outcomes achieved)

#### UI Structure
```tsx
<DarkLayout>
  <Hero>
    <Headline>Justice Investment Portfolio</Headline>
    <Body>Where Australia invests in youth justice, and what it achieves</Body>
  </Hero>

  <SankeyDiagram>
    {/* Money flow: Government → Programs/Detention → Outcomes */}
    <Flow from="Government Budget ($2.1B)" />
    <Flow to="Detention ($1.8B)" outcome="15.5% success" />
    <Flow to="Community Programs ($300M)" outcome="78% success" />
  </SankeyDiagram>

  <ComparisonTable>
    <Row type="detention">
      <Investment>$1.8B/year</Investment>
      <Success>15.5%</Success>
      <ROI negative>-$1.53B wasted</ROI>
    </Row>

    <Row type="community">
      <Investment>$300M/year</Investment>
      <Success>78%</Success>
      <ROI positive>$1.5B value created</ROI>
    </Row>
  </ComparisonTable>

  <RecommendationsSection>
    <SectionHeadline>What This Means</SectionHeadline>
    <Recommendation>
      <Bold>Shift $1B from detention to community</Bold>
      <Body>Could serve 100,000 youth with proven programs</Body>
      <Impact>84,000 more youth succeed (vs current system)</Impact>
    </Recommendation>
  </RecommendationsSection>
</DarkLayout>
```

---

### 2.5 NT Showcase `/intelligence/nt-showcase`
**Route:** `src/app/intelligence/nt-showcase/page.tsx`
**Status:** ✅ Exists
**Purpose:** Northern Territory justice reinvestment showcase

#### UI Structure
```tsx
<DarkLayout>
  <Hero>
    <Headline>NT: Communities Taking Back Justice</Headline>
    <Body>Real programs, real results, real futures</Body>
  </Hero>

  <MapVisualization>
    <InteractiveMap region="NT">
      {programs.map(program => (
        <Marker location={program.location}>
          <ProgramPreview {...program} />
        </Marker>
      ))}
    </InteractiveMap>
  </MapVisualization>

  <ProgramShowcase>
    {ntPrograms.map(program => (
      <ShowcaseCard>
        <CommunityImage src={program.image} />
        <ProgramName>{program.name}</ProgramName>
        <Location>{program.community}</Location>
        <Outcomes>
          <Stat>{program.success_rate}%</Stat>
          <Stat>{program.youth_served} youth served</Stat>
        </Outcomes>
        <Story>{program.impact_story}</Story>
        <CTA href={`/community-programs/${program.id}`}>
          LEARN MORE
        </CTA>
      </ShowcaseCard>
    ))}
  </ProgramShowcase>
</DarkLayout>
```

---

## 🌱 SECTION 3: STEWARD PAGES

**Style:** Green accent (#15803d), community-focused, nurturing tone

### 3.1 Stewards Landing `/stewards`
**Route:** `src/app/stewards/page.tsx`
**Status:** ✅ Exists
**Purpose:** Steward membership, protect what works

#### UI Structure
```tsx
<Layout steward>
  <Hero>
    <Badge green>
      <Leaf /> STEWARD PROGRAM
    </Badge>
    <Headline>Protect What Works</Headline>
    <Body>
      Steward community knowledge, protect proven programs,
      guide resources where they belong
    </Body>
  </Hero>

  <WhyStewardSection bg="green-50">
    <SectionHeadline>Why Steward?</SectionHeadline>
    <Grid>
      <Reason>
        <Icon green><Shield /></Icon>
        <Title>Protect Community Knowledge</Title>
        <Body>Communities own their data, success, and future</Body>
      </Reason>

      <Reason>
        <Icon green><TrendingUp /></Icon>
        <Title>Prove What Works</Title>
        <Body>Build evidence that protects programs from cuts</Body>
      </Reason>

      <Reason>
        <Icon green><Users /></Icon>
        <Title>Guide Resources</Title>
        <Body>Ensure money flows to what actually works</Body>
      </Reason>
    </Grid>
  </WhyStewardSection>

  <PrinciplesSection>
    <SectionHeadline>Stewardship Principles</SectionHeadline>
    <Principles>
      <Principle number="1">
        <Bold>Nurture, Don't Extract</Bold>
        <Body>We grow community capacity, not mine it for data</Body>
      </Principle>

      <Principle number="2">
        <Bold>Protect What Works</Bold>
        <Body>Evidence-based programs deserve protection from budget cuts</Body>
      </Principle>

      <Principle number="3">
        <Bold>Community First</Bold>
        <Body>Communities own their data, knowledge, and success stories</Body>
      </Principle>

      <Principle number="4">
        <Bold>Long-Term Thinking</Bold>
        <Body>Steward for generations, not quarterly reports</Body>
      </Principle>
    </Principles>
  </PrinciplesSection>

  <ImpactSection>
    <SectionHeadline>Steward Impact</SectionHeadline>
    <StatsBar green>
      <Stat>{steward_count} Stewards</Stat>
      <Stat>{programs_protected} Programs Protected</Stat>
      <Stat>{knowledge_items} Knowledge Items Stewarded</Stat>
    </StatsBar>

    <CTA green href="/stewards/impact">
      SEE THE IMPACT
    </CTA>
  </ImpactSection>

  <JoinSection bg="green-700" text="white">
    <Headline white>Become a Steward</Headline>
    <Body white>
      Join community members, program leaders, and allies
      protecting what works
    </Body>

    <CTAPrimary href="/signup?type=steward">
      JOIN AS STEWARD
    </CTAPrimary>
  </JoinSection>
</Layout>
```

---

### 3.2 Steward Impact `/stewards/impact`
**Route:** `src/app/stewards/impact/page.tsx`
**Status:** ✅ Exists
**Purpose:** Show steward collective impact

#### UI Structure
```tsx
<Layout steward>
  <Hero>
    <Badge green>COLLECTIVE IMPACT</Badge>
    <Headline>What Stewards Protect</Headline>
  </Hero>

  <ImpactVisualization>
    <NetworkGraph>
      {/* Show connections between stewards, programs, communities */}
      <Node type="steward" count={steward_count} />
      <Node type="program" count={programs_protected} />
      <Node type="community" count={communities_served} />
    </NetworkGraph>
  </ImpactVisualization>

  <StatsGrid green>
    <Stat>
      <Number>{programs_protected}</Number>
      <Label>Programs Protected</Label>
    </Stat>

    <Stat>
      <Number>{funding_secured}</Number>
      <Label>Funding Secured</Label>
    </Stat>

    <Stat>
      <Number>{youth_served}</Number>
      <Label>Youth Served</Label>
    </Stat>

    <Stat>
      <Number>{knowledge_items}</Number>
      <Label>Knowledge Items</Label>
    </Stat>
  </StatsGrid>

  <StoriesSection>
    <SectionHeadline>Steward Stories</SectionHeadline>
    {steward_stories.map(story => (
      <StoryCard>
        <StewardName>{story.steward_name}</StewardName>
        <Program>{story.program_name}</Program>
        <Impact>{story.impact_description}</Impact>
      </StoryCard>
    ))}
  </StoriesSection>
</Layout>
```

---

## 🏗️ SECTION 4: ADMIN/DASHBOARD PAGES

**Style:** SimCity brutalist, hard shadows, grid-based, functional

### 4.1 Admin Dashboard `/admin`
**Route:** `src/app/admin/page.tsx`
**Status:** ✅ Exists
**Purpose:** Central admin hub

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Badge green>
      <Leaf /> ADMIN DASHBOARD
    </Badge>
    <Title>JusticeHub Control</Title>
  </Header>

  <StatsGrid>
    <StatCard>
      <Number>{stats.total_programs}</Number>
      <Label>Total Programs</Label>
    </StatCard>

    <StatCard>
      <Number>{stats.total_services}</Number>
      <Label>Crisis Services</Label>
    </StatCard>

    <StatCard>
      <Number>{stats.total_stories}</Number>
      <Label>Stories</Label>
    </StatCard>

    <StatCard>
      <Number>{stats.total_media}</Number>
      <Label>Media Items</Label>
    </StatCard>
  </StatsGrid>

  <QuickActions>
    <ActionCard href="/admin/programs">
      <Icon><Briefcase /></Icon>
      <Title>Manage Programs</Title>
    </ActionCard>

    <ActionCard href="/admin/services">
      <Icon><Phone /></Icon>
      <Title>Manage Services</Title>
    </ActionCard>

    <ActionCard href="/admin/stories/new">
      <Icon><FileText /></Icon>
      <Title>Add Story</Title>
    </ActionCard>

    <ActionCard href="/admin/media">
      <Icon><Image /></Icon>
      <Title>Media Library</Title>
    </ActionCard>

    <ActionCard href="/admin/empathy-ledger">
      <Icon><Database /></Icon>
      <Title>Empathy Ledger Sync</Title>
    </ActionCard>

    <ActionCard href="/admin/auto-linking">
      <Icon><Link /></Icon>
      <Title>Auto-Linking</Title>
    </ActionCard>
  </QuickActions>

  <RecentActivity>
    <SectionHeadline>Recent Activity</SectionHeadline>
    <ActivityFeed items={recent_activities} />
  </RecentActivity>
</AdminLayout>
```

---

### 4.2 Programs Management `/admin/programs`
**Route:** `src/app/admin/programs/page.tsx`
**Status:** ✅ Exists
**Purpose:** CRUD for community programs

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Title>Programs Management</Title>
    <CTAButton href="/community-programs/add">
      <Plus /> Add Program
    </CTAButton>
  </Header>

  <FilterBar>
    <Filter by="status" />
    <Filter by="location" />
    <Filter by="organization" />
    <Search placeholder="Search programs..." />
  </FilterBar>

  <ProgramsTable>
    <TableHead>
      <Column>Program</Column>
      <Column>Organization</Column>
      <Column>Success Rate</Column>
      <Column>Youth Served</Column>
      <Column>Status</Column>
      <Column>Actions</Column>
    </TableHead>

    <TableBody>
      {programs.map(program => (
        <Row>
          <Cell>{program.name}</Cell>
          <Cell>{program.organization}</Cell>
          <Cell highlight="green">{program.success_rate}%</Cell>
          <Cell>{program.youth_served}</Cell>
          <Cell><StatusBadge status={program.status} /></Cell>
          <Cell>
            <ActionMenu>
              <Edit href={`/admin/programs/${program.id}/edit`} />
              <View href={`/community-programs/${program.id}`} />
              <Delete />
            </ActionMenu>
          </Cell>
        </Row>
      ))}
    </TableBody>
  </ProgramsTable>
</AdminLayout>
```

---

### 4.3 Services Management `/admin/services`
**Route:** `src/app/admin/services/page.tsx`
**Status:** ✅ Exists
**Purpose:** Manage crisis services directory

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Title>Crisis Services</Title>
    <CTAButton href="/admin/services/new">
      <Plus /> Add Service
    </CTAButton>
  </Header>

  <AvailabilityDashboard>
    <SectionHeadline>Availability Status</SectionHeadline>
    <StatusGrid>
      <StatusCard available>
        <Count>{services_available}</Count>
        <Label>Available Now</Label>
      </StatusCard>

      <StatusCard offline>
        <Count>{services_offline}</Count>
        <Label>Offline</Label>
      </StatusCard>
    </StatusGrid>
  </AvailabilityDashboard>

  <ServicesTable>
    <TableHead>
      <Column>Service</Column>
      <Column>Type</Column>
      <Column>Availability</Column>
      <Column>Contact</Column>
      <Column>Languages</Column>
      <Column>Actions</Column>
    </TableHead>

    <TableBody>
      {services.map(service => (
        <Row urgent={service.is_urgent}>
          <Cell>{service.name}</Cell>
          <Cell>{service.type}</Cell>
          <Cell>
            <AvailabilityBadge status={service.availability} />
          </Cell>
          <Cell>{service.phone}</Cell>
          <Cell>{service.languages.join(', ')}</Cell>
          <Cell>
            <ActionMenu>
              <Edit />
              <UpdateAvailability />
              <Delete />
            </ActionMenu>
          </Cell>
        </Row>
      ))}
    </TableBody>
  </ServicesTable>
</AdminLayout>
```

---

### 4.4 Stories Management `/admin/stories`
**Route:** `src/app/admin/stories/page.tsx`
**Status:** ✅ Exists
**Purpose:** Manage stories (synced from Empathy Ledger)

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Title>Stories</Title>
    <CTAGroup>
      <CTAButton href="/admin/stories/new">
        <Plus /> New Story
      </CTAButton>
      <CTAButton secondary href="/admin/empathy-ledger">
        <Sync /> Sync from Empathy Ledger
      </CTAButton>
    </CTAGroup>
  </Header>

  <SyncStatus>
    <LastSync>Last synced: {last_sync_time}</LastSync>
    <SyncButton onClick={triggerSync}>Sync Now</SyncButton>
  </SyncStatus>

  <StoriesGrid>
    {stories.map(story => (
      <StoryCard>
        <Image src={story.thumbnail} />
        <Title>{story.title}</Title>
        <Storyteller>{story.storyteller_name}</Storyteller>
        <Status>
          {story.is_syndicated && <Badge>Syndicated</Badge>}
          {story.is_public && <Badge>Public</Badge>}
        </Status>
        <Actions>
          <View href={`/stories/${story.slug}`} />
          <Edit href={`/admin/stories/${story.id}`} />
        </Actions>
      </StoryCard>
    ))}
  </StoriesGrid>
</AdminLayout>
```

---

### 4.5 Empathy Ledger Sync `/admin/empathy-ledger`
**Route:** `src/app/admin/empathy-ledger/page.tsx`
**Status:** ✅ Exists
**Purpose:** Sync stories from Empathy Ledger via syndication API

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Title>Empathy Ledger Syndication</Title>
  </Header>

  <SyncStatus>
    <StatusCard>
      <Icon><Database /></Icon>
      <Title>Connection Status</Title>
      <Status connected={api_connected}>
        {api_connected ? "Connected" : "Disconnected"}
      </Status>
    </StatusCard>

    <StatusCard>
      <Icon><Sync /></Icon>
      <Title>Last Sync</Title>
      <Time>{last_sync_time}</Time>
    </StatusCard>

    <StatusCard>
      <Icon><FileText /></Icon>
      <Title>Stories Synced</Title>
      <Count>{synced_stories_count}</Count>
    </StatusCard>
  </SyncStatus>

  <SyncActions>
    <CTAButton onClick={syncAll}>
      <Sync /> Sync All Stories
    </CTAButton>

    <CTAButton secondary onClick={syncNew}>
      <Plus /> Sync New Only
    </CTAButton>
  </SyncActions>

  <SyncLog>
    <SectionHeadline>Sync Log</SectionHeadline>
    <LogTable>
      {sync_logs.map(log => (
        <LogRow>
          <Time>{log.timestamp}</Time>
          <Action>{log.action}</Action>
          <Status success={log.success}>
            {log.success ? "Success" : "Failed"}
          </Status>
          <Details>{log.details}</Details>
        </LogRow>
      ))}
    </LogTable>
  </SyncLog>

  <APIConfig>
    <SectionHeadline>API Configuration</SectionHeadline>
    <ConfigForm>
      <Field>
        <Label>Empathy Ledger URL</Label>
        <Input value={api_url} />
      </Field>

      <Field>
        <Label>API Token</Label>
        <Input type="password" value={api_token} />
      </Field>

      <CTAButton>Save Configuration</CTAButton>
    </ConfigForm>
  </APIConfig>
</AdminLayout>
```

---

### 4.6 Organizations Management `/admin/organizations`
**Route:** `src/app/admin/organizations/page.tsx`
**Status:** ✅ Exists
**Purpose:** Manage partner organizations

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Title>Organizations</Title>
    <CTAButton href="/admin/organizations/new">
      <Plus /> Add Organization
    </CTAButton>
  </Header>

  <OrganizationsTable>
    {organizations.map(org => (
      <OrgCard>
        <Logo src={org.logo} />
        <Name>{org.name}</Name>
        <Type>{org.type}</Type>
        <Stats>
          <Stat>{org.programs_count} Programs</Stat>
          <Stat>{org.services_count} Services</Stat>
        </Stats>
        <Actions>
          <Edit href={`/admin/organizations/${org.slug}`} />
          <View href={`/organizations/${org.slug}`} />
        </Actions>
      </OrgCard>
    ))}
  </OrganizationsTable>
</AdminLayout>
```

---

### 4.7 Media Library `/admin/media`
**Route:** `src/app/admin/media/page.tsx`
**Status:** ✅ Exists
**Purpose:** Media asset management

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Title>Media Library</Title>
    <UploadButton>
      <Upload /> Upload Media
    </UploadButton>
  </Header>

  <FilterBar>
    <Filter by="type" options={['Image', 'Video', 'Document']} />
    <Filter by="usage" options={['Used', 'Unused']} />
    <Search placeholder="Search media..." />
  </FilterBar>

  <MediaGrid>
    {media.map(item => (
      <MediaCard>
        <Preview src={item.url} type={item.type} />
        <Filename>{item.filename}</Filename>
        <Meta>
          <Size>{item.size}</Size>
          <Date>{item.uploaded_at}</Date>
        </Meta>
        <Actions>
          <Copy url={item.url} />
          <Delete />
        </Actions>
      </MediaCard>
    ))}
  </MediaGrid>
</AdminLayout>
```

---

### 4.8 Auto-Linking System `/admin/auto-linking`
**Route:** `src/app/admin/auto-linking/page.tsx`
**Status:** ✅ Exists
**Purpose:** Configure automatic entity linking (programs ↔ organizations ↔ people)

#### UI Structure
```tsx
<AdminLayout>
  <Header>
    <Title>Auto-Linking System</Title>
  </Header>

  <ConfigSection>
    <SectionHeadline>Linking Rules</SectionHeadline>
    <RulesGrid>
      <Rule>
        <Type>Programs → Organizations</Type>
        <Status enabled={rules.programs_orgs}>
          {rules.programs_orgs ? "Enabled" : "Disabled"}
        </Status>
        <Toggle />
      </Rule>

      <Rule>
        <Type>People → Organizations</Type>
        <Status enabled={rules.people_orgs}>
          {rules.people_orgs ? "Enabled" : "Disabled"}
        </Status>
        <Toggle />
      </Rule>

      <Rule>
        <Type>Stories → Programs</Type>
        <Status enabled={rules.stories_programs}>
          {rules.stories_programs ? "Enabled" : "Disabled"}
        </Status>
        <Toggle />
      </Rule>
    </RulesGrid>
  </ConfigSection>

  <ActivityLog>
    <SectionHeadline>Recent Auto-Links</SectionHeadline>
    <LogTable>
      {auto_links.map(link => (
        <LogRow>
          <Time>{link.created_at}</Time>
          <Entities>
            {link.entity_1_name} ↔ {link.entity_2_name}
          </Entities>
          <Confidence>{link.confidence}%</Confidence>
          <Actions>
            <Approve />
            <Reject />
          </Actions>
        </LogRow>
      ))}
    </LogTable>
  </ActivityLog>
</AdminLayout>
```

---

## 📖 SECTION 5: CONTENT PAGES

### 5.1 Stories Hub `/stories`
**Route:** `src/app/stories/page.tsx`
**Status:** ✅ Exists
**Purpose:** Story collection (synced from Empathy Ledger)

#### UI Structure
```tsx
<Layout>
  <Hero>
    <Headline>Community Stories</Headline>
    <Body>Real people, real programs, real change</Body>
  </Hero>

  <StoriesGrid>
    {stories.map(story => (
      <StoryCard href={`/stories/${story.slug}`}>
        <Image src={story.featured_image} />
        <Title>{story.title}</Title>
        <Excerpt>{story.excerpt}</Excerpt>
        <Storyteller>{story.storyteller_name}</Storyteller>
        <ReadMore>Read Story</ReadMore>
      </StoryCard>
    ))}
  </StoriesGrid>

  <CTASection>
    <Headline>Share Your Story</Headline>
    <Body>
      Stories from Empathy Ledger are automatically syndicated here
      with storyteller permission
    </Body>
    <CTA href="https://empathyledger.com">
      GO TO EMPATHY LEDGER
    </CTA>
  </CTASection>
</Layout>
```

---

### 5.2 Individual Story `/stories/[slug]`
**Route:** `src/app/stories/[slug]/page.tsx`
**Status:** ✅ Exists
**Purpose:** Full story display (syndicated content)

#### UI Structure
```tsx
<Layout>
  <Header>
    <FeaturedImage src={story.featured_image} />
    <Title>{story.title}</Title>
    <Storyteller>
      <Avatar src={story.storyteller_avatar} />
      <Name>{story.storyteller_name}</Name>
    </Storyteller>
  </Header>

  <Content>
    <Body>{story.content}</Body>

    {story.media_assets && (
      <MediaGallery media={story.media_assets} />
    )}
  </Content>

  <RelatedPrograms>
    <SectionHeadline>Programs Featured</SectionHeadline>
    <ProgramsGrid>
      {story.related_programs.map(program => (
        <ProgramCard {...program} />
      ))}
    </ProgramsGrid>
  </RelatedPrograms>

  <Attribution>
    <Icon><Database /></Icon>
    <Text>
      This story shared with permission from Empathy Ledger.
      Revenue from this story flows to the storyteller.
    </Text>
    <Link href={`https://empathyledger.com/stories/${story.id}`}>
      View on Empathy Ledger
    </Link>
  </Attribution>
</Layout>
```

---

### 5.3 The Pattern (Scrollytelling) `/stories/the-pattern`
**Route:** `src/app/stories/the-pattern/page.tsx`
**Status:** ✅ Exists
**Purpose:** Data journalism piece on systemic patterns

#### UI Structure (Scrollytelling)
```tsx
<ScrollytellingLayout dark>
  <Chapter>
    <Sticky>
      <Visualization type="incarceration-rates" />
    </Sticky>
    <Narrative>
      <Slide>
        <Headline>The Pattern Is Clear</Headline>
        <Body>
          Indigenous youth are locked up at 24x the rate of
          non-Indigenous youth
        </Body>
      </Slide>

      <Slide>
        <Headline>It's Not About Crime</Headline>
        <Body>Similar offenses, vastly different outcomes</Body>
        <DataVisualization type="offense-comparison" />
      </Slide>

      <Slide>
        <Headline>The System Is Designed This Way</Headline>
        <Body>From first contact to detention, bias compounds</Body>
      </Slide>
    </Narrative>
  </Chapter>

  <Chapter>
    <Sticky>
      <Visualization type="community-alternative" />
    </Sticky>
    <Narrative>
      <Slide>
        <Headline>Communities Have The Cure</Headline>
        <Body>78% success rate vs 15.5% for detention</Body>
      </Slide>

      <Slide>
        <Headline>So Why Don't We Fund Them?</Headline>
        <Body>$1.8B to detention, $300M to community programs</Body>
      </Slide>
    </Narrative>
  </Chapter>

  <CTASection>
    <CTA href="/intelligence">EXPLORE THE DATA</CTA>
    <CTA href="/community-programs">FIND PROGRAMS</CTA>
  </CTASection>
</ScrollytellingLayout>
```

---

### 5.4 Blog Hub `/blog`
**Route:** `src/app/blog/page.tsx`
**Status:** ✅ Exists
**Purpose:** Updates, insights, policy commentary

#### UI Structure
```tsx
<Layout>
  <Hero>
    <Headline>Updates & Insights</Headline>
    <Body>Policy analysis, program updates, community wins</Body>
  </Hero>

  <FilterBar>
    <Filter by="category" />
    <Filter by="author" />
  </FilterBar>

  <BlogGrid>
    {posts.map(post => (
      <BlogCard href={`/blog/${post.slug}`}>
        <FeaturedImage src={post.featured_image} />
        <Category>{post.category}</Category>
        <Title>{post.title}</Title>
        <Excerpt>{post.excerpt}</Excerpt>
        <Meta>
          <Author>{post.author}</Author>
          <Date>{post.published_date}</Date>
        </Meta>
      </BlogCard>
    ))}
  </BlogGrid>
</Layout>
```

---

## 👥 SECTION 6: DIRECTORY PAGES

### 6.1 Organizations Directory `/organizations`
**Route:** `src/app/organizations/page.tsx`
**Status:** ✅ Exists
**Purpose:** Partner organizations directory

#### UI Structure
```tsx
<Layout>
  <Hero>
    <Headline>Partner Organizations</Headline>
    <Body>Community-led organizations doing the work</Body>
  </Hero>

  <FilterBar>
    <Filter by="type" />
    <Filter by="location" />
    <Filter by="services" />
  </FilterBar>

  <OrganizationsGrid>
    {organizations.map(org => (
      <OrgCard href={`/organizations/${org.slug}`}>
        <Logo src={org.logo} />
        <Name>{org.name}</Name>
        <Type>{org.type}</Type>
        <Location>{org.location}</Location>
        <Stats>
          <Stat>{org.programs_count} Programs</Stat>
          <Stat>{org.services_count} Services</Stat>
        </Stats>
      </OrgCard>
    ))}
  </OrganizationsGrid>
</Layout>
```

---

### 6.2 Individual Organization `/organizations/[slug]`
**Route:** `src/app/organizations/[slug]/page.tsx`
**Status:** ✅ Exists
**Purpose:** Organization detail page

#### UI Structure
```tsx
<Layout>
  <Header>
    <Logo src={org.logo} large />
    <Title>{org.name}</Title>
    <Type>{org.type}</Type>
    <Location>{org.location}</Location>
  </Header>

  <AboutSection>
    <SectionHeadline>About</SectionHeadline>
    <Body>{org.description}</Body>
  </AboutSection>

  <ProgramsSection>
    <SectionHeadline>Programs</SectionHeadline>
    <ProgramsGrid>
      {org.programs.map(program => (
        <ProgramCard {...program} />
      ))}
    </ProgramsGrid>
  </ProgramsSection>

  <ServicesSection>
    <SectionHeadline>Services</SectionHeadline>
    <ServicesGrid>
      {org.services.map(service => (
        <ServiceCard {...service} />
      ))}
    </ServicesGrid>
  </ServicesSection>

  <ContactSection>
    <SectionHeadline>Contact</SectionHeadline>
    <ContactInfo>
      <Email>{org.email}</Email>
      <Phone>{org.phone}</Phone>
      <Website href={org.website}>Visit Website</Website>
    </ContactInfo>
  </ContactSection>
</Layout>
```

---

### 6.3 People Directory `/people`
**Route:** `src/app/people/page.tsx`
**Status:** ✅ Exists
**Purpose:** Community leaders, advocates, professionals

#### UI Structure
```tsx
<Layout>
  <Hero>
    <Headline>Community Leaders</Headline>
    <Body>People making change happen</Body>
  </Hero>

  <FilterBar>
    <Filter by="role" />
    <Filter by="organization" />
    <Filter by="location" />
  </FilterBar>

  <PeopleGrid>
    {people.map(person => (
      <PersonCard href={`/people/${person.slug}`}>
        <Avatar src={person.photo} />
        <Name>{person.name}</Name>
        <Role>{person.role}</Role>
        <Organization>{person.organization}</Organization>
      </PersonCard>
    ))}
  </PeopleGrid>
</Layout>
```

---

## 🛠️ SECTION 7: UTILITY & SPECIAL PAGES

### 7.1 Centre of Excellence `/centre-of-excellence`
**Route:** `src/app/centre-of-excellence/page.tsx`
**Status:** ✅ Exists
**Purpose:** Research hub, best practices, global insights

#### Subsections
- `/centre-of-excellence/best-practice` - Best practice guidelines
- `/centre-of-excellence/research` - Research library
- `/centre-of-excellence/global-insights` - International comparisons
- `/centre-of-excellence/map` - Interactive map of programs

---

### 7.2 Community Map `/community-map`
**Route:** `src/app/community-map/page.tsx`
**Status:** ✅ Exists
**Purpose:** Interactive map of programs, services, organizations

#### UI Structure
```tsx
<FullScreenMap>
  <MapControls>
    <LayerToggle options={['Programs', 'Services', 'Organizations']} />
    <FilterPanel>
      <Filter by="type" />
      <Filter by="cultural-safety" />
    </FilterPanel>
  </MapControls>

  <InteractiveMap>
    {locations.map(location => (
      <Marker {...location}>
        <Popup>
          <Name>{location.name}</Name>
          <Type>{location.type}</Type>
          <Quick href={location.url}>View Details</Quick>
        </Popup>
      </Marker>
    ))}
  </InteractiveMap>
</FullScreenMap>
```

---

### 7.3 Contact `/contact`
**Route:** `src/app/contact/page.tsx`
**Status:** ✅ Exists
**Purpose:** Contact form, support

---

### 7.4 Auth Pages
- `/login` - User login
- `/signup` - User registration (with steward option)

---

### 7.5 Legal Pages
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/transparency` - Transparency report

---

## 🔧 SECTION 8: EXPERIMENTAL/DEVELOPMENT PAGES

These are works-in-progress or experimental features:

- `/visuals/*` - Data visualization experiments
- `/flywheel` - System flow diagram
- `/grassroots` - Grassroots movement page (TBD)
- `/talent-scout` - Talent pipeline (TBD)
- `/youth-scout` - Youth scouting system (TBD)
- `/test-*` - Development testing pages

---

## 📋 SECTION 9: NAVIGATION STRUCTURE

### Primary Navigation (Always Visible)
```tsx
<Nav fixed className="border-b-2 border-black bg-white">
  <Logo href="/">JusticeHub</Logo>

  <NavLinks>
    <NavLink href="/services" urgent>
      FIND HELP NOW
    </NavLink>

    <NavLink href="/community-programs">
      Programs
    </NavLink>

    <NavLink href="/intelligence">
      Data & Evidence
    </NavLink>

    <NavLink href="/stewards">
      Become a Steward
    </NavLink>

    <NavLink href="/about">
      About
    </NavLink>
  </NavLinks>

  <NavActions>
    <Search />
    <Login href="/login" />
  </NavActions>
</Nav>
```

### Mobile Navigation
```tsx
<MobileNav>
  <HamburgerMenu>
    <MenuOverlay>
      {/* Same links as desktop, vertical stack */}
      <EmergencyCTA href="/services">
        FIND HELP NOW
      </EmergencyCTA>
    </MenuOverlay>
  </HamburgerMenu>
</MobileNav>
```

### Footer Navigation
```tsx
<Footer className="border-t-2 border-black bg-white pt-20 pb-10">
  <FooterGrid>
    <Column>
      <Heading>Get Help</Heading>
      <FooterLink href="/services">Crisis Services</FooterLink>
      <FooterLink href="/community-programs">Find Programs</FooterLink>
      <FooterLink href="/community-map">Community Map</FooterLink>
    </Column>

    <Column>
      <Heading>Evidence</Heading>
      <FooterLink href="/intelligence">ALMA Intelligence</FooterLink>
      <FooterLink href="/centre-of-excellence">Centre of Excellence</FooterLink>
      <FooterLink href="/stories">Community Stories</FooterLink>
    </Column>

    <Column>
      <Heading>Get Involved</Heading>
      <FooterLink href="/stewards">Become a Steward</FooterLink>
      <FooterLink href="/community-programs/add">Add Your Program</FooterLink>
      <FooterLink href="/contact">Contact Us</FooterLink>
    </Column>

    <Column>
      <Heading>About</Heading>
      <FooterLink href="/about">Our Mission</FooterLink>
      <FooterLink href="/how-it-works">How It Works</FooterLink>
      <FooterLink href="/transparency">Transparency</FooterLink>
      <FooterLink href="/blog">Updates</FooterLink>
    </Column>
  </FooterGrid>

  <FooterBottom>
    <Legal>
      <Link href="/privacy">Privacy</Link>
      <Link href="/terms">Terms</Link>
    </Legal>

    <Attribution>
      <Text>Powered by ACT Ecosystem</Text>
      <Link href="https://empathyledger.com">Empathy Ledger</Link>
      <Link href="https://act.farm">ACT Farm</Link>
    </Attribution>
  </FooterBottom>
</Footer>
```

---

## 🎨 SECTION 10: USER JOURNEYS

### Journey 1: Crisis User
```
ENTRY: Google "youth crisis support [location]"
  ↓
LAND: Homepage → See "FIND HELP NOW"
  ↓
ACTION: Click CTA
  ↓
ARRIVE: /services
  ↓
FILTER: By location + crisis type
  ↓
OUTCOME: Call service OR book appointment
```

### Journey 2: Program Leader
```
ENTRY: Word of mouth OR social media
  ↓
LAND: Homepage → See program stats
  ↓
EXPLORE: /community-programs → See 78% success rate
  ↓
DECIDE: "I want to add my program"
  ↓
ACTION: /community-programs/add
  ↓
OUTCOME: Program listed + protected by stewards
```

### Journey 3: Policy Maker
```
ENTRY: Media coverage OR report
  ↓
LAND: Homepage → See "$1.1M vs $10k" stat
  ↓
EXPLORE: /intelligence → Deep dive on data
  ↓
ANALYZE: /intelligence/interventions → Scrollytelling
  ↓
OUTCOME: Policy shift OR funding decision
```

### Journey 4: Potential Steward
```
ENTRY: Social media OR friend referral
  ↓
LAND: Homepage → See "PROTECT WHAT WORKS"
  ↓
EXPLORE: /stewards → Learn about stewardship
  ↓
CONVINCE: /stewards/impact → See collective impact
  ↓
ACTION: /signup?type=steward
  ↓
OUTCOME: Active steward protecting programs
```

### Journey 5: Story Seeker
```
ENTRY: Organic search OR social share
  ↓
LAND: /stories/[specific-story]
  ↓
ENGAGE: Read story, see media
  ↓
DISCOVER: Related programs linked
  ↓
OUTCOME: Support program OR share story
```

---

## 📐 SECTION 11: RESPONSIVE DESIGN BREAKPOINTS

```css
/* Mobile First Approach */
:root {
  /* Base (Mobile): < 640px */
  --container-padding: 1rem;
  --section-padding-y: 3rem;
  --headline-size: 2rem;

  /* Tablet: 640px - 1024px */
  @media (min-width: 640px) {
    --container-padding: 2rem;
    --section-padding-y: 4rem;
    --headline-size: 3rem;
  }

  /* Desktop: 1024px+ */
  @media (min-width: 1024px) {
    --container-padding: 3rem;
    --section-padding-y: 5rem;
    --headline-size: 4rem;
  }

  /* Large Desktop: 1440px+ */
  @media (min-width: 1440px) {
    --section-padding-y: 6rem;
    --headline-size: 5rem;
  }
}
```

### Mobile-Specific UX
```tsx
// Stack cards vertically
<Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Make CTAs full-width
<CTA className="w-full md:w-auto">

// Collapse navigation to hamburger
<Nav className="hidden md:flex" />
<MobileNav className="md:hidden" />

// Reduce stat sizes
<Stat className="text-4xl md:text-6xl lg:text-8xl">
```

---

## 🔐 SECTION 12: AUTHENTICATION & PERMISSIONS

### Public (No Auth Required)
- Homepage
- Services
- Community Programs (view)
- Intelligence/Data pages
- Stories
- About/Contact
- Stewards landing

### Authenticated (Login Required)
- Admin dashboard
- Program management
- Service management
- Story management
- Media library
- Empathy Ledger sync

### Steward (Special Role)
- Steward dashboard (TBD)
- Program protection actions (TBD)
- Knowledge stewardship (TBD)

### Admin (Highest Level)
- All CRUD operations
- User management (TBD)
- System configuration
- API keys management

---

## 📊 SECTION 13: PERFORMANCE REQUIREMENTS

### Core Web Vitals Targets
```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

### Loading Strategy
```tsx
// Critical pages (homepage, services)
<link rel="preload" href={criticalCSS} />
<link rel="preload" href={heroImage} />

// Lazy load non-critical images
<Image loading="lazy" src={thumbnail} />

// Code split routes
const IntelligencePage = lazy(() => import('./intelligence'))
```

### Caching Strategy
```tsx
// Static assets: 1 year
Cache-Control: public, max-age=31536000, immutable

// API data: 5 minutes
Cache-Control: public, max-age=300, stale-while-revalidate=60

// Dynamic pages: No cache (always fresh)
Cache-Control: no-cache
```

---

## 🎯 SECTION 14: SEO STRATEGY

### Meta Tags Per Page Type
```tsx
// Homepage
<meta name="title" content="JusticeHub | Communities Work. Here's Proof." />
<meta name="description" content="24x Indigenous kids locked up. 78% succeed with community programs. Find help, see the evidence, protect what works." />

// Services
<meta name="title" content="Crisis Support | JusticeHub" />
<meta name="description" content="24/7 crisis support for youth and families. Free, confidential, community-led services." />

// Intelligence
<meta name="title" content="ALMA Intelligence | Data That Proves Communities Work" />
<meta name="description" content="Evidence-based data on youth justice interventions. 78% community success vs 15.5% detention." />

// Programs
<meta name="title" content="Community Programs | 242 Programs That Work" />
<meta name="description" content="Evidence-based community programs with 78% success rate. Find programs, see the data." />
```

### Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "JusticeHub",
  "description": "Revolutionary infrastructure for youth justice reform",
  "url": "https://justicehub.org.au",
  "sameAs": [
    "https://twitter.com/justicehub",
    "https://facebook.com/justicehub"
  ],
  "knowsAbout": [
    "Youth Justice",
    "Justice Reinvestment",
    "Community Programs",
    "Indigenous Justice"
  ]
}
```

---

## ✅ SECTION 15: IMPLEMENTATION CHECKLIST

### Phase 1: Core Pages (Priority)
- [ ] Homepage (optimize rotating stats)
- [ ] Services directory (real-time availability)
- [ ] Community programs (CRUD + filters)
- [ ] Intelligence hub (data viz)
- [ ] Stewards landing page

### Phase 2: Admin Tools
- [ ] Admin dashboard
- [ ] Program management
- [ ] Service management
- [ ] Empathy Ledger sync (DONE via syndication API)
- [ ] Media library

### Phase 3: Enhanced Features
- [ ] Community map (interactive)
- [ ] Story syndication (DONE)
- [ ] Auto-linking system
- [ ] Steward dashboard
- [ ] Analytics tracking

### Phase 4: Content & Marketing
- [ ] Blog system
- [ ] Centre of Excellence content
- [ ] Case studies
- [ ] Impact reports

---

## 📝 CONCLUSION

This site map defines **every page, every UI component, every user flow** for JusticeHub, aligned with:

✅ **Brand Voice:** Blunt, data-driven, uncompromising
✅ **Design System:** SimCity brutalist with three style modes (white, dark, green)
✅ **Accessibility:** WCAG AAA, keyboard nav, screen reader optimized
✅ **User Journeys:** Crisis users → immediate help, Policy makers → evidence, Community → stewardship
✅ **ACT Ecosystem:** Integrated with Empathy Ledger, ALMA intelligence, ACT Farm

**Next Steps:**
1. Review this map
2. Prioritize routes for development
3. Build component library following brand alignment skill
4. Implement page by page with accessibility testing

---

**Created:** January 4, 2026
**Author:** Claude Code AI Assistant
**References:**
- JusticeHub Brand Alignment Skill
- Empathy Ledger Syndication System
- ACT Ecosystem Architecture
