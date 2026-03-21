import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface TourStopIntel {
  id: string;
  city: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
  status: 'confirmed' | 'planning' | 'exploring' | 'demand';
  date: string;
  partner: string;
  venue: string;
  cost: string;
  description: string;
  storyArc: string;
  stats: {
    detentionSpend: string;
    communitySpend: string;
    indigenousOverrep: string;
    detentionPopulation: string;
    orgs: number;
    indigenousOrgs: number;
    interventions: number;
    fundingRecords: number;
    acncCharities: number;
    oricCorporations: number;
  };
  demandSignals: Array<{
    name: string;
    score: number;
    org: string;
    role: string;
    quote: string;
    source: 'linkedin' | 'container_request' | 'email' | 'conference' | 'partner' | 'ally';
    action?: string;
  }>;
  keyOrgs: Array<{
    name: string;
    type: string;
    indigenous: boolean;
    interventions: number;
    website?: string;
    sector?: string;
    servesYouth?: boolean;
    servesIndigenous?: boolean;
    charitySize?: string;
  }>;
  politicians: Array<{
    name: string;
    role: string;
    party: string;
    level: 'state' | 'federal' | 'oversight';
    portfolio?: string;
    relevance: string;
  }>;
  funders: Array<{
    name: string;
    score: number;
    type: string;
  }>;
}

const STATE_STATS: Record<string, { detentionSpend: string; communitySpend: string; indigenousOverrep: string; detentionPopulation: string }> = {
  NSW: { detentionSpend: '$364M', communitySpend: '$89M', indigenousOverrep: '17.5x', detentionPopulation: '282' },
  VIC: { detentionSpend: '$298M', communitySpend: '$76M', indigenousOverrep: '14.2x', detentionPopulation: '178' },
  QLD: { detentionSpend: '$412M', communitySpend: '$95M', indigenousOverrep: '28.4x', detentionPopulation: '335' },
  WA: { detentionSpend: '$178M', communitySpend: '$42M', indigenousOverrep: '42.1x', detentionPopulation: '147' },
  SA: { detentionSpend: '$89M', communitySpend: '$28M', indigenousOverrep: '21.3x', detentionPopulation: '68' },
  TAS: { detentionSpend: '$32M', communitySpend: '$11M', indigenousOverrep: '12.8x', detentionPopulation: '18' },
  ACT: { detentionSpend: '$28M', communitySpend: '$9M', indigenousOverrep: '16.7x', detentionPopulation: '14' },
  NT: { detentionSpend: '$67M', communitySpend: '$15M', indigenousOverrep: '96.2x', detentionPopulation: '46' },
};

type Politician = TourStopIntel['politicians'][number];

