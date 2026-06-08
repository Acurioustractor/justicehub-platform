#!/usr/bin/env node
import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

dotenv.config({ path: '.env.local' });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;

const outputDir = path.join('output', 'ghl-contained-adelaide-audit');
const maxContacts = Number.parseInt(process.env.GHL_EXPORT_MAX_CONTACTS || '20000', 10);

const targetNeedles = [
  'contained',
  'justicehub',
  'justice hub',
  'adelaide',
  'newsletter',
  'jri',
  'reintegration',
  'puzzle',
  'flinders',
  'syc',
  'mounty',
  'diagrama',
];

const deliveryNeedles = [
  'delivery',
  'site',
  'host',
  'jri',
  'flinders',
  'syc',
  'mounty',
  'diagrama',
  'contained_adelaide',
  'contained-adelaide',
];

const vipNeedles = [
  'vip',
  'minister',
  'mp',
  'parliament',
  'judge',
  'court',
  'funder',
  'philanthropy',
  'media',
  'policy',
  'public servant',
  'senior',
  'contained_funder',
  'contained_media',
];

const conferenceNeedles = [
  'conference',
  'delegate',
  'jri',
  'reintegration',
  'puzzle',
  'speaker',
  'sponsor',
  'cohort_conference_delegate',
];

const futureTourNeedles = [
  'perth',
  'uwa',
  'state_wa',
  'western australia',
  'victoria',
  'melbourne',
  'state_vic',
  'brisbane',
  'state_qld',
  'queensland',
  'canberra',
  'state_act',
  'tasmania',
  'state_tas',
  'northern territory',
  'state_nt',
  'alice',
  'future',
  'tour',
  'host',
  'container request',
  'contained-original-requester',
  'next-city',
  'cohort_next_city',
];

const exclusionNeedles = [
  'unsubscribe',
  'unsubscribed',
  'dnd',
  'do not contact',
  'do-not-contact',
  'do not blast',
  'do-not-blast',
  'spam',
  'bounce',
  'bounced',
  'test',
  'internal-test',
  'fake',
];

if (!apiKey || !locationId) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID in .env.local');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

function norm(value) {
  return String(value || '').trim().toLowerCase();
}

