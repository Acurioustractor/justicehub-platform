'use client';

import { useState } from 'react';

const PASSCODE = 'contained2026';

// ── Map coordinates (approximate SVG positions for Australia outline) ──
// x/y are percentage positions on a 400x360 viewBox
const MAP_POINTS: { city: string; x: number; y: number; people: number; status: 'confirmed' | 'demand' }[] = [
  { city: 'Mount Druitt', x: 340, y: 195, people: 15, status: 'confirmed' },
  { city: 'Brisbane', x: 335, y: 155, people: 9, status: 'confirmed' },
  { city: 'Adelaide', x: 255, y: 215, people: 5, status: 'confirmed' },
  { city: 'Townsville', x: 310, y: 105, people: 4, status: 'confirmed' },
  { city: 'Perth', x: 100, y: 200, people: 8, status: 'confirmed' },
  { city: 'Tennant Creek', x: 230, y: 115, people: 2, status: 'confirmed' },
  { city: 'Melbourne', x: 290, y: 235, people: 9, status: 'demand' },
  { city: 'Canberra', x: 315, y: 215, people: 3, status: 'demand' },
  { city: 'Tasmania', x: 290, y: 275, people: 2, status: 'demand' },
  { city: 'Armidale', x: 340, y: 170, people: 1, status: 'demand' },
  { city: 'Rockhampton', x: 325, y: 130, people: 1, status: 'demand' },
  { city: 'Cairns', x: 300, y: 80, people: 1, status: 'demand' },
  { city: 'Doomadgee', x: 265, y: 95, people: 2, status: 'demand' },
  { city: 'Broome', x: 155, y: 100, people: 1, status: 'demand' },
];

// ── Location data with orgs, politicians, quotes, community interest ──
interface LocationInfo {
  city: string;
  state: string;
  status: 'confirmed' | 'demand';
  date: string | null;
  partner: string | null;
  people: number;
  headline: string;
  quotes: { name: string; org: string | null; text: string }[];
  orgs: { name: string; detail: string }[];
  politicians: { name: string; role: string; angle: string }[];
  drivers: { name: string; org: string; role: string }[]; // people actively driving this stop
  community: { name: string; org: string | null; what: string }[]; // LinkedIn/community interest
}