// Key opportunities and allies per stop — real connections, emails, asks
const STATE_OPPORTUNITIES: Record<string, Array<{
  name: string; org: string; role: string; quote: string;
  source: 'container_request' | 'email' | 'conference' | 'partner' | 'ally';
  score: number;
}>> = {
  NSW: [
    { name: 'Mounty Yarns Team', org: 'Mounty Yarns', role: 'Community Partner', quote: 'Working closely on Mounty launch — photos and reflections from the team ready to share.', source: 'partner', score: 95 },
    { name: 'Teya Dusseldorp', org: 'Dusseldorp Forum', role: 'Director', quote: 'Meeting scheduled Fri 20 Mar. "Let\'s make a time to talk."', source: 'ally', score: 95 },
    { name: 'Nicole Mekler', org: 'Just Reinvest', role: 'Youth Advocacy & Implementation Lead, Mt Druitt', quote: '"Copy us in and we will attend if we can."', source: 'partner', score: 93 },
    { name: 'Daniel Daylight', org: 'Just Reinvest', role: 'Program Lead', quote: 'Key connection between Just Reinvest and Mount Druitt community.', source: 'partner', score: 90 },
    { name: 'Jessica Duffy', org: 'Dusseldorp Forum', role: 'Program Manager', quote: '"Would be great to hear more" — joining Fri 20 Mar call.', source: 'ally', score: 88 },
    { name: 'Margot Beach', org: 'Dusseldorp Forum', role: 'Team', quote: 'Accepted meeting invite for Fri 20 Mar CONTAINED discussion.', source: 'ally', score: 85 },
    { name: 'Ariane Dozer', org: 'The Justice Project / UTS', role: 'Partnership Lead', quote: '"Love this — looking forward to circling back to your ideas."', source: 'ally', score: 82 },
    { name: 'George Newhouse AM', org: 'The Justice Project / UTS', role: 'CEO & Director', quote: 'Active partnership discussion. Justice Matrix collaboration.', source: 'ally', score: 80 },
    { name: 'Adam', org: 'StreetSmart Australia', role: 'Supporter', quote: '"I\'ll keep pushing this through my networks when-ever I can." Keen to support the tour.', source: 'ally', score: 78 },
    { name: 'Emily', org: 'Raise the Age NSW', role: 'Campaign Coordinator', quote: 'Coalition sign-on for youth justice submission. Aligned campaign.', source: 'ally', score: 75 },
    { name: 'Peter Rowe', org: 'First Nations News', role: 'Editor', quote: '"We saw your post on LinkedIn and wondered if you would like to write an oped." Op-ed invitation for firstnationsnews.com.au.', source: 'email', score: 75 },
    { name: 'Selena Bartlett', org: 'Podcast Host', role: 'Neuroscientist & Podcaster', quote: 'Podcast interview scheduled. Questions prepared around youth justice advocacy.', source: 'email', score: 72 },
    { name: 'Penny Lamaro', org: 'Armidale Community', role: 'Regional NSW', quote: 'Expressed interest in bringing the container to regional NSW.', source: 'email', score: 65 },
  ],
  QLD: [
    { name: 'Shannon Cant', org: 'Youth Advocacy Centre (YAC)', role: 'Communications', quote: '"Can we set up a time to chat about your CONTAINED project and the possibility of us hosting it? We want to get involved!"', source: 'partner', score: 96 },
    { name: 'Lenine Bourke', org: 'Queensland Advocacy for Inclusion (QAI)', role: 'Campaign Lead — Youth Justice & Disability', quote: '"I run two campaigns, one of Youth Justice (especially focused on raising the age)." Met through Junction Park.', source: 'ally', score: 88 },
    { name: 'Jonty Bush MP', org: 'QLD Parliament', role: 'Member for Cooper', quote: '"Looking forward to seeing the Sydney details. Hoping some NSW MPs come and look. And think. And act."', source: 'ally', score: 85 },
  ],
  SA: [
    { name: 'Reintegration Puzzle Conference', org: 'Tandanya National Aboriginal Cultural Institute', role: 'Conference Partner', quote: 'National conference Jun 24-25 at Tandanya — delegates walk through between sessions. Complimentary pass confirmed.', source: 'conference', score: 98 },
    { name: 'Louise Clarke', org: 'Justice Reform Initiative', role: 'Conference Logistics', quote: '"It would be fabulous to have it in Adelaide at the time of the conference!"', source: 'ally', score: 92 },
    { name: 'Emma Cother', org: 'Justice Reform Initiative', role: 'Program Coordinator', quote: '"Lovely to hear from you — I\'ve cc\'d in Louise who is looking after conference logistics."', source: 'ally', score: 88 },
    { name: 'Hannah March', org: 'Justice Reform Initiative', role: 'Campaign Adviser', quote: '"Give me a call any time." Phone: 0424 991 675. Key contact for JRI coordination.', source: 'email', score: 85 },
  ],
  ACT: [
    { name: 'Inspector of Custodial Services', org: 'ACT Government', role: 'Inspector', quote: 'The Inspector endorses the CONTAINED approach. Parliament House lawns suggested as venue.', source: 'ally', score: 88 },
    { name: 'Sally Grimsley-Ballard', org: 'Snow Foundation', role: 'Program Manager', quote: 'Meeting set up re Goods Project / Snow Foundation support. Canberra-based funder.', source: 'email', score: 82 },
    { name: 'Genelee Mazarello', org: 'Third Sector', role: 'National Justice Forum Organiser', quote: '"Looking for speakers and case studies. Let\'s reconnect week of 23rd March."', source: 'conference', score: 80 },
  ],
  WA: [
    { name: 'Lucy Stronach', org: 'Minderoo Foundation', role: 'Justice Strategy Lead', quote: '"Close to finalising our justice strategy — proposal goes to Board in June." Active relationship since Jan 2026.', source: 'ally', score: 95 },
    { name: 'Megan McCormack', org: 'Reconciliation WA', role: 'CEO', quote: 'Reconciliation WA CEO endorses. "You are invited."', source: 'ally', score: 92 },
    { name: 'Michelle Wieberneit', org: 'UWA Law School', role: 'Associate Lecturer', quote: '"Hayley and I would be keen to discuss the possibility to bring the container to UWA or Perth." Video call Feb 24.', source: 'partner', score: 90 },
    { name: 'Hayley Passmore', org: 'UWA Law School', role: 'Researcher', quote: '"Exhibit on the grounds of the University of Western Australia." Submitted via ACT website form.', source: 'partner', score: 88 },
    { name: 'Toby Gowland', org: 'Kalianah Outdoors', role: 'Founder', quote: 'Interested in WA partnership — youth outdoor programs.', source: 'email', score: 70 },
  ],
  TAS: [
    { name: 'Lewina Schrale', org: 'Tasmania Government', role: 'Government Decision-Maker', quote: 'Highest-value uncontacted lead — government official supportive of reform.', source: 'email', score: 95 },
    { name: 'Loic Fery', org: 'Prevention Not Detention TAS', role: 'Coalition Member', quote: 'Part of the coalition that said enough. Active in Ashley YDC closure campaign.', source: 'ally', score: 85 },
    { name: 'DarkLab / MONA Connection', org: 'MONA / DarkLab', role: 'Venue Prospect', quote: 'MONA/DarkLab connection for a powerful cultural venue.', source: 'ally', score: 80 },
  ],
  VIC: [
    { name: 'St Martins Youth Arts Centre', org: 'St Martins Youth Arts Centre', role: 'Venue Partner', quote: 'Youth arts venue offered for the container. Melbourne Design Week connection.', source: 'partner', score: 90 },
    { name: 'Irene Portelli', org: 'We Made It', role: 'Creative Partner', quote: 'Creative partnership interest from We Made It collective.', source: 'email', score: 70 },
  ],
  NT: [
    { name: 'Kristy Bloomfield', org: 'Oonchiumpa Consultancy', role: 'Director', quote: 'REAL Innovation Fund application submitted for Goods Project in Alice Springs. Active partner.', source: 'partner', score: 92 },
    { name: 'Tanya Turner', org: 'Oonchiumpa Consultancy', role: 'Program Lead', quote: 'Submitted REAL Innovation Fund EOI from Mbantua (Alice Springs). Consortium partner.', source: 'partner', score: 90 },
    { name: 'Baz Dreisinger', org: 'John Jay College / CUNY', role: 'Author, Incarceration Nations', quote: '"We could merge Writing on the Wall with Contained — the most full-blown prison art exhibition in the world."', source: 'ally', score: 88 },
  ],
};

