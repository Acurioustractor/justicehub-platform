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
    { name: 'The Buttery', org: 'The Buttery', role: 'Northern Rivers partner', quote: 'Therapeutic-community lineage. Lived-experience pathways. Northern Rivers stop partner for February 2027.', source: 'partner', score: 95 },
    { name: 'Emma Maiden', org: 'Uniting', role: 'Director Advocacy', quote: '"Hoping some NSW MPs come and look. And think. And act." Sydney stop partner.', source: 'ally', score: 92 },
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
  { id: 'adelaide', city: 'Adelaide', state: 'South Australia', stateCode: 'SA', lat: -34.93, lng: 138.60, status: 'planning', date: 'Jun–Jul 2026 · 2 months', partner: 'Justice Reform Initiative + Tandanya', venue: 'Tandanya · Reintegration Puzzle Conference', cost: '$130K', description: 'The tour opens at Tandanya alongside the Reintegration Puzzle Conference. Diagrama\'s CEO is attending. Two months: conference week, then a month of public open weeks, school groups, and a politicians day.', storyArc: '"The national conversation opens on Kaurna Yarta. Diagrama walks through. So do the delegates."' },
  { id: 'perth', city: 'Perth + surrounds', state: 'Western Australia', stateCode: 'WA', lat: -31.95, lng: 115.86, status: 'planning', date: 'Aug–Sep 2026 · 2 months', partner: 'UWA + Reconciliation WA + Department of Justice WA', venue: 'University of Western Australia + regional drop-in', cost: '$220K', description: 'Two months in Perth with a regional drop-in to Broome or Kalgoorlie. The container becomes the public priming layer for the Department of Justice WA delegated-authority pilot communities.', storyArc: '"Public sentiment lands before the legislation does. Communities tell their own version of the story first."' },
  { id: 'mparntwe', city: 'Mparntwe + Tennant Creek', state: 'Northern Territory', stateCode: 'NT', lat: -23.70, lng: 133.88, status: 'confirmed', date: 'Oct–Nov 2026 · 6 weeks', partner: 'Oonchiumpa Aboriginal Corporation', venue: 'Oonchiumpa + community spaces', cost: '$170K', description: 'Six weeks community-controlled across Mparntwe and Tennant Creek. Oonchiumpa runs a 95% diversion rate through Central Arrernte-designed programs. The container, the build, and the public weeks all happen on community terms.', storyArc: '"Community authority. Community control. The 95% model speaks for itself."' },
  { id: 'brisbane', city: 'Brisbane', state: 'Queensland', stateCode: 'QLD', lat: -27.47, lng: 153.03, status: 'planning', date: 'Dec 2026 · 1 month', partner: 'YAC + EPIC Pathways', venue: 'YAC · Youth Advocacy Centre', cost: '$140K', description: 'YAC is hosting. Queensland has the strongest demand signal nationally, including a sitting state MP asking publicly where the container is touring.', storyArc: '"Queensland has the demand. YAC has the room. The MPs walk through."' },
  { id: 'northern-rivers', city: 'Northern Rivers', state: 'New South Wales', stateCode: 'NSW', lat: -28.81, lng: 153.27, status: 'exploring', date: 'Feb 2027 · 1 month', partner: 'The Buttery', venue: 'The Buttery', cost: '$105K', description: 'A month in the Northern Rivers in partnership with The Buttery. Therapeutic-community lineage, lived-experience pathways, and a regional public the metro circuit does not reach.', storyArc: '"Therapeutic-community lineage meets the container. Lived experience leads the room."' },
  { id: 'sydney', city: 'Sydney', state: 'New South Wales', stateCode: 'NSW', lat: -33.87, lng: 151.21, status: 'exploring', date: 'Mar 2027 · 1 month', partner: 'Uniting + USyd', venue: 'Uniting + University of Sydney', cost: '$115K', description: 'A month in Sydney carried by Uniting\'s advocacy team and the University of Sydney. NSW MPs invited on dedicated days. Public access through the city centre.', storyArc: '"Hoping some NSW MPs come and look. And think. And act."' },
  { id: 'canberra', city: 'Canberra', state: 'Australian Capital Territory', stateCode: 'ACT', lat: -35.31, lng: 149.13, status: 'exploring', date: 'Apr 2027 · 3 weeks', partner: 'ACT Inspector of Custodial Services + civic partners', venue: 'Lawns of Parliament House', cost: '$100K', description: 'Three weeks on the lawns of Parliament House. ACT government has committed publicly to a new model of care for youth detention. Federal MPs invited, territory-level audience, and the press gallery on its doorstep.', storyArc: '"The Inspector walked through. Then she wrote a report. Then the federal MPs walked through."' },
  { id: 'melbourne', city: 'Melbourne', state: 'Victoria', stateCode: 'VIC', lat: -37.81, lng: 144.96, status: 'exploring', date: 'May 2027 · 1 month', partner: 'St Martins YAC + RMIT', venue: 'St Martins Youth Arts Centre', cost: '$130K', description: 'A month in Melbourne carried by St Martins Youth Arts Centre. Public access, a youth arts collaboration on Room 3, and an academic spine through RMIT.', storyArc: '"Young people making art about the system that failed them, in the middle of the Melbourne arts season."' },
  { id: 'hobart', city: 'Hobart', state: 'Tasmania', stateCode: 'TAS', lat: -42.88, lng: 147.33, status: 'exploring', date: 'Jun 2027 · 1 month', partner: 'DarkLab + Prevention Not Detention Tasmania', venue: 'DarkLab / MONA + coalition spaces', cost: '$120K', description: 'The tour closes in Hobart with DarkLab and the Prevention Not Detention coalition. Cultural institution, organised activist coalition, and a Department of Children and Young People contact in one room.', storyArc: '"A coalition, a museum, and a government decision-maker walk into a container."' },
];