const LOCATIONS: LocationInfo[] = [
  {
    city: 'Mount Druitt', state: 'NSW', status: 'confirmed', date: 'Week of Apr 21', partner: 'Mounty Yarns',
    people: 15, headline: 'Youth-led storytelling in Room 3',
    quotes: [
      { name: 'Christine Thomas', org: 'Calmer Kids', text: 'Heart overflowing.' },
      { name: 'Nicole Mekler', org: 'JustReinvest Mt Druitt', text: 'Will attend.' },
    ],
    orgs: [
      { name: 'Mounty Yarns', detail: '7 programs. Dual-funded. Documentary in production.' },
      { name: 'Just Reinvest NSW', detail: '11 programs. Bourke/Maranguka justice reinvestment model.' },
      { name: 'Ted Noffs Foundation', detail: '14 programs across NSW. Largest in state.' },
      { name: 'BackTrack', detail: '87% success rate. Bernie Shakeshaft.' },
      { name: 'Uniting', detail: 'Major org. Venue partnership potential via Emma Maiden.' },
    ],
    politicians: [
      { name: 'Jim Betts', role: 'Former senior NSW government', angle: 'Policy & procurement experience. Warm intro via Tom Donaghy.' },
      { name: 'Emma Maiden', role: 'Uniting — Director of Advocacy', angle: '"Hoping NSW MPs come." Has relationships with state MPs.' },
    ],
    drivers: [
      { name: 'Scarlett Steven', org: 'Dusseldorp Forum', role: 'Coordinating tour logistics for Mt Druitt stop' },
      { name: 'Daniel Daylight', org: 'Mounty Yarns', role: 'Original requester via Dusseldorp referral. Local anchor.' },
      { name: 'Nicole Mekler', org: 'JustReinvest Mt Druitt', role: 'Youth Advocacy lead. Confirmed attending.' },
      { name: 'Bernie Shakeshaft', org: 'BackTrack', role: 'Legend. Will amplify and repost.' },
    ],
    community: [
      { name: 'Natalie Chiappazzo', org: 'WSU', what: 'Dean wants CONTAINED as experiential learning infrastructure' },
      { name: 'Jonas Kubitscheck', org: 'Paul Ramsay Foundation', what: 'Visited Container Oct 2025. Re-engaging.' },
      { name: 'William Frazer', org: 'Paul Ramsay Foundation', what: 'Visited Container Oct 2025 with Jonas.' },
      { name: 'Rohan Lulham', org: 'University of Sydney', what: '"Let us know if you\'d like to do research around the concept"' },
      { name: 'Emma Maiden', org: 'Uniting — Dir of Advocacy', what: '"Hoping NSW MPs come." Venue partnership potential.' },
      { name: 'Joy Woods', org: null, what: '"What are the details for Sydney?"' },
      { name: 'Kyrstie Dunn', org: null, what: 'Wants Sydney. Gave leads to other contacts.' },
      { name: 'Alexandra Cordukes', org: 'Orange Sky', what: 'Has ACT contacts' },
      { name: 'Margot Beach', org: 'Dusseldorp Forum', what: 'Accepted meeting 20 Mar' },
    ],
  },
  {
    city: 'Adelaide', state: 'SA', status: 'confirmed', date: 'Jun 15 + Jul 23-25', partner: 'JRI + ALP Conference',
    people: 5, headline: 'Dual activation: community conference + ALP National Conference',
    quotes: [
      { name: 'Hannah March', org: 'JRI', text: 'The 2026 Reintegration Puzzle Conference is in Tandanya, Adelaide. It would be amazing to host the Container there.' },
    ],
    orgs: [
      { name: 'Grandparents for Grandchildren SA', detail: '5 programs. Kinship care angle. Most programs in SA.' },
      { name: 'Nunkuwarrin Yunti', detail: 'Key Aboriginal health service in Adelaide.' },
      { name: 'JRI Network Australia', detail: 'Port Adelaide. Mindy Sotiri\'s national network.' },
      { name: 'Junction Australia', detail: 'Youth services.' },
      { name: 'Good Bank Gallery', detail: 'McLaren Vale. Venue offer via LinkedIn.' },
      { name: 'SouthStart', detail: 'Adelaide tech community. Interest via Eloise Hall.' },
    ],
    politicians: [
      { name: 'ALP Conference delegates', role: 'Federal Labor MPs', angle: 'Jul 23-25. Container outside convention centre. Every delegate walks past.' },
      { name: 'Nikki Boyd', role: 'ALP MP Pine Rivers QLD', angle: 'YJ opposition voice. Will be at ALP Conference.' },
    ],
    drivers: [
      { name: 'Hannah March', org: 'JRI', role: 'Adelaide host partner. Proposed ALP Conference dual-activation idea.' },
      { name: 'Tracey Newman', org: 'Services', role: 'Making calls to get Container there. Send info pack.' },
      { name: 'Sophie Bretag', org: 'City of Onkaparinga', role: 'Local government champion.' },
    ],
    community: [
      { name: 'Arianna Petra Watson', org: 'SouthStart', what: 'Adelaide tech community. Shout out from Eloise Hall.' },
      { name: 'Zoe Brooks', org: 'Good Bank Gallery', what: 'McLaren Vale SA. Venue offer via LinkedIn.' },
    ],
  },
  {
    city: 'Perth', state: 'WA', status: 'confirmed', date: 'Jul-Aug', partner: 'UWA + JRI Perth',
    people: 8, headline: 'Unit 18 / Banksia Hill — kids in adult prison',
    quotes: [
      { name: 'Mark McPartland', org: null, text: 'Where in Perth? Forest Chase?' },
      { name: 'Samgiita Hope', org: 'Heart2Heart', text: 'When will you be in Perth?' },
      { name: 'Kylie Kerin', org: 'Consultant', text: 'Thinking about how I can support this in Perth.' },
    ],
    orgs: [
      { name: 'Youth Futures WA', detail: '4 programs. Perth youth services.' },
      { name: 'Wunan Foundation', detail: 'East Kimberley Aboriginal foundation.' },
      { name: 'Olabud Doogethu AC', detail: 'Justice reinvestment site. Halls Creek.' },
    ],
    politicians: [],
    drivers: [
      { name: 'Kimberley Wilde', org: 'JRI Perth', role: 'Key Perth anchor. Actively discussing the stop.' },
      { name: 'Kylie Kerin', org: 'Social & Community Impact', role: 'Arts community hosting angle. Inter-cultural facilitator.' },
      { name: 'Hayley Passmore', org: 'Academic', role: 'Building consortium with Aboriginal-led orgs. Perth contacts.' },
      { name: 'Michelle Wieberneit', org: 'UWA', role: 'Academic anchor. Already chatting about CONTAINED.' },
    ],
    community: [
      { name: 'Mark McPartland', org: null, what: '"Where in Perth? Forest Chase?" Demand signal.' },
      { name: 'Samgiita Hope', org: 'Heart2Heart', what: '"When will you be in Perth?" Demand signal.' },
      { name: 'Lucy Stronach', org: 'Minderoo Foundation', what: 'Engaged. Perth is her hometown.' },
      { name: 'Kylie Kerin', org: 'Consultant', what: 'Arts community hosting. Inter-cultural communicator.' },
    ],
  },
  {
    city: 'Tennant Creek', state: 'NT', status: 'confirmed', date: 'Aug-Sep', partner: 'Oonchiumpa',
    people: 2, headline: '95% diversion rate. On-Country programs.',
    quotes: [],
    orgs: [
      { name: 'Oonchiumpa', detail: '4 programs. 95% diversion. Operation Luna. Central Arrernte-led.' },
      { name: 'Kalano Community Association', detail: 'Katherine. 6 programs.' },
      { name: "Children's Ground", detail: 'Early childhood. Community development.' },
      { name: 'NAAJA', detail: 'Aboriginal legal services. Key voice in the NT.' },
    ],
    politicians: [],
    drivers: [
      { name: 'Kristy Bloomfield', org: 'Oonchiumpa', role: 'Co-founder. Central Arrernte. Story anchor.' },
      { name: 'Tanya Turner', org: 'Oonchiumpa', role: 'Co-founder. UWA law. Came home to build this.' },
    ],
    community: [
      { name: 'Patricia Ann Miller AO', org: null, what: 'On the ground in Tennant Creek.' },
      { name: 'Prof Helen Milroy', org: null, what: 'On the ground. Connected to Oonchiumpa.' },
      { name: 'Max Bloomfield', org: 'Oonchiumpa', what: 'On the ground.' },
    ],
  },
  {
    city: 'Townsville / Palm Island', state: 'QLD', status: 'confirmed', date: 'Sep', partner: 'PICC',
    people: 4, headline: '21 programs, 200 staff, zero philanthropy',
    quotes: [],
    orgs: [
      { name: 'PICC', detail: '21 programs. 200 staff. The strongest proof point in Australia.' },
      { name: 'TAIHS Youth Support', detail: 'Major Townsville Indigenous health organisation.' },
      { name: 'The Lighthouse', detail: 'After-hours youth diversion. Same city.' },
      { name: 'Palm Island Community Justice Group', detail: 'Connected to PICC.' },
    ],
    politicians: [
      { name: 'Robert Tickner', role: 'Former Minister for Aboriginal Affairs', angle: 'JRI Chair. Already in the network. Opens political doors.' },
    ],
    drivers: [
      { name: 'Rachel Atkinson', org: 'PICC CEO', role: 'Must build this relationship. 200 staff. THE proof point.' },
      { name: 'Robert Tickner', org: 'JRI / Former Minister', role: 'JRI Chair. Political credibility. Opens doors.' },
    ],
    community: [
      { name: 'Jonas Kubitscheck', org: 'Paul Ramsay Foundation', what: 'PRF connection. Visited Container. PICC is in PRF geography.' },
      { name: 'Julia Payne', org: 'Paul Ramsay Foundation', what: 'PICC in PRF Thriving Communities geography with zero from PRF.' },
    ],
  },
  {
    city: 'Brisbane', state: 'QLD', status: 'confirmed', date: 'Sep-Oct', partner: 'YAC',
    people: 9, headline: 'QLD community orgs vs $765M in govt announcements',
    quotes: [
      { name: 'Katherine Hayes', org: 'YAC', text: 'We would love to host this at YAC!!!' },
      { name: 'Toby Gowland', org: 'Kalianah Outdoors', text: 'Talk to me boys, what can I do, how can I help?' },
    ],
    orgs: [
      { name: 'YAC', detail: '14 programs. Hosting the stop. Shannon Cant is the anchor.' },
      { name: 'BG Fit', detail: 'Aunty Corrine + Brodie. QLD-wide youth fitness story.' },
      { name: 'MMAD', detail: 'Musicians Making A Difference. Futures Radio runs 24/7 inside detention.' },
      { name: 'ATSICHS Brisbane', detail: 'Biggest Indigenous health organisation in South East QLD.' },
      { name: 'Kummara Ltd', detail: 'West End. Child and family services.' },
      { name: 'EPIC Pathways', detail: 'Brisbane youth pathways organisation.' },
    ],
    politicians: [
      { name: 'David Crisafulli', role: 'Premier of QLD', angle: 'Architect of "Adult Crime Adult Time." CivicScope tracks his statements.' },
      { name: 'Laura Gerber', role: 'Minister for Youth Justice', angle: '$675M announced. Zero to Aboriginal community-controlled organisations.' },
      { name: 'Deb Frecklington', role: 'Attorney-General & Justice Minister', angle: '10+ CivicScope-tracked statements on youth justice.' },
      { name: 'Nikki Boyd', role: 'ALP MP Pine Rivers', angle: 'Opposition voice. Spoke on youth justice in Hansard Mar 2026.' },
      { name: 'Sandy Bolton', role: 'Independent MP Noosa', angle: 'Non-partisan ally. YJ advocate. Dec 2025 Hansard.' },
      { name: 'Megan Argent', role: 'Dept of Youth Justice QLD', angle: 'Government insider. Clinical Practice Leader. Already in our network.' },
    ],
    drivers: [
      { name: 'Shannon Cant', org: 'YAC', role: 'YAC wants to HOST. Venue solved.' },
      { name: 'Katherine Hayes', org: 'YAC', role: 'Original Notion requester. "We would love to host this at YAC!!!"' },
      { name: 'Tim Bennett', org: 'Via Bernie Shakeshaft', role: 'QLD ideas + travel support. Key connector.' },
      { name: 'Megan Argent', org: 'QLD Dept of Youth Justice', role: 'Government insider. Clinical Practice Leader.' },
    ],
    community: [
      { name: 'Prof Selena Bartlett', org: 'Thriving Minds podcast', what: 'Podcast interview offer. Brisbane academic.' },
      { name: 'Jonty Bush', org: 'QLD Government MP', what: 'Yarning with YAC about end of April.' },
      { name: 'MMAD', org: 'Musicians Making A Difference', what: 'Futures Radio runs 24/7 inside detention. Live from Container.' },
      { name: 'Toby Gowland', org: 'Kalianah Outdoors', what: '"Talk to me boys, what can I do, how can I help?"' },
      { name: 'Rhian Miller', org: 'EPIC Pathways', what: 'Brisbane youth pathways org. Website form Oct 2025.' },
    ],
  },
  {
    city: 'Melbourne', state: 'VIC', status: 'demand', date: null, partner: null,
    people: 9, headline: 'Cherry Creek: $7,304/day — most expensive detention in Australia',
    quotes: [
      { name: 'Jess Lilley', org: 'The Open Arms', text: "It's a long shot but would love to host CONTAINED as part of the Footscray West Writers Fest. The theme is Words & Action. CONTAINED would fit perfectly." },
      { name: 'Sonia Randhawa', org: '3CR Radio', text: 'I co-present Wednesday Breakfast on 3CR and would love to interview someone about this.' },
      { name: 'Ashlee Cooper', org: null, text: 'LOVE to see this in Geelong or Melbourne.' },
    ],
    orgs: [
      { name: 'Corner Store Network', detail: 'Melbourne community network. Alice Mahar.' },
      { name: 'Larita Academy', detail: 'Melbourne education. Anita Pahor.' },
      { name: 'The Open Arms', detail: 'Footscray. Writers festival connection.' },
    ],
    politicians: [
      { name: 'Peter Norden AO', role: 'Youth Justice Advocate', angle: 'AO. Major voice. 14 unread messages. Desperate to connect.' },
    ],
    drivers: [
      { name: 'Peter Norden AO', org: 'Youth Justice Advocate', role: '14 unread messages. Desperate to connect. VIC philanthropic network.' },
    ],
    community: [
      { name: 'Dr Katrina Raynor', org: 'Academic', what: '"Melbourne Design Week as venue."' },
      { name: 'Moira Were AM', org: 'Barrister', what: 'Tagged Zoe Brooks re Good Bank Gallery as venue.' },
      { name: 'Ashlee Cooper', org: null, what: '"LOVE to see this in Geelong or Melbourne."' },
      { name: 'Alice Mahar', org: 'Corner Store Network', what: 'Melbourne community network. Contacted Oct 2025.' },
      { name: 'Anita Pahor', org: 'Larita Academy', what: 'Melbourne education. Oct 2025.' },
      { name: 'Jess Lilley', org: 'The Open Arms', what: 'Footscray West Writers Fest — venue offer.' },
      { name: 'Sonia Randhawa', org: '3CR Radio', what: 'Interview offer — Wednesday Breakfast show.' },
    ],
  },
  {
    city: 'Canberra', state: 'ACT', status: 'demand', date: null, partner: null,
    people: 3, headline: 'Federal Parliament. Container outside during sitting week.',
    quotes: [
      { name: 'Rebecca Minty', org: 'ACT Government', text: 'ACT committed to new model of care for youth detention.' },
      { name: 'Anissa Jones', org: null, text: 'Will you go to Canberra? Federal level too.' },
    ],
    orgs: [],
    politicians: [
      { name: 'Rebecca Minty', role: 'ACT Government', angle: 'Government insider saying the system is changing.' },
    ],
    drivers: [],
    community: [
      { name: 'Rebecca Minty', org: 'ACT Government', what: '"ACT committed to new model of care for youth detention." Government insider.' },
      { name: 'PJ Hewitt', org: null, what: '"Josh Hewitt — host in Canberra!" Hosting connection.' },
      { name: 'Anissa Jones', org: null, what: '"Will you go to Canberra? Federal level too."' },
    ],
  },
  {
    city: 'Tasmania', state: 'TAS', status: 'demand', date: null, partner: null,
    people: 2, headline: 'Ashley YDC closure. Prevention Not Detention coalition.',
    quotes: [
      { name: 'Loic Fery', org: 'Prevention Not Detention', text: 'We are a coalition of individuals who work in and interact with the youth space across the island with a committed agenda to advocating and dismantling this system that keeps our young people down.' },
      { name: 'Loic Fery', org: 'Prevention Not Detention', text: 'We do not have funds, we are just passionate community members. But we do want to see change. If there\'s any chance we can have the container on the island we will make sure we get as many politicians, public and workers through it.' },
    ],
    orgs: [],
    politicians: [
      { name: 'Ruth Forrest', role: 'Tasmanian MLC', angle: 'Strong justice reform advocate. Leading on Ashley YDC closure.' },
    ],
    drivers: [
      { name: 'Loic Fery', org: 'Prevention Not Detention TAS', role: 'Coalition leader. Will get politicians, public and workers through it.' },
    ],
    community: [
      { name: 'Lewina Schrale', org: 'DECYP (Govt)', what: 'Dept of Education Children & Young People. Government interest.' },
      { name: 'Ruth Forrest', org: 'Tasmanian MLC', what: 'Strong justice reform advocate. Leading on Ashley YDC closure.' },
    ],
  },
  {
    city: 'Armidale', state: 'NSW', status: 'demand', date: null, partner: null,
    people: 1, headline: "Bernie Shakeshaft's town. BackTrack country.",
    quotes: [
      { name: 'Penny Lamaro', org: 'Ascent Group', text: 'Keen to have you come to Armidale NSW!' },
    ],
    orgs: [
      { name: 'BackTrack', detail: '87% success rate. Bernie Shakeshaft. Armidale-based.' },
      { name: 'Ascent Group', detail: 'Youth services. Penny Lamaro.' },
    ],
    politicians: [],
    drivers: [],
    community: [
      { name: 'Penny Lamaro', org: 'Ascent Group', what: '"Keen to have you come to Armidale NSW!" Website form Nov 2025.' },
    ],
  },
  {
    city: 'Rockhampton', state: 'QLD', status: 'demand', date: null, partner: null,
    people: 1, headline: 'Kalkadoon woman on Darumbal Country.',
    quotes: [
      { name: 'Delilah MacGillivray', org: 'DWords', text: 'I am Kalkadoon. I would like to know more and would also like to help. Showcase on Darumbal Country.' },
    ],
    orgs: [],
    politicians: [],
    drivers: [],
    community: [
      { name: 'Delilah MacGillivray', org: 'DWords', what: 'Kalkadoon woman. "Showcase on Darumbal Country." Website form Oct 2025.' },
    ],
  },
  {
    city: 'Cairns', state: 'QLD', status: 'demand', date: null, partner: null,
    people: 1, headline: 'Jobs pipeline post-prison for women.',
    quotes: [
      { name: 'Irene Portelli', org: 'Lady Tradies', text: "We are doing Lady Tradies in Cairns for women in Yarrabah and Townsville to have a jobs pipeline post-prison. We overlap. We're filming DV stories — one is a perp, his name is Carl. He's amazing, he has a 5-year comeback program." },
    ],
    orgs: [],
    politicians: [],
    drivers: [],
    community: [
      { name: 'Irene Portelli', org: 'Lady Tradies / We Made It', what: 'Jobs pipeline post-prison for women in Yarrabah + Townsville. Multi-city project: Brisbane → TVL → Cairns.' },
    ],
  },
  {
    city: 'Doomadgee / Cape York', state: 'QLD', status: 'demand', date: null, partner: null,
    people: 2, headline: 'They want the container to stay.',
    quotes: [
      { name: 'Shannon Lemanski', org: 'Aqua Ubique', text: 'Keen as part of broader project with Brodie.' },
    ],
    orgs: [],
    politicians: [],
    drivers: [],
    community: [
      { name: 'Shannon Lemanski', org: 'Aqua Ubique', what: 'Doomadgee. "Keen as part of broader project with Brodie." Long-term loan — they want it to stay.' },
      { name: 'Baressa Frazer', org: 'Community member', what: 'Cape York Peninsula. Website form Oct 2025.' },
    ],
  },
  {
    city: 'Broome', state: 'WA', status: 'demand', date: null, partner: null,
    people: 1, headline: 'Remote WA. MIM Foundation.',
    quotes: [],
    orgs: [],
    politicians: [],
    drivers: [],
    community: [
      { name: 'Michael Haji-Ali', org: 'MIM Foundation', what: 'Remote WA. Kimberley region.' },
    ],
  },
];