const STATE_POLITICIANS: Record<string, Politician[]> = {
  NSW: [
    // State Government
    { name: 'Jihad Dib', role: 'Minister for Youth Justice', party: 'Labor', level: 'state', portfolio: 'Youth Justice', relevance: 'Direct portfolio holder. Former school principal, launched Safe Aboriginal Youth programs and doli incapax reforms.' },
    { name: 'Michael Daley', role: 'Attorney General', party: 'Labor', level: 'state', portfolio: 'Justice', relevance: 'Chief law officer overseeing justice system reform.' },
    { name: 'Kate Washington', role: 'Minister for Families and Communities', party: 'Labor', level: 'state', portfolio: 'Families', relevance: 'Oversees child protection — upstream from youth justice.' },
    { name: 'David Harris', role: 'Minister for Aboriginal Affairs and Treaty', party: 'Labor', level: 'state', portfolio: 'Aboriginal Affairs', relevance: 'Allocated $246.8M for Closing the Gap. Key for Indigenous overrepresentation.' },
    { name: 'Rose Jackson', role: 'Minister for Youth', party: 'Labor', level: 'state', portfolio: 'Youth', relevance: 'Re-established Office for Youth July 2025.' },
    // Opposition
    { name: 'Aileen MacDonald OAM', role: 'Shadow Minister for Youth Justice', party: 'Liberal', level: 'state', portfolio: 'Youth Justice (Shadow)', relevance: 'Chairs Select Committee on Youth Justice (est. Nov 2025, reports Dec 2026). Former Corrective Services officer.' },
    { name: 'Damien Tudehope', role: 'Shadow Attorney General', party: 'Liberal', level: 'state', portfolio: 'Justice (Shadow)', relevance: 'Opposition lead on justice reform.' },
    // Oversight
    { name: 'Fiona Rafter', role: 'Inspector of Custodial Services', party: 'Independent', level: 'oversight', relevance: 'Conducted youth justice centre inspections in 2025. Departing April 2026.' },
    { name: 'Katherine McKernan', role: 'Advocate for Children and Young People', party: 'Independent', level: 'oversight', relevance: 'Appointed Jan 2026, five-year term. Leads Office for Youth.' },
    // Local MPs (Mount Druitt)
    { name: 'Edmond Atalla', role: 'Member for Mount Druitt', party: 'Labor', level: 'state', relevance: 'Local state MP since 2015, Parliamentary Secretary for Police.' },
    // Federal (Western Sydney)
    { name: 'Ed Husic', role: 'Member for Chifley (covers Mount Druitt)', party: 'Labor', level: 'federal', relevance: 'Federal MP since 2010, covers Mount Druitt area.' },
  ],
  QLD: [
    // State Government
    { name: 'Laura Gerber', role: 'Minister for Youth Justice and Victim Support', party: 'LNP', level: 'state', portfolio: 'Youth Justice', relevance: 'Primary minister for youth detention policy. Key policies: "Adult Crime, Adult Time", ankle monitors for children 10+.' },
    { name: 'Deb Frecklington', role: 'Attorney-General', party: 'LNP', level: 'state', portfolio: 'Justice', relevance: 'Courts, Legal Aid, justice administration.' },
    { name: 'Fiona Simpson', role: 'Minister for Aboriginal and Torres Strait Islander Partnerships', party: 'LNP', level: 'state', portfolio: 'First Nations', relevance: '$167.6M budget for Aboriginal and Torres Strait Islander partnerships.' },
    { name: 'Dan Purdie', role: 'Minister for Police and Community Safety', party: 'LNP', level: 'state', portfolio: 'Police', relevance: 'Works closely with Gerber on youth crime announcements.' },
    // Opposition
    { name: 'Cathy King', role: 'Shadow Minister for Youth Justice', party: 'Labor', level: 'state', portfolio: 'Youth Justice (Shadow)', relevance: 'Labor opposition lead on youth justice.' },
    { name: 'Meaghan Scanlon', role: 'Shadow Attorney-General', party: 'Labor', level: 'state', portfolio: 'Justice (Shadow)', relevance: 'Shadow AG and Shadow Minister for Justice.' },
    // Key figures
    { name: 'Michael Berkman', role: 'Member for Maiwar (Greens)', party: 'Greens', level: 'state', relevance: 'Only QLD Greens MP. Introduced bill to raise age of criminal responsibility to 14.' },
    { name: 'Jonty Bush', role: 'Member for Cooper', party: 'Labor', level: 'state', relevance: 'LinkedIn engagement score 85. Strong advocate for youth justice reform.' },
    // Oversight
    { name: 'Anthony Reilly', role: 'Inspector of Detention Services', party: 'Independent', level: 'oversight', relevance: 'Published combined youth detention inspection report Nov 2025, 34 recommendations on overcrowding.' },
    { name: 'Natalie Lewis', role: 'Commissioner, QLD Family and Child Commission', party: 'Independent', level: 'oversight', relevance: 'Gamilaraay woman. 20+ years in youth justice and ATSI affairs.' },
  ],
  SA: [
    { name: 'Kyam Maher', role: 'Attorney-General & Minister for Aboriginal Affairs', party: 'Labor', level: 'state', portfolio: 'Justice + Aboriginal Affairs', relevance: 'Holds both AG and Aboriginal Affairs portfolios — critical dual role.' },
    { name: 'Emily Bourke', role: 'Minister for Correctional Services', party: 'Labor', level: 'state', portfolio: 'Corrections', relevance: 'Oversees youth detention facilities.' },
    { name: 'Nat Cook', role: 'Minister for Human Services', party: 'Labor', level: 'state', portfolio: 'Human Services', relevance: 'Youth services and child protection.' },
    { name: 'Josh Teague', role: 'Shadow AG, Shadow Aboriginal Affairs', party: 'Liberal', level: 'state', portfolio: 'Justice + Aboriginal Affairs (Shadow)', relevance: 'Shadows both justice and Aboriginal affairs portfolios.' },
    { name: 'Dr Kylie Heneker', role: 'Commissioner for Children and Young People', party: 'Independent', level: 'oversight', relevance: 'Appointed Oct 2025.' },
    { name: 'Dale Agius', role: 'Commissioner for Aboriginal Children and Young People', party: 'Independent', level: 'oversight', relevance: 'Appointed Apr 2025. Dedicated Aboriginal children\'s commissioner.' },
    { name: 'Lucy Hood', role: 'Member for Adelaide', party: 'Labor', level: 'state', relevance: 'Local state MP, now a minister.' },
  ],
  ACT: [
    { name: 'Tara Cheyne', role: 'Attorney-General', party: 'Labor', level: 'state', portfolio: 'Justice', relevance: 'ACT Attorney-General.' },
    { name: 'Yvette Berry', role: 'Deputy CM, Minister for Children, Youth and Families', party: 'Labor', level: 'state', portfolio: 'Children/Youth', relevance: 'Deputy Chief Minister with children and families portfolio.' },
    { name: 'Michael Pettersson', role: 'Minister for Aboriginal and Torres Strait Islander Affairs', party: 'Labor', level: 'state', portfolio: 'Aboriginal Affairs', relevance: 'ACT Aboriginal affairs portfolio holder.' },
    { name: 'Jodie Griffiths-Cook', role: 'Children and Young People Commissioner', party: 'Independent', level: 'oversight', relevance: 'ACT children\'s commissioner.' },
    // Federal (based in Canberra)
    { name: 'Michelle Rowland', role: 'Federal Attorney-General', party: 'Labor', level: 'federal', portfolio: 'Justice', relevance: 'Federal AG since May 2025. Key decision-maker on national justice reform.' },
    { name: 'Senator Malarndirri McCarthy', role: 'Minister for Indigenous Australians', party: 'Labor', level: 'federal', portfolio: 'Indigenous Affairs', relevance: 'Federal minister for Indigenous Australians. Critical for overrepresentation policy.' },
  ],
  WA: [
    { name: 'Tony Buti', role: 'Attorney General', party: 'Labor', level: 'state', portfolio: 'Justice', relevance: 'WA Attorney General.' },
    { name: 'Paul Papalia', role: 'Minister for Corrective Services', party: 'Labor', level: 'state', portfolio: 'Corrections', relevance: 'Oversees youth detention including Banksia Hill.' },
    { name: 'Don Punch', role: 'Minister for Aboriginal Affairs', party: 'Labor', level: 'state', portfolio: 'Aboriginal Affairs', relevance: 'Appointed Mar 2025. Key for 42.1x Indigenous overrepresentation.' },
    { name: 'Eamon Ryan', role: 'Inspector of Custodial Services', party: 'Independent', level: 'oversight', relevance: 'Very outspoken on conditions at Banksia Hill and Unit 18.' },
    { name: 'Jacqueline McGowan-Jones', role: 'Commissioner for Children and Young People', party: 'Independent', level: 'oversight', relevance: 'WA children\'s commissioner.' },
    { name: 'John Carey', role: 'Member for Perth', party: 'Labor', level: 'state', relevance: 'Local state MP, now a minister.' },
  ],
  TAS: [
    { name: 'Guy Barnett', role: 'Attorney-General & Minister for Corrections', party: 'Liberal', level: 'state', portfolio: 'Justice + Corrections', relevance: 'Holds both AG and Corrections portfolios. Key figure in Ashley YDC closure (delayed to 2028).' },
    { name: 'Jo Palmer', role: 'Minister for Children and Youth', party: 'Liberal', level: 'state', portfolio: 'Children/Youth', relevance: 'Appointed Aug 2025 reshuffle. New to youth justice portfolio.' },
    { name: 'Jane Howlett', role: 'Minister for Aboriginal Affairs', party: 'Liberal', level: 'state', portfolio: 'Aboriginal Affairs', relevance: 'Aboriginal affairs portfolio holder.' },
    { name: 'Ella Haddad', role: 'Shadow Attorney-General', party: 'Labor', level: 'state', portfolio: 'Justice (Shadow)', relevance: 'Opposition lead on justice, likely critical of Ashley YDC delays.' },
    { name: 'Isabelle Crompton', role: 'Interim Commissioner for Children and Young People', party: 'Independent', level: 'oversight', relevance: 'Interim appointment. Ashley YDC closure politically toxic.' },
  ],
  VIC: [
    { name: 'Jaclyn Symes', role: 'Attorney-General', party: 'Labor', level: 'state', portfolio: 'Justice', relevance: 'VIC Attorney General.' },
    { name: 'Enver Erdogan', role: 'Minister for Youth Justice', party: 'Labor', level: 'state', portfolio: 'Youth Justice', relevance: 'Dedicated youth justice minister — rare in Australian politics.' },
    { name: 'Natalie Hutchins', role: 'Minister for Treaty and First Peoples', party: 'Labor', level: 'state', portfolio: 'First Peoples', relevance: 'Treaty and First Peoples portfolio.' },
    { name: 'Tracy Beaton', role: 'Principal Commissioner for Children and Young People', party: 'Independent', level: 'oversight', relevance: 'Appointed Dec 2025. New to role.' },
    { name: 'Ellen Sandell', role: 'Member for Melbourne (Greens Leader)', party: 'Greens', level: 'state', relevance: 'Greens leader in VIC. Inner Melbourne electorate near tour stop.' },
  ],
  NT: [
    { name: 'Marie-Clare Boothby', role: 'Attorney-General', party: 'CLP', level: 'state', portfolio: 'Justice', relevance: 'NT Attorney General under CLP government.' },
    { name: 'Gerard Maley', role: 'Deputy CM, Minister for Correctional Services', party: 'CLP', level: 'state', portfolio: 'Corrections', relevance: 'Deputy Chief Minister overseeing corrections including Don Dale.' },
    { name: 'Steve Edgington', role: 'Minister for Aboriginal Affairs & Member for Barkly', party: 'CLP', level: 'state', portfolio: 'Aboriginal Affairs', relevance: 'Holds Aboriginal Affairs AND is the Member for Barkly (Tennant Creek electorate). Single most relevant local political figure.' },
    { name: 'Shahleena Musk', role: 'Children\'s Commissioner', party: 'Independent', level: 'oversight', relevance: 'Larrakia woman. Outspoken critic of CLP\'s rollback of Don Dale Royal Commission recommendations.' },
  ],
};

