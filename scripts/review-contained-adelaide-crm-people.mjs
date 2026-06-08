#!/usr/bin/env node
import dotenv from 'dotenv';
import { readFile, writeFile } from 'node:fs/promises';
import { Client } from '@notionhq/client';

dotenv.config({ path: '.env.local' });

const notionToken =
  process.env.NOTION_API_TOKEN ||
  process.env.NOTION_TOKEN ||
  process.env.JUSTICEHUB_NOTION_TOKEN;

const PEOPLE_DS = '511ebcaa-8d57-4c8c-ae53-00a5c7fd6f59';
const auditPath = 'output/ghl-contained-adelaide-audit/segments.json';
const reviewOutputPath = 'output/ghl-contained-adelaide-audit/notion-review-summary.json';
const force = process.argv.includes('--force');
const locationsOnly = process.argv.includes('--locations-only');

if (!notionToken) {
  console.error('Missing NOTION_API_TOKEN / NOTION_TOKEN / JUSTICEHUB_NOTION_TOKEN');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function norm(value) {
  return String(value || '').trim().toLowerCase();
}

function propText(page, name) {
  const prop = page.properties[name];
  if (!prop) return '';
  if (prop.type === 'rich_text') return prop.rich_text.map((part) => part.plain_text).join('');
  if (prop.type === 'title') return prop.title.map((part) => part.plain_text).join('');
  if (prop.type === 'email') return prop.email || '';
  if (prop.type === 'select') return prop.select?.name || '';
  return '';
}

function propCheckbox(page, name) {
  const prop = page.properties[name];
  return prop?.type === 'checkbox' ? Boolean(prop.checkbox) : false;
}

function select(name) {
  return name ? { select: { name } } : { select: null };
}

function checkbox(value) {
  return { checkbox: Boolean(value) };
}

function rich(text) {
  return { rich_text: [{ text: { content: String(text || '').slice(0, 1900) } }] };
}

function multiSelect(names) {
  return { multi_select: [...new Set(names.filter(Boolean))].map((name) => ({ name })) };
}

function crmLocationSelectName(location) {
  const value = String(location || '').toLowerCase();
  if (!value || value === 'unknown') return 'Unknown';
  if (value.includes('adelaide') || value.includes('mclaren vale') || value.includes('south australia')) return 'Adelaide';
  if (value.includes('sydney') || value.includes('mount druitt') || value.includes('regional nsw') || value.includes('armidale') || value.includes('new south wales')) return 'Sydney';
  if (value.includes('melbourne') || value.includes('victoria')) return 'Melbourne';
  if (value.includes('brisbane')) return 'Brisbane';
  if (value.includes('cape york')) return 'Cape York';
  if (value.includes('rockhampton')) return 'Rockhampton';
  if (value.includes('cairns')) return 'Cairns';
  if (value.includes('queensland') || value.includes('tamborine') || value.includes('doomadgee') || value.includes('witta') || value.includes('sunshine coast')) return 'Queensland';
  if (value.includes('perth')) return 'Perth';
  if (value.includes('western australia') || value.includes('broome')) return 'Western Australia';
  if (value.includes('tasmania')) return 'Tasmania';
  if (value.includes('canberra') || value.includes('capital territory')) return 'Canberra';
  if (value.includes('alice springs')) return 'Alice Springs';
  if (value.includes('east arnhem')) return 'East Arnhem';
  if (value.includes('maningrida') || value.includes('arnhem land')) return 'Maningrida / Arnhem Land';
  if (value.includes('northern territory') || value.includes('darwin') || value.includes('tennant creek')) return 'Northern Territory';
  if (value.includes('national') || value.includes('australia-wide') || value.includes('regional australia')) return 'National';
  if (value.includes('international') || value.includes('amsterdam') || value.includes('london') || value.includes('france') || value.includes('malaysia') || value.includes('united states') || value.includes('california')) return 'International';
  return location;
}

function crmStateSelectName(states) {
  const unique = [...new Set((states || []).filter(Boolean))];
  if (!unique.length) return 'Unknown';
  if (unique.includes('International')) return 'International';
  if (unique.includes('National') && unique.length === 1) return 'National';
  return unique.find((state) => state !== 'National' && state !== 'Unknown') || unique[0] || 'Unknown';
}

function textFor(row) {
  return [
    row.segment,
    row.reason,
    row.name,
    row.company,
    row.city,
    row.state,
    row.source,
    row.tags,
  ].join(' ').toLowerCase();
}

function has(text, ...needles) {
  return needles.some((needle) => text.includes(needle));
}

function hasToken(text, ...needles) {
  return needles.some((needle) => {
    const escaped = needle
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\ /g, '[\\s_-]+');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
  });
}