// ── Story cards ──
const STORIES = {
  oonchiumpa: {
    title: 'Oonchiumpa: What Happens When Community Leads',
    slug: 'oonchiumpa-what-happens-when-community-leads',
    image: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/media/contained/gallery/oonchiumpa-hero.jpg',
    excerpt: 'There is a version of this story told through numbers. It has its place. But numbers are a translation, and something always gets lost...',
  },
  cure: {
    title: 'The Cure Already Exists',
    slug: 'the-cure-already-exists',
    image: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/articles/container-room.jpg',
    excerpt: 'We spend $1.3 million a year per child to lock them in a room with no window. The recidivism rate is 85%. But in communities across Australia, the alternatives are already working.',
  },
  contained: {
    title: 'Building Revolution in Shipping Containers: The Story of CONTAINED',
    slug: 'building-revolution-in-shipping-containers',
    image: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/story-images/stories/featured/pdlvi4yay5k-1762323853830.png',
    excerpt: "CONTAINED is not another awareness campaign with sad statistics on posters. It's an immersive experience built from shipping containers.",
  },
  walking: {
    title: 'Walking Toward Justice: A Personal Journey',
    slug: 'walking-toward-justice-a-personal-journey-267823',
    image: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/story-images/stories/featured/x49v6n2z3j-1762321822459.JPG',
    excerpt: "I didn't set out to build a platform like JusticeHub. I set out to listen.",
  },
};