const TOUR_STOPS_CONFIG: Array<{
  id: string; city: string; state: string; stateCode: string;
  lat: number; lng: number; status: TourStopIntel['status'];
  date: string; partner: string; venue: string; cost: string;
  description: string; storyArc: string;
}> = [
  { id: 'mount-druitt', city: 'Mount Druitt', state: 'New South Wales', stateCode: 'NSW', lat: -33.74, lng: 150.82, status: 'planning', date: 'April 2026', partner: 'Mounty Yarns', venue: 'Mounty Yarns', cost: '$30,000', description: 'Western Sydney launch — young people designing Room 1 for the first time.', storyArc: '"It starts here. Young people design Room 1."' },
  { id: 'brisbane', city: 'Brisbane', state: 'Queensland', stateCode: 'QLD', lat: -27.47, lng: 153.03, status: 'demand', date: 'May 2026', partner: 'Youth Advocacy Centre (YAC)', venue: 'YAC Brisbane', cost: '$30,000', description: 'Queensland has the most community alternatives in Australia. YAC wants to host.', storyArc: '"Queensland has 261 alternatives. YAC is one. They want the container."' },
  { id: 'adelaide', city: 'Adelaide', state: 'South Australia', stateCode: 'SA', lat: -34.93, lng: 138.60, status: 'confirmed', date: 'June 24-25 2026', partner: 'Reintegration Puzzle Conference @ Tandanya', venue: 'Tandanya National Aboriginal Cultural Institute', cost: '$30,000', description: 'National conference — delegates walk through between sessions. The Mayor supports it.', storyArc: '"The national conversation changes. On Kaurna Yarta."' },
  { id: 'canberra', city: 'Canberra', state: 'Australian Capital Territory', stateCode: 'ACT', lat: -35.28, lng: 149.13, status: 'demand', date: 'July 2026', partner: 'TBD — Inspector of Custodial Services endorses', venue: 'TBD (Parliament House lawns suggested)', cost: '$30,000', description: 'The people who inspect the system say it\'s broken. ACT committed to new model.', storyArc: '"The Inspector walked through. Then she wrote a report."' },
  { id: 'perth', city: 'Perth', state: 'Western Australia', stateCode: 'WA', lat: -31.95, lng: 115.86, status: 'exploring', date: 'August 2026', partner: 'UWA + Reconciliation WA', venue: 'University of Western Australia', cost: '$30,000', description: 'Academic research meets advocacy. Reconciliation WA CEO endorses.', storyArc: '"The evidence goes academic. Reconciliation WA says: invited."' },
  { id: 'tasmania', city: 'Hobart', state: 'Tasmania', stateCode: 'TAS', lat: -42.88, lng: 147.33, status: 'demand', date: 'September 2026', partner: 'Prevention Not Detention TAS + DarkLab/MONA', venue: 'TBD (DarkLab/MONA connection)', cost: '$30,000', description: 'The coalition that said enough. MONA connection. Government decision-maker on board.', storyArc: '"A coalition, a museum, and a government official walk into a container."' },
  { id: 'melbourne', city: 'Melbourne', state: 'Victoria', stateCode: 'VIC', lat: -37.81, lng: 144.96, status: 'demand', date: 'October 2026', partner: 'St Martins Youth Arts Centre', venue: 'St Martins Youth Arts Centre', cost: '$30,000', description: 'Youth arts venue offered. Melbourne Design Week connection. 8 demand signals.', storyArc: '"Young people making art about the system that failed them."' },
  { id: 'tennant-creek', city: 'Tennant Creek', state: 'Northern Territory', stateCode: 'NT', lat: -19.65, lng: 134.19, status: 'exploring', date: 'November 2026', partner: 'Community-controlled', venue: 'Community Space', cost: '$30,000', description: 'Community authority. Community control. 96.2x Indigenous overrepresentation.', storyArc: '"Community authority. Community control. Their story, their way."' },
];

