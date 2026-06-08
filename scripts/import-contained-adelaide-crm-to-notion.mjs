#!/usr/bin/env node
import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import { Client } from '@notionhq/client';

dotenv.config({ path: '.env.local' });

const notionToken =
  process.env.NOTION_API_TOKEN ||
  process.env.NOTION_TOKEN ||
  process.env.JUSTICEHUB_NOTION_TOKEN;

const PEOPLE_DB = '511ebcaa-8d57-4c8c-ae53-00a5c7fd6f59';
const ORGS_DB = 'bd11b5bc-5ae2-43c5-ab5f-3c52bb8199d1';
const INTERACTIONS_DB = '2d8a5581-d9b8-48b4-9c4e-11f86d0dc819';
const SEGMENTS_DB = '6ec637d3-6f7c-4925-84d6-19817dafd9f6';
const SENDS_DB = '7667938a-31f5-438a-8d16-3a8f55d355ca';

const auditPath = 'output/ghl-contained-adelaide-audit/segments.json';

if (!notionToken) {
  console.error('Missing NOTION_API_TOKEN / NOTION_TOKEN / JUSTICEHUB_NOTION_TOKEN');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function rich(text) {
  return { rich_text: [{ text: { content: String(text || '').slice(0, 1900) } }] };
}

function title(text) {
  return { title: [{ text: { content: String(text || 'Untitled').slice(0, 1900) } }] };
}

function email(value) {
  return value ? { email: value } : { email: null };
}

function select(name) {
  return name ? { select: { name } } : { select: null };
}

function multiSelect(names) {
  return { multi_select: [...new Set(names.filter(Boolean))].map((name) => ({ name })) };
}

function checkbox(value) {
  return { checkbox: Boolean(value) };
}

function date(value) {
  return value ? { date: { start: value } } : { date: null };
}

async function collectExisting(databaseId, propertyName) {
  const values = new Set();
  let cursor;
  do {
    const res = await notion.dataSources.query({
      data_source_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      const prop = page.properties[propertyName];
      if (!prop) continue;
      if (prop.type === 'rich_text') {
        const value = prop.rich_text.map((part) => part.plain_text).join('').trim().toLowerCase();
        if (value) values.add(value);
      }
      if (prop.type === 'email' && prop.email) values.add(prop.email.trim().toLowerCase());
      if (prop.type === 'title') {
        const value = prop.title.map((part) => part.plain_text).join('').trim().toLowerCase();
        if (value) values.add(value);
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return values;
}

function roleTypes(row) {
  const text = `${row.segment} ${row.tags} ${row.company} ${row.source}`.toLowerCase();
  const roles = [];
  if (text.includes('funder') || text.includes('philanthropy')) roles.push('funder');
  if (text.includes('media') || text.includes('journalist')) roles.push('media');
  if (text.includes('policy') || text.includes('minister') || text.includes('parliament') || text.includes('mp')) roles.push('politician');
  if (text.includes('court') || text.includes('legal') || text.includes('law')) roles.push('court/legal');
  if (text.includes('university') || text.includes('flinders') || text.includes('uwa') || text.includes('rmit')) roles.push('university');
  if (text.includes('service') || text.includes('syc') || text.includes('mcc') || text.includes('alrm')) roles.push('service');
  if (text.includes('delegate') || text.includes('conference')) roles.push('conference delegate');
  if (text.includes('future') || text.includes('container-request') || text.includes('next-city')) roles.push('future city lead');
  if (roles.length === 0) roles.push('supporter');
  return roles;
}

function priorityFor(segment) {
  if (segment.startsWith('Delivery')) return 'A - act now';
  if (segment.startsWith('VIP')) return 'A - act now';
  if (segment.startsWith('Conference')) return 'B - targeted';
  if (segment.startsWith('Future')) return 'D - future update';
  return 'C - hold/warm';
}

function consentFor(segment) {
  if (segment.includes('personal only')) return 'Personal only';
  return 'Unknown';
}

function nextAskFor(segment) {
  if (segment.startsWith('Delivery')) return 'Confirm role, owner, and whether this remains personal-only.';
  if (segment.startsWith('VIP')) return 'Assign relationship owner and send personal invitation only.';
  if (segment.startsWith('Conference')) return 'Send targeted booking link once delegate list is approved.';
  if (segment.startsWith('Future')) return 'Hold for approved Adelaide recap and next-city ask.';
  return 'Manual relevance review before any newsletter or workflow send.';
}

async function createPage(databaseId, properties) {
  await notion.pages.create({
    parent: { data_source_id: databaseId },
    properties,
  });
  await sleep(120);
}

async function seedSegments() {
  const existing = await collectExisting(SEGMENTS_DB, 'Segment');
  const rows = [
    {
      name: 'Delivery circle: personal only',
      purpose: 'People directly involved in delivering site, consent, build, host, support, partner, and logistics decisions.',
      rule: 'Personal only',
      channel: ['Gmail/personal', 'Phone', 'Manual'],
      gate: 'Relationship owner confirms role before any message.',
      owner: 'Ben',
      status: 'Locked',
    },
    {
      name: 'VIPs: personal only',
      purpose: 'Decision-makers, courts/legal, funders, media, senior service leaders, and political targets.',
      rule: 'Personal only',
      channel: ['Gmail/personal', 'Phone'],
      gate: 'Pull from bulk; personal invite only after site/consent line is stable.',
      owner: 'Ben',
      status: 'Locked',
    },
    {
      name: 'Conference delegates: targeted booking link',
      purpose: 'Puzzle delegates and supporters who need a direct cohort booking path.',
      rule: 'Targeted booking link',
      channel: ['GHL email', 'Gmail/personal'],
      gate: 'Requires JRI/Puzzle delegate import or manual approved list.',
      owner: 'Hannah/JRI',
      status: 'Blocked',
    },
    {
      name: 'Public/warm list: only after audit',
      purpose: 'Newsletter-safe warm audience after suppression, VIP removal, content approval, and relevance review.',
      rule: 'Newsletter after audit',
      channel: ['GHL email', 'JusticeHub newsletter'],
      gate: 'DND/unsub/test removed, VIPs removed, site/consent/content approved.',
      owner: 'Ben',
      status: 'Needs review',
    },
    {
      name: 'Future tour supporters: post-Adelaide update',
      purpose: 'People connected to Perth, Victoria/Melbourne, and other future tour asks.',
      rule: 'Post-event update',
      channel: ['GHL email', 'JusticeHub newsletter'],
      gate: 'Send only after approved Adelaide recap.',
      owner: 'Ben',
      status: 'Hold',
    },
  ];

  let created = 0;
  for (const row of rows) {
    if (existing.has(row.name.toLowerCase())) continue;
    await createPage(SEGMENTS_DB, {
      Segment: title(row.name),
      Purpose: rich(row.purpose),
      'Send Rule': select(row.rule),
      'Default Channel': multiSelect(row.channel),
      'Approval Gate': rich(row.gate),
      Owner: select(row.owner),
      Status: select(row.status),
      Notes: rich('Seeded by CONTAINED Adelaide CRM build.'),
    });
    created++;
  }
  return created;
}

async function seedOrganisations() {
  const existing = await collectExisting(ORGS_DB, 'Organisation');
  const rows = [
    ['Justice Reform Initiative', ['conference', 'service'], 'Adelaide / national', 'Puzzle integration, delegate flow, JRI wording.', 'Confirm delegate pathway and co-branding boundaries.', 'Active', 'Ben'],
    ['SYC / Foundry / Unfiltered', ['youth org', 'service'], 'Adelaide SA', 'Young-person consent, support, and local youth pathway.', 'Confirm consent/support route before claims or media.', 'Warm', 'Ben'],
    ['Flinders University', ['university'], 'Adelaide SA', 'Student/service pathway and local evidence/reflection.', 'Confirm Tessa/Julia/Eloise roles and student window.', 'Warm', 'Ben'],
    ['Mounty Yarns', ['youth org'], 'Mount Druitt NSW', 'Room 1 story/materials and youth-led build proof.', 'Confirm materials and Adelaide role with Daniel.', 'Warm', 'Ben'],
    ['Diagrama Foundation', ['service'], 'Spain / UK', 'Room 2 wording and therapeutic model accuracy.', 'Confirm approved wording and session role.', 'Warm', 'Ben'],
    ['Hilton Adelaide / Reintegration Puzzle', ['conference', 'venue/site'], 'Adelaide SA', 'Conference context and delegate movement path.', 'Confirm host flow from conference to Victoria Square.', 'Warm', 'Hannah/JRI'],
    ['Victoria Square site pathway', ['venue/site', 'government'], 'Tandanya/Adelaide SA', 'Public site, signage, permissions, safety.', 'Confirm permission and site rules before public details.', 'Not started', 'Nic'],
    ['Minderoo Foundation', ['funder', 'future city partner'], 'WA / national', 'Funding and Perth tour path.', 'Hold for Adelaide proof and Perth ask.', 'Warm', 'Ben'],
    ['University of Western Australia', ['university', 'future city partner'], 'Perth WA', 'Perth host/research pathway.', 'Send Adelaide recap and host ask.', 'Warm', 'Ben'],
    ['Reconciliation WA', ['future city partner'], 'Perth WA', 'WA legitimacy and community connector.', 'Ask for cultural/community connector after Adelaide.', 'Warm', 'Ben'],
    ['St Martins Youth Arts Centre', ['youth org', 'future city partner'], 'Melbourne VIC', 'Victoria/Melbourne youth arts pathway.', 'Hold for Victoria partnership ask.', 'Warm', 'Ben'],
    ['RMIT', ['university', 'future city partner'], 'Melbourne VIC', 'Victoria academic/evidence spine.', 'Hold for post-Adelaide research ask.', 'Not started', 'Ben'],
  ];

  let created = 0;
  for (const [name, type, city, role, ask, status, owner] of rows) {
    if (existing.has(name.toLowerCase())) continue;
    await createPage(ORGS_DB, {
      Organisation: title(name),
      Type: multiSelect(type),
      'City/State': rich(city),
      'Role in CONTAINED': rich(role),
      Ask: rich(ask),
      Status: select(status),
      'Relationship Owner': select(owner),
      Notes: rich('Seeded from Adelaide command plan and verified source trail.'),
    });
    created++;
  }
  return created;
}

async function seedCampaignSends() {
  const existing = await collectExisting(SENDS_DB, 'Send');
  const rows = [
    ['Personal delivery lock-in', 'Delivery circle: personal only', 'Confirm delivery role and risk owner.', 'Confirm your role/constraint for Adelaide.', ['Gmail/personal', 'Phone'], 'Needs approval', 'Ben'],
    ['VIP walkthrough invitation', 'VIPs: personal only', 'Move priority decision-makers into hosted walkthroughs.', 'Book/request a hosted VIP walkthrough.', ['Gmail/personal'], 'Draft', 'Ben'],
    ['Conference delegate booking link', 'Conference delegates: targeted booking link', 'Move Puzzle delegates from conference to Victoria Square.', 'Book a hosted conference walkthrough.', ['GHL email', 'Gmail/personal'], 'Blocked', 'Ben'],
    ['Public bookings open', 'Public/warm list: only after audit', 'Invite audited warm list after site and consent approval.', 'Book, nominate, or support one clear pathway.', ['GHL email', 'JusticeHub newsletter'], 'Blocked', 'Ben'],
    ['Adelaide recap and next city ask', 'Future tour supporters: post-Adelaide update', 'Turn Adelaide proof into Perth/Victoria pathway.', 'Host, fund, or connect the next stop.', ['GHL email', 'JusticeHub newsletter'], 'Draft', 'Ben'],
  ];

  let created = 0;
  for (const [name, segment, purpose, ask, channel, status, owner] of rows) {
    if (existing.has(name.toLowerCase())) continue;
    await createPage(SENDS_DB, {
      Send: title(name),
      'Audience Segment': select(segment),
      Purpose: rich(purpose),
      'One Ask': rich(ask),
      Channel: multiSelect(channel),
      'Approval Status': select(status),
      'GHL Workflow/Tag': rich('Not configured. Do not trigger until approved.'),
      'Exclusions Checked': checkbox(false),
      Results: rich(''),
      Owner: select(owner),
    });
    created++;
  }
  return created;
}

async function seedImportInteraction(summary) {
  const existing = await collectExisting(INTERACTIONS_DB, 'Interaction');
  const name = `GHL Adelaide CRM export ${summary.fetchedAt.slice(0, 10)}`;
  if (existing.has(name.toLowerCase())) return 0;
  await createPage(INTERACTIONS_DB, {
    Interaction: title(name),
    Date: date(summary.fetchedAt.slice(0, 10)),
    Channel: select('GHL'),
    'Person/Org': rich('GHL contact export'),
    Summary: rich(`Fetched ${summary.totalFetched} contacts; imported ${summary.targetCandidatesAfterExclusionsAndDedupe} active target contacts after exclusions and dedupe.`),
    Outcome: rich(`${summary.excluded} excluded; ${summary.duplicatesRemoved} duplicates removed. No GHL mutations made.`),
    'Next Action': rich('Manual review of delivery circle, VIPs, and public/warm relevance before any send.'),
    Owner: select('Ben'),
    Status: select('Done'),
  });
  return 1;
}

async function importPeople(audit) {
  const existingIds = await collectExisting(PEOPLE_DB, 'GHL ID');
  const existingEmails = await collectExisting(PEOPLE_DB, 'Email');
  let created = 0;
  let skipped = 0;

  for (const row of audit.candidates) {
    const ghlId = String(row.ghl_id || '').trim().toLowerCase();
    const rowEmail = String(row.email || '').trim().toLowerCase();
    if ((ghlId && existingIds.has(ghlId)) || (rowEmail && existingEmails.has(rowEmail))) {
      skipped++;
      continue;
    }
    const rowName = row.name || row.company || row.email || row.ghl_id || 'Unknown contact';
    await createPage(PEOPLE_DB, {
      Name: title(rowName),
      Email: email(row.email),
      Organisation: rich(row.company),
      'Role Type': multiSelect(roleTypes(row)),
      'Relationship Owner': select('Unknown'),
      Segment: select(row.segment),
      'GHL ID': rich(row.ghl_id),
      'GHL Tags': rich(row.tags),
      'DND Status': select(row.dnd === 'true' ? 'DND true' : 'DND false'),
      'Consent Status': select(consentFor(row.segment)),
      Priority: select(priorityFor(row.segment)),
      'Next Ask': rich(nextAskFor(row.segment)),
      Source: multiSelect(['GHL']),
      'Manual Review': checkbox(false),
      'Newsletter OK': checkbox(false),
    });
    existingIds.add(ghlId);
    if (rowEmail) existingEmails.add(rowEmail);
    created++;
  }
  return { created, skipped };
}

async function main() {
  const audit = JSON.parse(await readFile(auditPath, 'utf8'));
  const summary = JSON.parse(await readFile('output/ghl-contained-adelaide-audit/summary.json', 'utf8'));

  console.log('Seeding CONTAINED CRM Notion system...');
  const segmentsCreated = await seedSegments();
  const orgsCreated = await seedOrganisations();
  const sendsCreated = await seedCampaignSends();
  const interactionsCreated = await seedImportInteraction(summary);
  const people = await importPeople(audit);

  console.log(JSON.stringify({
    segmentsCreated,
    orgsCreated,
    sendsCreated,
    interactionsCreated,
    peopleCreated: people.created,
    peopleSkippedExisting: people.skipped,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