function StoryCard({ story }: { story: typeof STORIES.oonchiumpa }) {
  return (
    <a href={`/stories/${story.slug}`} style={{ display: 'block', background: '#111', border: '1px solid #222', textDecoration: 'none', overflow: 'hidden' }}>
      <img src={story.image} alt={story.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
      <div style={{ padding: '16px 20px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F5F0E8', marginBottom: 4, lineHeight: 1.3 }}>{story.title}</h4>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#059669', marginBottom: 8 }}>JusticeHub</p>
        <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.5, marginBottom: 0 }}>{story.excerpt}</p>
      </div>
    </a>
  );
}

// ── Passcode gate ──

function PasscodeGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  return (
    <div style={{ background: '#0A0A0A', color: '#F5F0E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#F5F0E8' }}>CONTAINED</h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#666', marginBottom: 32 }}>Community & Demand — March 2026</p>
        <form onSubmit={(e) => { e.preventDefault(); if (input === PASSCODE) { onAuth(); } else { setError(true); } }}>
          <input type="password" value={input} onChange={(e) => { setInput(e.target.value); setError(false); }} placeholder="Enter passcode" autoFocus
            style={{ background: '#1a1a1a', border: error ? '1px solid #DC2626' : '1px solid #333', color: '#F5F0E8', padding: '12px 16px', fontSize: '1rem', width: '100%', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }} />
          {error && <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: 8, fontFamily: "'IBM Plex Mono', monospace" }}>Incorrect passcode</p>}
          <button type="submit" style={{ marginTop: 16, background: '#F5F0E8', color: '#0A0A0A', padding: '12px 32px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', width: '100%' }}>Enter</button>
        </form>
      </div>
    </div>
  );
}