export async function GET() {
  const sb = createServiceClient();
  const stops: TourStopIntel[] = [];

  // Pre-fetch: all verified interventions with org IDs (once, reused per state)
  const [
    { data: allInterventions },
    { data: allOrgsWithState },
  ] = await Promise.all([
    sb.from('alma_interventions')
      .select('operating_organization_id')
      .neq('verification_status', 'ai_generated')
      .not('operating_organization_id', 'is', null),
    sb.from('organizations')
      .select('id, state')
      .not('state', 'is', null)
      .limit(25000),
  ]);

  // Build org→state lookup and state→orgIds map
  const orgStateMap = new Map<string, string>();
  const stateOrgIds = new Map<string, Set<string>>();
  for (const o of (allOrgsWithState || [])) {
    orgStateMap.set(o.id, o.state);
    if (!stateOrgIds.has(o.state)) stateOrgIds.set(o.state, new Set());
    stateOrgIds.get(o.state)!.add(o.id);
  }

  // Build per-state intervention counts per org
  const stateOrgInterventions = new Map<string, Map<string, number>>();
  for (const row of (allInterventions || [])) {
    const orgId = row.operating_organization_id;
    const state = orgId ? orgStateMap.get(orgId) : null;
    if (!state) continue;
    if (!stateOrgInterventions.has(state)) stateOrgInterventions.set(state, new Map());
    const m = stateOrgInterventions.get(state)!;
    m.set(orgId, (m.get(orgId) || 0) + 1);
  }

  for (const config of TOUR_STOPS_CONFIG) {
    const stateStats = STATE_STATS[config.stateCode];

    // Parallel queries for this state
    const [
      { count: orgCount },
      { count: indigenousOrgCount },
      { count: fundingCount },
      { count: acncCount },
      { count: oricCount },
    ] = await Promise.all([
      sb.from('organizations').select('*', { count: 'exact', head: true }).eq('state', config.stateCode),
      sb.from('organizations').select('*', { count: 'exact', head: true }).eq('state', config.stateCode).eq('is_indigenous_org', true),
      sb.from('justice_funding').select('*', { count: 'exact', head: true }).eq('state', config.stateCode),
      sb.from('acnc_charities').select('*', { count: 'exact', head: true }).eq('state', config.stateCode),
      sb.from('oric_corporations').select('*', { count: 'exact', head: true }).eq('state', config.stateCode),
    ]);

    // Get orgs with intervention counts for this state (using pre-fetched data)
    const interventionsByOrg = stateOrgInterventions.get(config.stateCode) || new Map<string, number>();
    const orgIdsWithPrograms = Array.from(interventionsByOrg.keys()).slice(0, 30);

    let programOrgs: Array<{
      id: string; name: string; is_indigenous_org: boolean;
      website: string | null; acnc_data: Record<string, unknown> | null;
    }> = [];
    if (orgIdsWithPrograms.length > 0) {
      const { data } = await sb.from('organizations')
        .select('id, name, is_indigenous_org, website, acnc_data')
        .in('id', orgIdsWithPrograms);
      programOrgs = (data || []) as typeof programOrgs;
    }

    // Build ranked list: indigenous first, then by intervention count
    const rankedOrgs = programOrgs
      .map(o => ({
        name: o.name,
        indigenous: o.is_indigenous_org || false,
        website: o.website,
        acnc_data: o.acnc_data,
        count: interventionsByOrg.get(o.id) || 0,
      }))
      .sort((a, b) => {
        if (a.indigenous !== b.indigenous) return a.indigenous ? -1 : 1;
        return b.count - a.count;
      });

    // Backfill with notable orgs if we have fewer than 12 with programs
    let backfillOrgs: typeof rankedOrgs = [];
    if (rankedOrgs.length < 12) {
      const existingNames = new Set(rankedOrgs.map(o => o.name));
      const { data: notableOrgs } = await sb.from('organizations')
        .select('name, is_indigenous_org, website, acnc_data')
        .eq('state', config.stateCode)
        .not('website', 'is', null)
        .not('acnc_data', 'is', null)
        .limit(20);
      backfillOrgs = ((notableOrgs || []) as Array<{
        name: string; is_indigenous_org: boolean;
        website: string | null; acnc_data: Record<string, unknown> | null;
      }>)
        .filter(o => !existingNames.has(o.name))
        .map(o => ({
          name: o.name,
          indigenous: o.is_indigenous_org || false,
          website: o.website,
          acnc_data: o.acnc_data,
          count: 0,
        }));
    }

    const topOrgs = [...rankedOrgs, ...backfillOrgs].slice(0, 15);

    // Get demand signals (LinkedIn commenters mentioning this state/city)
    const stateTerms = [config.city.toLowerCase(), config.stateCode.toLowerCase(), config.state.toLowerCase()];
    const { data: linkedinEntities } = await sb.from('campaign_alignment_entities')
      .select('name, composite_score, organization, position, warm_paths, alignment_category, recommended_approach')
      .eq('entity_type', 'person')
      .gt('composite_score', 55)
      .order('composite_score', { ascending: false })
      .limit(500);

    const demandSignals: TourStopIntel['demandSignals'] = [];
    for (const entity of (linkedinEntities || [])) {
      const wp = entity.warm_paths;
      if (!wp || !Array.isArray(wp)) continue;
      for (const path of wp) {
        const comment = (path.comment_snippet || '').toLowerCase();
        if (stateTerms.some(term => comment.includes(term))) {
          demandSignals.push({
            name: entity.name,
            score: entity.composite_score,
            org: entity.organization || '',
            role: entity.position || '',
            quote: path.comment_snippet || '',
            source: 'linkedin',
            action: entity.recommended_approach || undefined,
          });
          break;
        }
      }
    }

    // Merge in real opportunities/allies for this state
    const stateOpps = STATE_OPPORTUNITIES[config.stateCode] || [];
    // Look up recommended_approach for hardcoded people (handle name variants like "Jonty Bush MP" vs "Jonty Bush")
    const oppActions: Record<string, string> = {};
    if (stateOpps.length > 0) {
      const oppNames = stateOpps.map(o => o.name);
      // Also try without common suffixes (MP, AM, AO, OAM, etc.)
      const baseNames = oppNames.map(n => n.replace(/\s+(MP|AM|AO|OAM|AC|QC|SC)$/i, ''));
      const allNames = [...new Set([...oppNames, ...baseNames])];
      const { data: oppEntities } = await sb.from('campaign_alignment_entities')
        .select('name, recommended_approach')
        .in('name', allNames)
        .not('recommended_approach', 'is', null);
      for (const e of (oppEntities || [])) {
        if (e.recommended_approach) oppActions[e.name] = e.recommended_approach;
      }
    }
    for (const opp of stateOpps) {
      const baseName = opp.name.replace(/\s+(MP|AM|AO|OAM|AC|QC|SC)$/i, '');
      demandSignals.push({
        name: opp.name,
        score: opp.score,
        org: opp.org,
        role: opp.role,
        quote: opp.quote,
        source: opp.source as TourStopIntel['demandSignals'][number]['source'],
        action: oppActions[opp.name] || oppActions[baseName] || undefined,
      });
    }

    // Sort all demand signals by score (highest first), partners/allies before linkedin
    demandSignals.sort((a, b) => {
      // Partners/allies/conferences first, then container requests, then linkedin/email
      const priority: Record<string, number> = { partner: 0, conference: 0, ally: 1, container_request: 2, email: 3, linkedin: 4 };
      const pa = priority[a.source] ?? 5;
      const pb = priority[b.source] ?? 5;
      if (pa !== pb) return pa - pb;
      return b.score - a.score;
    });

    // Get top funders for this state (from campaign alignment)
    const { data: funders } = await sb.from('campaign_alignment_entities')
      .select('name, composite_score, organization')
      .eq('campaign_list', 'funders_to_pitch')
      .gt('composite_score', 70)
      .order('composite_score', { ascending: false })
      .limit(10);

    // Count interventions for this state from pre-fetched data
    let stateInterventionCount = 0;
    for (const count of interventionsByOrg.values()) {
      stateInterventionCount += count;
    }

    stops.push({
      id: config.id,
      city: config.city,
      state: config.state,
      stateCode: config.stateCode,
      lat: config.lat,
      lng: config.lng,
      status: config.status,
      date: config.date,
      partner: config.partner,
      venue: config.venue,
      cost: config.cost,
      description: config.description,
      storyArc: config.storyArc,
      stats: {
        ...stateStats,
        orgs: orgCount || 0,
        indigenousOrgs: indigenousOrgCount || 0,
        interventions: stateInterventionCount,
        fundingRecords: fundingCount || 0,
        acncCharities: acncCount || 0,
        oricCorporations: oricCount || 0,
      },
      demandSignals: demandSignals.slice(0, 12),
      keyOrgs: topOrgs.map(o => {
        const acnc = o.acnc_data as Record<string, unknown> | null;
        const servesYouth = !!(acnc?.ben_youth || acnc?.ben_children);
        const servesIndigenous = !!(acnc?.ben_aboriginal_tsi);
        const charitySize = (acnc?.charity_size as string) || undefined;
        // Derive sector from ACNC activities or org type
        let sector = o.indigenous ? 'Indigenous' : 'Community';
        if (acnc?.activities) {
          const acts = String(acnc.activities).toLowerCase();
          if (acts.includes('legal')) sector = 'Legal';
          else if (acts.includes('health') || acts.includes('mental')) sector = 'Health';
          else if (acts.includes('housing') || acts.includes('homelessness')) sector = 'Housing';
          else if (acts.includes('education') || acts.includes('training')) sector = 'Education';
          else if (acts.includes('arts') || acts.includes('culture')) sector = 'Arts & Culture';
          else if (acts.includes('family') || acts.includes('child')) sector = 'Family Services';
        }
        return {
          name: o.name,
          type: o.indigenous ? 'Indigenous' : 'Community',
          indigenous: o.indigenous,
          interventions: o.count,
          website: o.website || undefined,
          sector,
          servesYouth,
          servesIndigenous,
          charitySize,
        };
      }),
      politicians: STATE_POLITICIANS[config.stateCode] || [],
      funders: (funders || []).slice(0, 5).map(f => ({
        name: f.name,
        score: f.composite_score,
        type: 'Foundation',
      })),
    });
  }

  // Summary stats
  const { count: totalOrgs } = await sb.from('organizations').select('*', { count: 'exact', head: true });
  const { count: totalFunding } = await sb.from('justice_funding').select('*', { count: 'exact', head: true });
  const { count: totalEntities } = await sb.from('campaign_alignment_entities').select('*', { count: 'exact', head: true });

  return NextResponse.json({
    stops,
    summary: {
      totalOrgs: totalOrgs || 0,
      totalFunding: totalFunding || 0,
      totalEntities: totalEntities || 0,
      totalInterventions: 883,
      totalEvidence: 570,
      totalStories: 50,
      totalPhotos: 261,
      totalStopCost: '$380,000',
      raised: '$0',
    },
    generatedAt: new Date().toISOString(),
  });
}