export async function GET() {
  const sb = createServiceClient();
  const stops: TourStopIntel[] = [];

  // Pre-fetch: all verified interventions with org IDs (once, reused per state).
  // PostgREST has a server-enforced 1000-row cap; .range(0, N) doesn't override.
  // Paginate manually so we get the full datasets.
  async function fetchAll<T>(builder: () => any, pageSize = 1000): Promise<T[]> {
    const out: T[] = [];
    let from = 0;
    // Hard ceiling to avoid runaway loops.
    while (from < 200000) {
      const { data, error } = await builder().range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      out.push(...(data as T[]));
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return out;
  }

  const [allInterventions, allOrgsWithState] = await Promise.all([
    fetchAll<{ operating_organization_id: string | null }>(
      () => sb.from('alma_interventions')
        .select('operating_organization_id')
        .neq('verification_status', 'ai_generated')
        .not('operating_organization_id', 'is', null),
    ),
    fetchAll<{ id: string; state: string }>(
      () => sb.from('organizations')
        .select('id, state')
        .not('state', 'is', null),
    ),
  ]);

  // Build org→state lookup and state→orgIds map
  const orgStateMap = new Map<string, string>();
  const stateOrgIds = new Map<string, Set<string>>();
  for (const o of allOrgsWithState) {
    orgStateMap.set(o.id, o.state);
    if (!stateOrgIds.has(o.state)) stateOrgIds.set(o.state, new Set());
    stateOrgIds.get(o.state)!.add(o.id);
  }

  // Build per-state intervention counts per org
  const stateOrgInterventions = new Map<string, Map<string, number>>();
  for (const row of allInterventions) {
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

    // Get orgs with intervention counts for this state (using pre-fetched data).
    // Pull ALL orgs in this state — dedup happens BEFORE the top-N slice.
    const interventionsByOrg = stateOrgInterventions.get(config.stateCode) || new Map<string, number>();
    const allStateOrgIds = Array.from(interventionsByOrg.keys());

    let programOrgs: Array<{
      id: string; name: string; is_indigenous_org: boolean;
      website: string | null; acnc_data: Record<string, unknown> | null;
      gs_entity_id: string | null;
    }> = [];
    if (allStateOrgIds.length > 0) {
      // Paginate to avoid the 1000-row PostgREST cap on large states.
      const allFetched: typeof programOrgs = [];
      for (let i = 0; i < allStateOrgIds.length; i += 800) {
        const batch = allStateOrgIds.slice(i, i + 800);
        const { data } = await sb.from('organizations')
          .select('id, name, is_indigenous_org, website, acnc_data, gs_entity_id')
          .in('id', batch);
        allFetched.push(...((data || []) as typeof programOrgs));
      }
      programOrgs = allFetched;
    }

    // Dedupe at gs_entity_id level — when multiple org rows point to the same
    // canonical entity (PCYC has 14, YAC has 4), collapse them and sum program counts.
    const groupedByEntity = new Map<string, {
      rep_id: string;
      rep_name: string;
      gs_entity_id: string | null;
      indigenous: boolean;
      website: string | null;
      acnc_data: Record<string, unknown> | null;
      count: number;
      org_row_count: number;
    }>();
    for (const o of programOrgs) {
      const key = o.gs_entity_id || o.id;
      const orgCount = interventionsByOrg.get(o.id) || 0;
      const existing = groupedByEntity.get(key);
      if (existing) {
        existing.count += orgCount;
        existing.org_row_count++;
        if (orgCount > (interventionsByOrg.get(existing.rep_id) || 0)) {
          existing.rep_id = o.id;
          existing.rep_name = o.name;
        }
        existing.indigenous = existing.indigenous || (o.is_indigenous_org || false);
        existing.website = existing.website || o.website;
        existing.acnc_data = existing.acnc_data || o.acnc_data;
      } else {
        groupedByEntity.set(key, {
          rep_id: o.id,
          rep_name: o.name,
          gs_entity_id: o.gs_entity_id,
          indigenous: o.is_indigenous_org || false,
          website: o.website,
          acnc_data: o.acnc_data,
          count: orgCount,
          org_row_count: 1,
        });
      }
    }

    // Fetch canonical names from gs_entities for any group with a gs_entity_id.
    const entityIds = Array.from(groupedByEntity.values()).map((g) => g.gs_entity_id).filter(Boolean) as string[];
    if (entityIds.length > 0) {
      const { data: entityRows } = await sb.from('gs_entities')
        .select('id, canonical_name')
        .in('id', entityIds);
      const canonicalById = new Map<string, string>((entityRows ?? []).map((e: any) => [e.id, e.canonical_name]));
      for (const g of groupedByEntity.values()) {
        if (g.gs_entity_id && canonicalById.has(g.gs_entity_id)) {
          g.rep_name = canonicalById.get(g.gs_entity_id)!;
        }
      }
    }

    // Build ranked list: indigenous first, then by intervention count
    const rankedOrgs = Array.from(groupedByEntity.values())
      .map(g => ({
        rep_id: g.rep_id,
        name: g.rep_name,
        indigenous: g.indigenous,
        website: g.website,
        acnc_data: g.acnc_data,
        count: g.count,
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
        .select('id, name, is_indigenous_org, website, acnc_data')
        .eq('state', config.stateCode)
        .not('website', 'is', null)
        .not('acnc_data', 'is', null)
        .limit(20);
      backfillOrgs = ((notableOrgs || []) as Array<{
        id: string; name: string; is_indigenous_org: boolean;
        website: string | null; acnc_data: Record<string, unknown> | null;
      }>)
        .filter(o => !existingNames.has(o.name))
        .map(o => ({
          rep_id: o.id,
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
          id: o.rep_id,
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

  // Summary stats — single Postgres RPC computes all 6 aggregates server-side.
  // Each value is one SQL query away from being defended in a board meeting.
  // RPC defined in supabase/migrations/20260505000001_contained_intel_summary_rpc.sql
  const { data: summaryRows } = await sb.rpc('get_contained_intel_summary');
  const s = (summaryRows && summaryRows[0]) || {};

  return NextResponse.json({
    stops,
    summary: {
      tourStops: s.tour_stops ?? 9,
      programsCatalogued: s.programs_catalogued ?? 0,
      strongEvidenceCount: s.strong_evidence_count ?? 0,
      orgsIndexed: s.orgs_indexed ?? 0,
      indigenousLedOrgs: s.indigenous_led_orgs ?? 0,
      fundingTrackedBillions: (Number(s.funding_tracked_dollars) || 0) / 1_000_000_000,
      totalStopCost: '$1,650,000',
      raised: '$0',
    },
    generatedAt: new Date().toISOString(),
  });
}