// ── Australia Map SVG ──

function AustraliaMap() {
  return (
    <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto' }}>
      <svg viewBox="0 0 400 320" fill="none" style={{ width: '100%' }}>
        {/* Simplified Australia outline */}
        <path d="M95,180 L85,165 L80,145 L85,125 L95,110 L110,95 L130,85 L155,80 L175,85 L190,80 L210,75 L230,80 L245,75 L260,80 L280,75 L300,80 L315,90 L325,105 L335,120 L340,135 L345,150 L350,165 L355,180 L350,195 L340,210 L325,220 L310,225 L295,235 L280,245 L265,248 L250,245 L240,235 L230,225 L225,215 L215,225 L200,230 L185,225 L175,215 L165,220 L150,225 L135,220 L120,210 L110,200 L100,190 Z"
          fill="none" stroke="#333" strokeWidth="1.5" />
        {/* Tasmania */}
        <path d="M280,265 L295,260 L305,268 L298,278 L285,275 Z" fill="none" stroke="#333" strokeWidth="1.5" />

        {/* Heat circles — size based on people count */}
        {MAP_POINTS.map((p, i) => {
          const r = Math.max(6, Math.sqrt(p.people) * 5);
          return (
            <g key={i}>
              {/* Glow */}
              <circle cx={p.x} cy={p.y} r={r + 8} fill={p.status === 'confirmed' ? '#05966920' : '#DC262620'} />
              <circle cx={p.x} cy={p.y} r={r + 4} fill={p.status === 'confirmed' ? '#05966930' : '#DC262630'} />
              {/* Core */}
              <circle cx={p.x} cy={p.y} r={r} fill={p.status === 'confirmed' ? '#059669' : '#DC2626'} opacity={0.8} />
              {/* Label */}
              <text x={p.x} y={p.y - r - 6} textAnchor="middle" fill="#999" fontSize="7" fontFamily="'IBM Plex Mono', monospace">
                {p.city}
              </text>
              {/* Count */}
              <text x={p.x} y={p.y + 3} textAnchor="middle" fill="#F5F0E8" fontSize="8" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
                {p.people}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669' }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#888' }}>Confirmed stop</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626' }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#888' }}>Community asking</span>
        </div>
      </div>
    </div>
  );
}

// ── Location Card ──