const STATE_ALIASES = new Map([
  ['sa', 'SA'],
  ['south australia', 'SA'],
  ['nsw', 'NSW'],
  ['new south wales', 'NSW'],
  ['vic', 'VIC'],
  ['victoria', 'VIC'],
  ['qld', 'QLD'],
  ['queensland', 'QLD'],
  ['wa', 'WA'],
  ['western australia', 'WA'],
  ['tas', 'TAS'],
  ['tasmania', 'TAS'],
  ['nt', 'NT'],
  ['northern territory', 'NT'],
  ['act', 'ACT'],
  ['australian capital territory', 'ACT'],
]);

const PLACE_RULES = [
  ['adelaide', 'Adelaide', 'SA'],
  ['mclaren vale', 'McLaren Vale', 'SA'],
  ['sydney', 'Sydney', 'NSW'],
  ['mount druitt', 'Mount Druitt', 'NSW'],
  ['mount-druitt', 'Mount Druitt', 'NSW'],
  ['mt druitt', 'Mount Druitt', 'NSW'],
  ['western sydney', 'Western Sydney', 'NSW'],
  ['regional nsw', 'Regional NSW', 'NSW'],
  ['regional-nsw', 'Regional NSW', 'NSW'],
  ['armidale', 'Armidale', 'NSW'],
  ['melbourne', 'Melbourne', 'VIC'],
  ['brisbane', 'Brisbane', 'QLD'],
  ['tamborine', 'Tamborine', 'QLD'],
  ['cape york', 'Cape York', 'QLD'],
  ['cape-york', 'Cape York', 'QLD'],
  ['rockhampton', 'Rockhampton', 'QLD'],
  ['cairns', 'Cairns', 'QLD'],
  ['doomadgee', 'Doomadgee', 'QLD'],
  ['perth', 'Perth', 'WA'],
  ['broome', 'Broome', 'WA'],
  ['tasmania', 'Tasmania', 'TAS'],
  ['darwin', 'Darwin', 'NT'],
  ['alice springs', 'Alice Springs', 'NT'],
  ['nt', 'Northern Territory', 'NT'],
  ['canberra', 'Canberra', 'ACT'],
  ['national', 'National', 'National'],
  ['international', 'International', 'International'],
  ['amsterdam', 'Amsterdam', 'International'],
  ['london', 'London', 'International'],
];