function textFor(contact) {
  return [
    contact.email,
    contact.contactName,
    contact.firstName,
    contact.lastName,
    contact.companyName,
    contact.source,
    contact.type,
    contact.city,
    contact.state,
    ...(contact.tags || []),
    ...(contact.customFields || []).flatMap((field) => [
      field.name,
      field.key,
      field.field_value,
      field.value,
    ]),
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasNeedle(text, needles) {
  return needles.some((needle) => {
    const escaped = needle
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\ /g, '[\\s_-]+');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
  });
}

function dndReason(contact, text) {
  if (contact.dnd === true) return 'dnd=true';
  if (contact.dndSettings && Object.keys(contact.dndSettings).length > 0) {
    const settings = JSON.stringify(contact.dndSettings).toLowerCase();
    if (!settings.includes('"status":"active"')) return `dndSettings=${settings}`;
  }
  if (hasNeedle(text, exclusionNeedles)) return 'exclusion tag/text';
  return '';
}

function isLikelyTest(contact, text) {
  const email = norm(contact.email);
  return (
    email.includes('test@') ||
    email.endsWith('@example.com') ||
    email.includes('+test') ||
    text.includes(' test ') ||
    text.includes('internal-test') ||
    text.includes(' fake ')
  );
}

function cleanName(contact) {
  const full = contact.contactName || [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  return full || '';
}

function rowFor(contact, segment, reason) {
  return {
    segment,
    reason,
    ghl_id: contact.id || '',
    email: norm(contact.email),
    name: cleanName(contact),
    company: contact.companyName || '',
    phone: contact.phone || '',
    city: contact.city || '',
    state: contact.state || '',
    source: contact.source || '',
    dnd: contact.dnd === true ? 'true' : 'false',
    tags: (contact.tags || []).join('; '),
    date_added: contact.dateAdded || '',
    date_updated: contact.dateUpdated || '',
  };
}

function assignSegment(contact) {
  const text = textFor(contact);
  if (hasNeedle(text, deliveryNeedles)) {
    return ['Delivery circle: personal only', 'delivery/partner tag or Adelaide operating signal'];
  }
  if (hasNeedle(text, vipNeedles)) {
    return ['VIPs: personal only', 'VIP, policy, media, funder, legal, or senior signal'];
  }
  if (hasNeedle(text, conferenceNeedles)) {
    return ['Conference delegates: targeted booking link', 'conference/JRI/Reintegration Puzzle signal'];
  }
  if (hasNeedle(text, futureTourNeedles)) {
    return ['Future tour supporters: post-Adelaide update', 'future city, host, tour, or original requester signal'];
  }
  return ['Public/warm list: only after audit', 'target tag but no stronger segment signal'];
}

async function fetchAllContacts() {
  const contacts = [];
  let nextPageUrl = `${GHL_API_BASE}/contacts/?locationId=${locationId}&limit=100`;

  while (nextPageUrl) {
    process.stdout.write(`\rFetching GHL contacts... ${contacts.length}`);
    const response = await fetch(nextPageUrl, { headers });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GHL API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    contacts.push(...(data.contacts || []));
    nextPageUrl = data.meta?.nextPageUrl || null;

    if (contacts.length >= maxContacts) {
      console.warn(`\nHit GHL_EXPORT_MAX_CONTACTS=${maxContacts}; stopping early.`);
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log(`\rFetched GHL contacts: ${contacts.length}       `);
  return contacts;
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows) {
  const headers = [
    'segment',
    'reason',
    'ghl_id',
    'email',
    'name',
    'company',
    'phone',
    'city',
    'state',
    'source',
    'dnd',
    'tags',
    'date_added',
    'date_updated',
  ];
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(',')),
  ].join('\n');
}

async function main() {
  const allContacts = await fetchAllContacts();
  const fetchedAt = new Date().toISOString();
  const candidates = [];
  const excluded = [];
  const duplicates = [];
  const seenEmails = new Map();
  const seenIds = new Set();

  for (const contact of allContacts) {
    const text = textFor(contact);
    if (!hasNeedle(text, targetNeedles)) continue;

    const email = norm(contact.email);
    const noSendReason = dndReason(contact, text) || (isLikelyTest(contact, text) ? 'test/fake contact' : '');
    if (noSendReason) {
      excluded.push(rowFor(contact, 'Excluded from send', noSendReason));
      continue;
    }

    if (email) {
      if (seenEmails.has(email)) {
        duplicates.push(rowFor(contact, 'Duplicate removed', `duplicate email; kept ${seenEmails.get(email)}`));
        continue;
      }
      seenEmails.set(email, contact.id || '');
    } else if (contact.id) {
      if (seenIds.has(contact.id)) {
        duplicates.push(rowFor(contact, 'Duplicate removed', 'duplicate GHL ID'));
        continue;
      }
    }

    if (contact.id) seenIds.add(contact.id);
    const [segment, reason] = assignSegment(contact);
    candidates.push(rowFor(contact, segment, reason));
  }

  const segmentOrder = [
    'Delivery circle: personal only',
    'VIPs: personal only',
    'Conference delegates: targeted booking link',
    'Public/warm list: only after audit',
    'Future tour supporters: post-Adelaide update',
  ];

  candidates.sort((a, b) => {
    const segmentDiff = segmentOrder.indexOf(a.segment) - segmentOrder.indexOf(b.segment);
    if (segmentDiff !== 0) return segmentDiff;
    return (a.name || a.email).localeCompare(b.name || b.email);
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'segments.csv'), toCsv(candidates));
  await writeFile(path.join(outputDir, 'excluded.csv'), toCsv(excluded));
  await writeFile(path.join(outputDir, 'duplicates.csv'), toCsv(duplicates));
  await writeFile(path.join(outputDir, 'segments.json'), JSON.stringify({ fetchedAt, candidates, excluded, duplicates }, null, 2));

  const bySegment = Object.fromEntries(segmentOrder.map((segment) => [segment, 0]));
  for (const row of candidates) bySegment[row.segment] = (bySegment[row.segment] || 0) + 1;

  const summary = {
    fetchedAt,
    totalFetched: allContacts.length,
    targetCandidatesAfterExclusionsAndDedupe: candidates.length,
    excluded: excluded.length,
    duplicatesRemoved: duplicates.length,
    bySegment,
    files: {
      segmentsCsv: path.join(outputDir, 'segments.csv'),
      excludedCsv: path.join(outputDir, 'excluded.csv'),
      duplicatesCsv: path.join(outputDir, 'duplicates.csv'),
      fullJson: path.join(outputDir, 'segments.json'),
    },
    filter: {
      targetNeedles,
      exclusionNeedles,
      dedupeOrder: ['email', 'GHL ID'],
    },
  };

  await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