function LocationSection({ loc }: { loc: LocationInfo }) {
  const [expanded, setExpanded] = useState(false);
  const isConfirmed = loc.status === 'confirmed';

  return (
    <div style={{
      border: isConfirmed ? '1px solid #333' : '1px dashed #555',
      marginBottom: 16,
      background: '#111',
    }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'transparent', border: 'none', color: '#F5F0E8', cursor: 'pointer', textAlign: 'left',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-block', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em',
              background: isConfirmed ? '#059669' : '#DC2626', color: '#F5F0E8', borderRadius: 2,
            }}>
              {isConfirmed ? loc.date : 'ASKING'}
            </span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#F5F0E8' }}>{loc.city}</h3>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666' }}>{loc.state}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>{loc.headline}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F5F0E8' }}>{loc.people}</p>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#666' }}>people</p>
          </div>
          <span style={{ color: '#666', fontSize: '1.2rem' }}>{expanded ? '−' : '+'}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #222', padding: '20px 24px' }}>
          {/* Quotes */}
          {loc.quotes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Voices</p>
              {loc.quotes.map((q, i) => (
                <div key={i} style={{ borderLeft: '2px solid #333', padding: '8px 16px', marginBottom: 8 }}>
                  <p style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.5 }}>&ldquo;{q.text}&rdquo;</p>
                  <p style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>— {q.name}{q.org ? `, ${q.org}` : ''}</p>
                </div>
              ))}
            </div>
          )}

          {/* Organisations to engage */}
          {loc.orgs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Organisations for Room 3</p>
              <div style={{ display: 'grid', gap: 6 }}>
                {loc.orgs.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                    <span style={{ color: '#059669', flexShrink: 0 }}>●</span>
                    <div>
                      <span style={{ fontWeight: 600, color: '#ddd' }}>{o.name}</span>
                      <span style={{ color: '#888' }}> — {o.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Politicians */}
          {loc.politicians.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Political engagement</p>
              <div style={{ display: 'grid', gap: 6 }}>
                {loc.politicians.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                    <span style={{ color: '#DC2626', flexShrink: 0 }}>●</span>
                    <div>
                      <span style={{ fontWeight: 600, color: '#ddd' }}>{p.name}</span>
                      <span style={{ color: '#888' }}> — {p.role}. {p.angle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Who's driving this stop */}
          {loc.drivers.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Who&apos;s driving this</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {loc.drivers.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                    <span style={{ color: '#F5F0E8', flexShrink: 0 }}>◆</span>
                    <div>
                      <span style={{ fontWeight: 600, color: '#F5F0E8' }}>{d.name}</span>
                      <span style={{ color: '#888' }}> · {d.org}</span>
                      <p style={{ color: '#888', marginTop: 2, marginBottom: 0 }}>{d.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community asking / interested */}
          {loc.community.length > 0 && (
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Community interest</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {loc.community.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                    <span style={{ color: '#555', flexShrink: 0 }}>→</span>
                    <div>
                      <span style={{ fontWeight: 500, color: '#ccc' }}>{c.name}</span>
                      {c.org && <span style={{ color: '#666' }}> · {c.org}</span>}
                      <p style={{ color: '#888', marginTop: 2, marginBottom: 0 }}>{c.what}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──

export default function CommunityPage() {
  const [authed, setAuthed] = useState(false);

  if (!authed) return <PasscodeGate onAuth={() => setAuthed(true)} />;

  const confirmed = LOCATIONS.filter(l => l.status === 'confirmed');
  const demand = LOCATIONS.filter(l => l.status === 'demand');
  const totalPeople = LOCATIONS.reduce((s, l) => s + l.people, 0);
  const totalOrgs = LOCATIONS.reduce((s, l) => s + l.orgs.length, 0);
  const totalPoliticians = LOCATIONS.reduce((s, l) => s + l.politicians.length, 0);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ background: '#0A0A0A', color: '#F5F0E8', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif" }}>

        {/* ═══ 1. THE ART ═══ */}
        <section style={{ padding: '80px 40px 60px', maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#666', marginBottom: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            CONTAINED — A Curious Tractor
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 32, color: '#F5F0E8' }}>
            It starts with<br />a shipping container.
          </h1>
          {/* The two rooms — THE money shot */}
          <img
            src="https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1773631915230_Contained-7.jpg"
            alt="Two rooms side by side — a warm bedroom on the left, a bare detention cell on the right. This is the experience."
            style={{ width: '100%', marginBottom: 16 }}
          />
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555', marginBottom: 40, textAlign: 'center' }}>
            Two rooms. One container. Left: what a child&apos;s room could look like. Right: what detention looks like.
          </p>

          <div style={{ maxWidth: 680 }}>
            <p style={{ fontSize: '1.1rem', color: '#999', lineHeight: 1.8, marginBottom: 16 }}>
              CONTAINED is a piece of art. A 20-foot shipping container converted into an immersive experience
              of what youth detention actually looks like in Australia. Three rooms:
            </p>
            <div style={{ display: 'grid', gap: 12, margin: '24px 0 32px', paddingLeft: 16 }}>
              {[
                { room: 'Room 1', desc: 'What a child sees when the door closes.' },
                { room: 'Room 2', desc: 'What the evidence says works instead.' },
                { room: 'Room 3', desc: 'Community organisations and young people telling their own story.' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', flexShrink: 0 }}>{r.room}</span>
                  <span style={{ fontSize: '0.95rem', color: '#ccc' }}>{r.desc}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '1.1rem', color: '#999', lineHeight: 1.8 }}>
              It launched in Sydney in October 2025. Within weeks, 29 people filled out the website form asking for
              it in their community. We didn&apos;t go looking for them. They found us.
            </p>
          </div>
        </section>

        {/* Stories: The art */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StoryCard story={STORIES.contained} />
            <StoryCard story={STORIES.walking} />
          </div>
        </section>

        {/* ═══ 2. THE REACTION ═══ */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 60px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 24, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            What happened next
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[
              { name: 'Katherine Hayes', org: 'YAC Brisbane', text: 'We would love to host this at YAC!!!' },
              { name: 'Loic Fery', org: 'Prevention Not Detention, Tasmania', text: 'We do not have funds, we are just passionate community members. But we do want to see change. If there\'s any chance we can have the container on the island we will make sure we get as many politicians, public and workers through it.' },
              { name: 'Delilah MacGillivray', org: 'DWords, Rockhampton', text: 'I am Kalkadoon. I would like to know more and would also like to help. Showcase on Darumbal Country.' },
              { name: 'Irene Portelli', org: 'Lady Tradies, Cairns', text: "We are doing Lady Tradies in Cairns for women in Yarrabah and Townsville to have a jobs pipeline post-prison. We overlap." },
              { name: 'Toby Gowland', org: 'Kalianah Outdoors, QLD', text: 'Talk to me boys, what can I do, how can I help?' },
              { name: 'Ludmila Andrade', org: 'Young Perspectives, Amsterdam', text: 'I coordinate the International Program at YOPE, a Dutch-based NGO that works with justice-involved youth. I would like to learn more!' },
              { name: 'Jess Lilley', org: 'The Open Arms, Melbourne', text: "Would love to host CONTAINED as part of the Footscray West Writers Fest. The theme is Words & Action — CONTAINED would fit perfectly." },
              { name: 'Christine Thomas', org: 'Calmer Kids', text: 'Heart overflowing.' },
            ].map((v, i) => (
              <div key={i} style={{ borderLeft: '2px solid #333', padding: '12px 16px', background: '#111' }}>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#ccc' }}>&ldquo;{v.text}&rdquo;</p>
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: 8 }}>— {v.name}, {v.org}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 20, fontStyle: 'italic' }}>
            From Tasmania to Doomadgee, from a Kalkadoon woman in Rockhampton to a Dutch NGO in Amsterdam. Every quote on this page is from a real person who contacted us.
          </p>
        </section>

        {/* ═══ 3. COMMUNITY ALREADY DOING THIS ═══ */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 80px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            What community organisations and young people are already building
          </p>
          <p style={{ fontSize: '1.05rem', color: '#999', maxWidth: 680, lineHeight: 1.7, marginBottom: 32 }}>
            The alternatives to detention already exist. Community organisations across Australia are running programs
            that keep young people on Country, in education, in connection — at a fraction of the cost.
            They just don&apos;t get the visibility, the data infrastructure, or the philanthropy.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <img src="/images/contained/stat-comparison.png" alt="84% reoffend in detention, 88% succeed in community" style={{ width: '100%', border: '1px solid #222' }} />
            <img src="/images/contained/bespoke-data-viz.png" alt="Same money, 16 young lives changed" style={{ width: '100%', border: '1px solid #222' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 32 }}>
            <div style={{ background: '#1a0000', border: '1px solid #DC2626', padding: '32px' }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                What Australia spends on detention
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#DC2626' }}>$3,635/day</p>
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 4 }}>per child, national average</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555', marginTop: 16 }}>VIC: $7,304/day · WA: $4,184/day · NT: $3,452/day</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444', marginTop: 4 }}>Source: ROGS 2024-25, Table 17A.20</p>
            </div>
            <div style={{ background: '#001a0a', border: '1px solid #059669', padding: '32px' }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                What community alternatives cost
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>$170K/year</p>
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 4 }}>median, across 824 programs with cost data</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555', marginTop: 16 }}>Oonchiumpa: 95% diversion rate</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555' }}>PICC: 21 programs, 200 staff, zero philanthropy</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#222' }}>
            {[
              { n: '1,117', label: 'Community programs mapped', color: '#059669' },
              { n: '824', label: 'With cost data', color: '#F5F0E8' },
              { n: '570', label: 'Evidence records', color: '#F5F0E8' },
              { n: '415', label: 'Media articles tracked', color: '#F5F0E8' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0A0A0A', padding: '24px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', color: s.color }}>{s.n}</p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#666', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stories: The evidence */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StoryCard story={STORIES.oonchiumpa} />
            <StoryCard story={STORIES.cure} />
          </div>
        </section>

        {/* ═══ 4. THE TOUR — AGENCY & ACTIVITY ═══ */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 40px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            The tour — building agency through activity
          </p>
          <p style={{ fontSize: '1.05rem', color: '#999', maxWidth: 680, lineHeight: 1.7, marginBottom: 32 }}>
            At each stop, Room 3 becomes theirs. Local community organisations tell their story,
            present their programs, connect with young people. The Container doesn&apos;t arrive with answers —
            it creates a space for the community to show what they&apos;ve already built.
          </p>
        </section>

        {/* Map */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 40px' }}>
          <AustraliaMap />
        </section>

        {/* Stats strip */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#222' }}>
            {[
              { n: totalPeople, label: 'People connected', color: '#F5F0E8' },
              { n: LOCATIONS.length, label: 'Locations', color: '#F5F0E8' },
              { n: confirmed.length, label: 'Stops confirmed', color: '#059669' },
              { n: demand.length, label: 'Communities asking', color: '#DC2626' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0A0A0A', padding: '24px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: s.color }}>{s.n}</p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#666', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* First stop callout */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'center', background: '#111', border: '1px solid #333', padding: 24 }}>
            <img src="/images/contained/tour-mount-druitt.png" alt="Mount Druitt — The CONTAINED launches 2026" style={{ width: '100%', borderRadius: 4 }} />
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#DC2626', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>First stop</p>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, color: '#F5F0E8' }}>Mount Druitt, Western Sydney</h3>
              <p style={{ fontSize: '0.9rem', color: '#888', lineHeight: 1.5 }}>
                Week of April 21. Mounty Yarns hosting. Room 3: youth-led storytelling with Just Reinvest, BackTrack, and Uniting.
              </p>
            </div>
          </div>
        </section>

        {/* Confirmed stops */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 60px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 20, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Confirmed stops — {confirmed.length} cities, Apr–Oct 2026
          </p>
          {confirmed.map((loc, i) => <LocationSection key={i} loc={loc} />)}
        </section>

        {/* ═══ 5. SUPPORT & OPPORTUNITY ═══ */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 60px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Communities asking for the container — {demand.length} more locations
          </p>
          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: 20, maxWidth: 650 }}>
            These people reached out — most in October 2025 — asking for the Container in their community.
            Some are offering venues, partnerships, media coverage. Some just want to help.
          </p>
          {demand.map((loc, i) => <LocationSection key={i} loc={loc} />)}
        </section>

        {/* ═══ 6. MEDIA, POLITICIANS, SYSTEMIC CHANGE ═══ */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 80px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Media, political engagement, and ongoing systemic ideas
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div style={{ border: '1px solid #333', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#F5F0E8' }}>Media interest</h3>
              <div style={{ display: 'grid', gap: 8, fontSize: '0.85rem' }}>
                <p style={{ color: '#ccc' }}><span style={{ color: '#059669' }}>●</span> 3CR Radio — interview offer for Wednesday Breakfast</p>
                <p style={{ color: '#ccc' }}><span style={{ color: '#059669' }}>●</span> First Nations News — op-ed invitation from Peter Rowe</p>
                <p style={{ color: '#ccc' }}><span style={{ color: '#059669' }}>●</span> Thriving Minds podcast — Prof Selena Bartlett, Brisbane</p>
                <p style={{ color: '#ccc' }}><span style={{ color: '#059669' }}>●</span> MMAD Futures Radio — runs 24/7 inside QLD detention</p>
              </div>
            </div>
            <div style={{ border: '1px solid #333', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#F5F0E8' }}>Political landscape</h3>
              <div style={{ display: 'grid', gap: 8, fontSize: '0.85rem' }}>
                <p style={{ color: '#ccc' }}><span style={{ color: '#DC2626' }}>●</span> QLD: $765M announced, zero to ACCOs</p>
                <p style={{ color: '#ccc' }}><span style={{ color: '#DC2626' }}>●</span> VIC: Cherry Creek — $7,304/day, most expensive in Australia</p>
                <p style={{ color: '#ccc' }}><span style={{ color: '#DC2626' }}>●</span> TAS: Ashley YDC closure — live political issue</p>
                <p style={{ color: '#ccc' }}><span style={{ color: '#DC2626' }}>●</span> ACT: Government insider says system is changing</p>
                <p style={{ color: '#ccc' }}><span style={{ color: '#DC2626' }}>●</span> ALP National Conference Jul 23-25 Adelaide</p>
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid #333', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#F5F0E8' }}>What people are offering — unprompted</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { type: 'Venues', items: ['YAC Brisbane', 'Good Bank Gallery SA', 'Footscray Writers Fest', 'Design Week Melbourne', 'Canberra hosting'] },
                { type: 'Partnerships', items: ['Lady Tradies — jobs pipeline', 'Uni of Sydney — research', 'YOPE Amsterdam', 'EPIC Pathways', 'MMAD — radio in detention'] },
                { type: 'Media', items: ['3CR Radio interview', 'FN News op-ed', 'Thriving Minds podcast', 'Impact Boom feature'] },
                { type: 'Government', items: ['ACT Govt insider', 'QLD Dept of Youth Justice', 'ALP Conference activation'] },
              ].map((g, i) => (
                <div key={i}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.type}</p>
                  {g.items.map((item, j) => (
                    <p key={j} style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: 1.6 }}>{item}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. JUSTICEHUB — THE PERMANENT INFRASTRUCTURE ═══ */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 80px', borderTop: '1px solid #222', paddingTop: 60 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Then launch JusticeHub
          </p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, color: '#F5F0E8', lineHeight: 1.2 }}>
            The tour ends.<br />The platform stays.
          </h2>
          <div style={{ maxWidth: 680 }}>
            <p style={{ fontSize: '1rem', color: '#999', lineHeight: 1.7, marginBottom: 16 }}>
              Every community organisation featured in Room 3 gets their data on JusticeHub — programs, funding,
              evidence, stories — permanently. The national discussion on youth justice doesn&apos;t end when the
              Container leaves town. It continues through the platform, driven by community, not by government.
            </p>
            <p style={{ fontSize: '1rem', color: '#999', lineHeight: 1.7, marginBottom: 32 }}>
              Stories from the Empathy Ledger. Organisations mapped and compared. Funding tracked and made transparent.
              Evidence gaps identified. Best practice shared — from community to community, not top-down.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Stories & Profiles', desc: 'Real stories from the Empathy Ledger — young people, workers, communities telling their own truth.', link: '/stories', linkText: 'Stories →' },
              { label: 'Organisations & Programs', desc: '1,117 community programs mapped. What they do, what they cost, who funds them, what the evidence says.', link: '/for-funders', linkText: 'Funder Hub →' },
              { label: 'Data & Transparency', desc: 'Funding flows, evidence gaps, political statements — all tracked and open. Accountability through visibility.', link: '/for-funders/evidence-gaps', linkText: 'Evidence Gaps →' },
            ].map((card, i) => (
              <div key={i} style={{ border: '1px solid #333', padding: '24px' }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#059669', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{card.label}</p>
                <p style={{ fontSize: '0.85rem', color: '#888', lineHeight: 1.5, marginBottom: 12 }}>{card.desc}</p>
                <a href={card.link} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', textDecoration: 'none' }}>{card.linkText}</a>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ TIMELINE ═══ */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 80px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 24, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            How the momentum built
          </p>
          <div style={{ borderLeft: '2px solid #333', paddingLeft: 24 }}>
            {[
              { date: 'Oct 2025', text: 'Container launches in Sydney. 29 people fill out the website form within weeks.' },
              { date: 'Oct-Nov 2025', text: 'Requests from Tasmania, Cairns, Doomadgee, Armidale, Rockhampton, Brisbane, Melbourne, Adelaide. Amsterdam.' },
              { date: 'Jan-Feb 2026', text: 'QLD government announces $765M in youth justice spending. Zero to Aboriginal community-controlled organisations.' },
              { date: 'Mar 2026', text: '225+ contacts. YAC offers to host Brisbane. 86 people across 15 locations. JusticeHub maps 1,117 programs.' },
              { date: 'Apr 2026', text: 'Tour begins — Mount Druitt. Room 3: Mounty Yarns, Just Reinvest, BackTrack.' },
              { date: 'Jun-Jul 2026', text: 'Adelaide: Reintegration Conference + ALP National Conference. Container outside the convention centre.' },
              { date: 'Jul-Oct 2026', text: 'Perth, Tennant Creek, Townsville, Brisbane. Community by community.' },
              { date: 'Late 2026', text: 'JusticeHub launches publicly. Stories, organisations, data — continuing to drive national discussion through community.' },
            ].map((t, i) => (
              <div key={i} style={{ marginBottom: 24, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -31, top: 4, width: 12, height: 12, borderRadius: '50%', background: i >= 4 ? '#DC2626' : '#333' }} />
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#666', marginBottom: 4 }}>{t.date}</p>
                <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: 1.5 }}>{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ maxWidth: 1000, margin: '0 auto', padding: '40px', borderTop: '1px solid #222' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#444', lineHeight: 1.6 }}>
            CONTAINED is a project of A Curious Tractor.
            Every quote on this page is from a real person who contacted us.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            <a href="/for-funders" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', textDecoration: 'none' }}>Funder Hub →</a>
            <a href="/for-funders/evidence-gaps" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', textDecoration: 'none' }}>Evidence Gaps →</a>
            <a href="/for-funders/calculator" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#059669', textDecoration: 'none' }}>Impact Calculator →</a>
            <a href="/back-this" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#DC2626', textDecoration: 'none' }}>Back This →</a>
          </div>
        </footer>
      </div>
    </>
  );
}
