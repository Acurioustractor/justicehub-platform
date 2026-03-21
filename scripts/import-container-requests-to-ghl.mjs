#!/usr/bin/env node
/**
 * Import Container Requests CSV into GoHighLevel
 * Tags: "Container Request", "CONTAINED Newsletter", "CONTAINED Launch 2026"
 * Custom fields: organisation, location, request_type, notes, status, how_found
 */
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

if (!API_KEY || !LOCATION_ID) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID in .env.local');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

const TAGS = ['Container Request', 'CONTAINED Newsletter', 'CONTAINED Launch 2026'];

async function findContact(email) {
  const res = await fetch(
    `${GHL_API_BASE}/contacts/search/duplicate?locationId=${LOCATION_ID}&email=${encodeURIComponent(email)}`,
    { headers }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.contact || null;
}

async function createContact(contact) {
  const res = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locationId: LOCATION_ID,
      ...contact,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create failed: ${err}`);
  }
  return (await res.json()).contact;
}

async function updateContact(id, data) {
  const res = await fetch(`${GHL_API_BASE}/contacts/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  return res.ok;
}

async function addTags(id, tags) {
  const res = await fetch(`${GHL_API_BASE}/contacts/${id}/tags`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags }),
  });
  return res.ok;
}

async function addNote(id, body) {
  const res = await fetch(`${GHL_API_BASE}/contacts/${id}/notes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body, userId: LOCATION_ID }),
  });
  return res.ok;
}

// Rate limit helper — GHL allows ~100 req/min
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const csvPath = process.argv[2] || '/Users/benknight/Downloads/Private & Shared/Container requests support/Container Requests 1aa6ad5f659941b9a9ece3d8a0b287e1_all.csv';
  const raw = readFileSync(csvPath, 'utf-8');
  const records = parse(raw, { columns: true, skip_empty_lines: true, bom: true });

  console.log(`\n=== Importing ${records.length} Container Requests to GHL ===\n`);

  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (const row of records) {
    const email = (row.Email || '').trim();
    const requester = (row.Requester || row.Request || '').trim();
    const org = (row.Organisation || '').trim();
    const location = (row.Location || '').trim();
    const notes = (row.Notes || '').trim();
    const phone = (row.Phone || '').trim();
    const requestType = (row['Request Type'] || '').trim();
    const status = (row.Status || '').trim();
    const how = (row.How || '').trim();
    const requestDate = (row['Requested Date'] || '').trim();
    const targetDate = (row['Target Date'] || '').trim();

    // Skip rows with no email and no name
    if (!email && !requester) {
      console.log(`  SKIP: empty row`);
      skipped++;
      continue;
    }

    // Parse name
    let firstName = '', lastName = '';
    if (requester && !requester.startsWith('http')) {
      const parts = requester.trim().split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    // Build note text
    const noteLines = [];
    if (org) noteLines.push(`Organisation: ${org}`);
    if (location) noteLines.push(`Location: ${location}`);
    if (requestType) noteLines.push(`Request Type: ${requestType}`);
    if (requestDate) noteLines.push(`Requested: ${requestDate}`);
    if (targetDate) noteLines.push(`Target Date: ${targetDate}`);
    if (how) noteLines.push(`How found: ${how}`);
    if (status) noteLines.push(`Status: ${status}`);
    if (notes) noteLines.push(`\nNotes:\n${notes}`);
    const noteBody = `[Container Request Import]\n${noteLines.join('\n')}`;

    // Extra tags based on status/type
    const contactTags = [...TAGS];
    if (status === 'Contacted') contactTags.push('Container - Contacted');
    if (status === 'Scheduled') contactTags.push('Container - Scheduled');
    if (requestType === 'Long-term loan') contactTags.push('Container - Long-term');

    const label = email || requester || '???';

    try {
      if (email) {
        // Try find existing
        const existing = await findContact(email);
        await sleep(300);

        if (existing) {
          // Update + tag
          await updateContact(existing.id, {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phone: phone || undefined,
          });
          await sleep(300);
          await addTags(existing.id, contactTags);
          await sleep(300);
          await addNote(existing.id, noteBody);
          console.log(`  UPDATE: ${label} (${existing.id})`);
          updated++;
        } else {
          // Create new
          const contact = await createContact({
            email,
            firstName,
            lastName,
            phone: phone || undefined,
            tags: contactTags,
            source: 'Container Request CSV',
          });
          await sleep(300);
          await addNote(contact.id, noteBody);
          console.log(`  CREATE: ${label} (${contact.id})`);
          created++;
        }
      } else {
        // No email — create with name only if we have one
        if (firstName) {
          const contact = await createContact({
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@placeholder.contained`,
            firstName,
            lastName,
            phone: phone || undefined,
            tags: [...contactTags, 'No Email'],
            source: 'Container Request CSV',
          });
          await sleep(300);
          await addNote(contact.id, noteBody);
          console.log(`  CREATE (no email): ${label} (${contact.id})`);
          created++;
        } else {
          console.log(`  SKIP: ${label} (no email, no parseable name)`);
          skipped++;
        }
      }
    } catch (err) {
      console.error(`  ERROR: ${label} — ${err.message}`);
      errors++;
    }

    await sleep(300); // rate limit buffer
  }

  console.log(`\n=== Done ===`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`\nAll contacts tagged: ${TAGS.join(', ')}`);
  console.log('Notes include: org, location, request type, dates, how found, status, and their messages.\n');
}

main().catch(console.error);