const NAME_HISTORY_RULES = [
  ['katherine hayes', 'Brisbane', ['QLD'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Katherine Hayes / YAC / Brisbane QLD'],
  ['natalie chiappazzo', 'Western Sydney', ['NSW'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Natalie Chiappazzo / Western Sydney'],
  ['daniel daylight', 'Mount Druitt', ['NSW'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Daniel Daylight / Mounty Yarns / Mt Druitt NSW'],
  ['lucy stronach', 'Sydney / WA', ['NSW', 'WA'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Lucy Stronach / Minderoo / Sydney/WA'],
  ['joe kwon', 'Sydney', ['NSW'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Joe Kwon / Sydney NSW'],
  ['jacqueline dortmans', 'Tasmania', ['TAS'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Jacqueline Dortmans / DarkLab / Tasmania'],
  ['zoe brooks', 'McLaren Vale', ['SA'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Zoe Brooks / Good Bank Gallery / McLaren Vale SA'],
  ['samantha burns', 'London', ['International'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Samantha Burns / London UK'],
  ['arianna petra watson', 'Adelaide', ['SA'], 'Repo: compendium/contained-tour-intelligence.md original requester table lists Arianna Petra Watson / SouthStart / Adelaide SA'],
];

const ORG_HISTORY_RULES = [
  ['chair justice reform initiative', 'National', ['National']],
  ['justice reform initiative', 'National', ['National']],
  ['hope community services perth', 'Perth', ['WA']],
  ['organisation:perth', 'Perth', ['WA']],
  ['research partnerships uwa', 'Perth', ['WA']],
  ['university of western australia', 'Perth', ['WA']],
  ['uwa', 'Perth', ['WA']],
  ['reconciliation wa', 'Perth', ['WA']],
  ['minderoo', 'Western Australia / National', ['WA', 'National']],
  ['university of melbourne', 'Melbourne', ['VIC']],
  ['housing scholar', 'Melbourne', ['VIC']],
  ['vichealth research fellow', 'Victoria', ['VIC']],
  ['melbourne fringe', 'Melbourne', ['VIC']],
  ['st martins youth arts', 'Melbourne', ['VIC']],
  ['vichealth', 'Victoria', ['VIC']],
  ['murrup barak', 'Melbourne', ['VIC']],
  ['murrup.org.au', 'Melbourne', ['VIC'], 'Gmail-backed signal: Murrup email signature lists East Melbourne VIC / Wurundjeri Country'],
  ['small giants', 'Melbourne', ['VIC']],
  ['portable', 'Melbourne / Sydney', ['VIC', 'NSW']],
  ['the myer foundation', 'Melbourne', ['VIC']],
  ['university of sydney', 'Sydney', ['NSW']],
  ['paul ramsay foundation', 'Sydney / National', ['NSW', 'National']],
  ['dusseldorp forum', 'Sydney / National', ['NSW', 'National']],
  ['snow foundation', 'Canberra / National', ['ACT', 'National']],
  ['bryan family group', 'Queensland', ['QLD']],
  ['the bryan foundation', 'Queensland', ['QLD']],
  ['tim fairfax family foundation', 'Queensland', ['QLD']],
  ['qic', 'Queensland', ['QLD']],
  ['queensland gives', 'Queensland', ['QLD']],
  ['queenslandgives.org.au', 'Queensland', ['QLD'], 'Public/org-domain signal: Queensland Gives domain and GHL email domain'],
  ['frrr', 'Regional Australia', ['National']],
  ['jvtrust', 'Queensland', ['QLD']],
  ['amp foundation', 'National', ['National']],
  ['the funding network', 'National', ['National']],
  ['philanthropy network', 'National', ['National']],
  ['streetsmart australia', 'Australia-wide', ['National']],
  ['streetsmartaustralia', 'Australia-wide', ['National']],
  ['yac.net', 'Brisbane', ['QLD']],
  ['future anything', 'Queensland', ['QLD']],
  ['dept youth justice', 'Queensland', ['QLD']],
  ['member for cooper qld', 'Queensland', ['QLD']],
  ['queensland government', 'Queensland', ['QLD']],
  ['north qld land council', 'North Queensland', ['QLD']],
  ['redarc', 'Adelaide / South Australia', ['SA']],
  ['aurizon', 'Queensland / National', ['QLD', 'National']],
  ['cape york partnership', 'Cape York', ['QLD']],
  ['yiliyapinya', 'Queensland', ['QLD']],
  ['picc', 'North Queensland', ['QLD'], 'Repo/public source signal: PICC is tied to Townsville/Palm Island, Queensland'],
  ['palm island community company', 'North Queensland', ['QLD'], 'Repo/public source signal: Palm Island Community Company is tied to Townsville/Palm Island, Queensland'],
  ['collab4good adelaide', 'Adelaide', ['SA']],
  ['digital ethics adelaide', 'Adelaide', ['SA']],
  ['ceo taboo', 'Adelaide', ['SA']],
  ['oonchiumpa', 'Alice Springs', ['NT']],
  ['urapuntja', 'Northern Territory', ['NT'], 'Public source signal: Urapuntja Aboriginal Corporation serves Utopia/Arlparra homelands in Central Australia, NT'],
  ['bawinanga aboriginal corporation', 'Maningrida / Arnhem Land', ['NT']],
  ['east arnhem regional council', 'East Arnhem', ['NT']],
  ['nt shelter', 'Northern Territory', ['NT']],
  ['nt phn', 'Northern Territory', ['NT'], 'Public source signal: NT PHN is Northern Territory Primary Health Network'],
  ['miwatj health', 'East Arnhem', ['NT']],
  ['miwatj', 'East Arnhem', ['NT']],
  ['ingkerreke', 'Alice Springs', ['NT']],
  ['julalikari', 'Tennant Creek', ['NT']],
  ['barkly backbone', 'Northern Territory', ['NT'], 'Public/geographic signal: Barkly region is in the Northern Territory'],
  ['red dust', 'Northern Territory', ['NT']],
  ['njamarleya', 'Western Australia', ['WA']],
  ['winnunga nimmityjah', 'Canberra', ['ACT']],
  ['centre for public impact', 'Global / Australia', ['National', 'International']],
  ['aracy', 'National', ['National']],
  ['infoxchange', 'Melbourne / National', ['VIC', 'National']],
  ['smart recovery australia', 'National', ['National']],
  ['deadlyscience', 'National', ['National'], 'Public source signal: DeadlyScience works with regional and remote communities across Australia'],
  ['plate it forward', 'Sydney', ['NSW']],
  ['relove', 'Sydney', ['NSW'], 'Public source signal: ReLove describes itself as Sydney-based / one of Sydney’s leading crisis support services'],
  ['orange sky', 'Brisbane', ['QLD'], 'Repo/public source signal: Orange Sky was founded in Brisbane and is Brisbane-based; services are national'],
  ['orangesky.org', 'Brisbane', ['QLD'], 'Repo/public source signal: Orange Sky was founded in Brisbane and is Brisbane-based; services are national'],
  ['sefa', 'National', ['National'], 'Public source signal: SEFA / SEFA Partnerships operates across Australia'],
  ['sefa partnerships', 'National', ['National'], 'Public source signal: SEFA Partnerships works across Australia'],
  ['paul ramsey foundation', 'Sydney / National', ['NSW', 'National'], 'Typo match for Paul Ramsay Foundation; repo history treats PRF as Sydney/National'],
  ['paul ramsay foundation', 'Sydney / National', ['NSW', 'National']],
  ['food connect shed', 'Brisbane', ['QLD'], 'Public source signal: Food Connect Shed is in Brisbane/Salisbury, Queensland'],
  ['walking on country', 'National', ['National']],
  ['first nations futures', 'National', ['National'], 'Public source signal: First Nations Futures works on economic justice in Australia'],
  ['our community shed', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['theharvestwitta', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['the harvest witta', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['rubimicrocafe', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['frenchaffair', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['defydesign', 'Queensland', ['QLD']],
  ['cultivatethechaos', 'Queensland', ['QLD']],
];

const DOMAIN_HISTORY_RULES = [
  ['unimelb.edu.au', 'Melbourne', ['VIC']],
  ['sydney.edu.au', 'Sydney', ['NSW']],
  ['anu.edu.au', 'Canberra', ['ACT']],
  ['uq.edu.au', 'Queensland', ['QLD']],
  ['qut.edu.au', 'Brisbane', ['QLD']],
  ['griffith.edu.au', 'Queensland', ['QLD']],
  ['flinders.edu.au', 'Adelaide', ['SA']],
  ['adelaide.edu.au', 'Adelaide', ['SA']],
  ['uwa.edu.au', 'Perth', ['WA']],
  ['curtin.edu.au', 'Perth', ['WA']],
  ['rmit.edu.au', 'Melbourne', ['VIC']],
  ['monash.edu', 'Melbourne', ['VIC']],
  ['unsw.edu.au', 'Sydney', ['NSW']],
  ['qld.gov.au', 'Queensland', ['QLD']],
  ['nt.gov.au', 'Northern Territory', ['NT']],
  ['sa.gov.au', 'South Australia', ['SA']],
  ['nsw.gov.au', 'New South Wales', ['NSW']],
  ['vic.gov.au', 'Victoria', ['VIC']],
  ['tas.gov.au', 'Tasmania', ['TAS']],
  ['wa.gov.au', 'Western Australia', ['WA']],
  ['act.gov.au', 'Australian Capital Territory', ['ACT']],
  ['sjusd.org', 'San Jose, California', ['International']],
  ['wanadoo.fr', 'France', ['International']],
  ['yahoo.com.my', 'Malaysia', ['International']],
  ['tmomail.net', 'United States', ['International']],
  ['queenslandgives.org.au', 'Queensland', ['QLD']],
  ['justreinvest.org.au', 'Sydney / National', ['NSW', 'National']],
  ['picc.com.au', 'North Queensland', ['QLD']],
  ['ntphn.org.au', 'Northern Territory', ['NT']],
  ['urapuntja.com.au', 'Northern Territory', ['NT']],
  ['relove.org.au', 'Sydney', ['NSW']],
  ['relove.com.au', 'Sydney', ['NSW']],
  ['orangesky.org.au', 'Brisbane', ['QLD']],
  ['deadlyscience.org.au', 'National', ['National']],
  ['sefapartnerships.org.au', 'National', ['National']],
  ['sefa.com.au', 'National', ['National']],
  ['paulramsayfoundation.org.au', 'Sydney / National', ['NSW', 'National']],
  ['foodconnectshed.com.au', 'Brisbane', ['QLD']],
  ['barklybackbone.com.au', 'Northern Territory', ['NT']],
];

const TAG_HISTORY_RULES = [
  ['goods-src-canberra-airport-2026', 'Canberra', ['ACT']],
  ['source:event:canberra-airport-2026', 'Canberra', ['ACT']],
  ['project:act-hv', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['harvest-website', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['source:local-witta', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['source:event:eoi-gathering-2026', 'Witta / Sunshine Coast Hinterland', ['QLD']],
  ['source:event:gathering', 'Witta / Sunshine Coast Hinterland', ['QLD']],
];

function normaliseExplicitPlace(value) {
  const clean = String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (!clean) return '';
  return clean
    .split(' ')
    .map((part) => (part.length <= 3 && STATE_ALIASES.has(part.toLowerCase()) ? STATE_ALIASES.get(part.toLowerCase()) : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

function explicitPlaceTags(row) {
  const tags = String(row.tags || '');
  const values = [];
  const re = /(?:^|;\s*)place:([^;]+)/gi;
  let match;
  while ((match = re.exec(tags))) values.push(match[1].trim());
  return values;
}

function orgHistoryLocationFor(row) {
  const name = norm(row.name);
  for (const [needle, location, states, source] of NAME_HISTORY_RULES) {
    if (name === needle) {
      return {
        location,
        states,
        source,
        review: 'Org/history-backed',
      };
    }
  }

  const org = norm(row.company);
  const orgKey = org ? `organisation:${org}` : '';
  const emailValue = norm(row.email);
  const tags = norm(row.tags);
  const haystack = [org, orgKey, emailValue].join(' ');
  for (const [needle, location, states, sourceNote] of ORG_HISTORY_RULES) {
    if (haystack.includes(needle)) {
      return {
        location,
        states,
        source: sourceNote || `Org/history signal from GHL/Notion organisation/email field: ${row.company || row.email || needle}`,
        review: 'Org/history-backed',
      };
    }
  }

  for (const [needle, location, states, sourceNote] of DOMAIN_HISTORY_RULES) {
    if (emailValue.includes(needle)) {
      return {
        location,
        states,
        source: sourceNote || `Email domain signal: ${needle}`,
        review: 'Org/history-backed',
      };
    }
  }

  for (const [needle, location, states] of TAG_HISTORY_RULES) {
    if (tags.includes(needle)) {
      return {
        location,
        states,
        source: `GHL project/source tag signal: ${needle}`,
        review: 'Org/history-backed',
      };
    }
  }

  return null;
}

function locationFor(row) {
  const explicitCity = normaliseExplicitPlace(row.city);
  const explicitState = STATE_ALIASES.get(norm(row.state)) || '';
  if (explicitCity) {
    return {
      location: explicitState ? `${explicitCity}, ${explicitState}` : explicitCity,
      states: explicitState ? [explicitState] : ['Unknown'],
      source: `GHL city/state fields: city="${row.city || ''}", state="${row.state || ''}"`,
      review: explicitState ? 'Source-backed' : 'Needs review',
    };
  }

  const tagPlaces = explicitPlaceTags(row);
  if (tagPlaces.length) {
    const place = normaliseExplicitPlace(tagPlaces[0]);
    const text = place.toLowerCase().replace(/[_-]+/g, ' ');
    for (const [needle, location, state] of PLACE_RULES) {
      const normalisedNeedle = needle.toLowerCase().replace(/[_-]+/g, ' ');
      if (text === normalisedNeedle) {
        return {
          location,
          states: [state],
          source: `GHL tag: place:${tagPlaces[0]}`,
          review: 'Source-backed',
        };
      }
    }
    const state = STATE_ALIASES.get(text) || '';
    return {
      location: place,
      states: state ? [state] : ['Unknown'],
      source: `GHL tag: place:${tagPlaces[0]}`,
      review: state ? 'Source-backed' : 'Needs review',
    };
  }

  const orgHistory = orgHistoryLocationFor(row);
  if (orgHistory) return orgHistory;

  return {
    location: 'Unknown',
    states: ['Unknown'],
    source: 'No explicit GHL city, state, or place:* tag in audit row',
    review: 'Unknown',
  };
}

function relationshipOwner(row) {
  const text = textFor(row);
  if (hasToken(text, 'jri', 'reintegration', 'puzzle', 'conference-host')) return 'Hannah/JRI';
  if (hasToken(text, 'flinders', 'tessa', 'university of adelaide')) return 'Tessa/Flinders';
  if (hasToken(text, 'syc', 'foundry', 'unfiltered', 'mcc', 'alrm', 'service')) return 'SYC/service lead';
  if (hasToken(text, 'site', 'venue', 'logistics', 'supplier', 'side-loader', 'side loader', 'signage', 'victoria square')) return 'Nic';
  return 'Ben';
}

function consentStatus(row) {
  if (row.segment === 'Delivery circle: personal only') return 'Personal only';
  if (row.segment === 'VIPs: personal only') return 'Personal only';
  if (row.segment === 'Conference delegates: targeted booking link') return 'Unknown';

  const text = textFor(row);
  const newsletterSignal = has(
    text,
    'newsletter',
    'comms:newsletter',
    'comms:act-newsletter',
    'justicehub-newsletter',
    'goods-newsletter',
    'harvest-newsletter'
  );

  return newsletterSignal ? 'Newsletter OK' : 'Unknown';
}

function newsletterOk(row) {
  if (row.segment === 'Delivery circle: personal only') return false;
  if (row.segment === 'VIPs: personal only') return false;
  if (row.segment === 'Conference delegates: targeted booking link') return false;
  return consentStatus(row) === 'Newsletter OK';
}

function nextAsk(row) {
  if (row.segment === 'Delivery circle: personal only') {
    return 'Personal review complete: confirm delivery role and exact owner before outreach.';
  }
  if (row.segment === 'VIPs: personal only') {
    return 'Personal review complete: personal invite only; keep out of bulk/newsletter.';
  }
  if (row.segment === 'Conference delegates: targeted booking link') {
    return 'Blocked until JRI/Puzzle delegate list or clean GHL tag is imported.';
  }
  if (row.segment === 'Future tour supporters: post-Adelaide update') {
    return newsletterOk(row)
      ? 'Newsletter-suitable after Adelaide recap approval; do not send before recap.'
      : 'Hold for manual relationship check before any future-tour update.';
  }
  return newsletterOk(row)
    ? 'Newsletter-suitable after final content/site/consent approval.'
    : 'Hold: no clear newsletter consent signal after review.';
}

async function fetchPeoplePages() {
  const pages = [];
  let cursor;
  do {
    const res = await notion.dataSources.query({
      data_source_id: PEOPLE_DS,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function updatePageProperties(pageId, properties, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ properties }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Notion update failed ${response.status}: ${body}`);
    }
  } catch (error) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return updatePageProperties(pageId, properties, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function makeAuditLookup(audit) {
  const byId = new Map();
  const byEmail = new Map();
  for (const row of audit.candidates) {
    if (row.ghl_id) byId.set(norm(row.ghl_id), row);
    if (row.email) byEmail.set(norm(row.email), row);
  }
  return { byId, byEmail };
}

async function main() {
  const audit = JSON.parse(await readFile(auditPath, 'utf8'));
  const lookup = makeAuditLookup(audit);
  const pages = await fetchPeoplePages();

  const summary = {
    reviewedAt: new Date().toISOString(),
    pagesFound: pages.length,
    updated: 0,
    missingAuditRow: 0,
    byOwner: {},
    byConsent: {},
    newsletterOk: 0,
    newsletterNo: 0,
    bySegment: {},
    byState: {},
    byLocationReview: {},
    noGhlMutation: true,
  };

  function countReviewed(row, owner, consent, ok, loc) {
    summary.updated++;
    summary.byOwner[owner] = (summary.byOwner[owner] || 0) + 1;
    summary.byConsent[consent] = (summary.byConsent[consent] || 0) + 1;
    summary.bySegment[row.segment] = (summary.bySegment[row.segment] || 0) + 1;
    for (const state of loc.states) summary.byState[state] = (summary.byState[state] || 0) + 1;
    summary.byLocationReview[loc.review] = (summary.byLocationReview[loc.review] || 0) + 1;
    if (ok) summary.newsletterOk++;
    else summary.newsletterNo++;
  }

  for (const page of pages) {
    const ghlId = norm(propText(page, 'GHL ID'));
    const email = norm(propText(page, 'Email'));
    const row = lookup.byId.get(ghlId) || lookup.byEmail.get(email);
    if (!row) {
      summary.missingAuditRow++;
      continue;
    }

    const owner = relationshipOwner(row);
    const consent = consentStatus(row);
    const ok = newsletterOk(row);
    const ask = nextAsk(row);
    const loc = locationFor(row);
    const crmLocation = crmLocationSelectName(loc.location);
    const crmState = crmStateSelectName(loc.states);

    if (propCheckbox(page, 'Manual Review') && !force && !locationsOnly) {
      countReviewed(row, owner, consent, ok, loc);
      continue;
    }

    const properties = locationsOnly
      ? {
          Location: select(crmLocation),
          'State / Region': select(crmState),
          'Location Source': rich(loc.source),
          'Location Review': select(loc.review),
        }
      : {
          'Relationship Owner': select(owner),
          'Consent Status': select(consent),
          'Newsletter OK': checkbox(ok),
          'Manual Review': checkbox(true),
          'Next Ask': rich(ask),
          Location: select(crmLocation),
          'State / Region': select(crmState),
          'Location Source': rich(loc.source),
          'Location Review': select(loc.review),
        };

    await updatePageProperties(page.id, properties);

    countReviewed(row, owner, consent, ok, loc);
    if (summary.updated % 25 === 0) console.log(`Reviewed ${summary.updated}/${pages.length}`);
    await sleep(120);
  }

  await writeFile(reviewOutputPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
