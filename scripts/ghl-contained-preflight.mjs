#!/usr/bin/env node

/**
 * Live GHL preflight for the CONTAINED Adelaide import.
 *
 * Default mode is read-only:
 *   npm run contained:ghl:preflight
 *
 * Optional mutation, deliberately narrow:
 *   npm run contained:ghl:preflight -- --apply-tags
 *
 * This script does not merge/delete contacts. It identifies likely duplicates
 * and prepares create/update/tag actions for review.
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

dotenv.config({ path: '.env.local' });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;
const OUT_DIR = path.join(process.cwd(), 'output', 'ghl-contained-adelaide-audit');
const IMPORT_CSV = path.join(OUT_DIR, 'contained-ghl-import.csv');
const ACTIONS_CSV = path.join(OUT_DIR, 'contained-ghl-preflight-actions.csv');
const ACTIONS_JSON = path.join(OUT_DIR, 'contained-ghl-preflight-actions.json');

const args = new Set(process.argv.slice(2));
const applyTags = args.has('--apply-tags');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : 0;

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function csvEscape(value) {
  const text = clean(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath, rows, columns) {
  const body = [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${body}\n`);
}

function splitTags(value) {
  return clean(value)
    .split(/[;,]/)
    .map((tag) => clean(tag))
    .filter(Boolean);
}

async function ghlFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  }

  return data;
}

async function findDuplicateByEmail(email) {
  if (!email) return null;
  const url = `${GHL_API_BASE}/contacts/search/duplicate?locationId=${encodeURIComponent(locationId)}&email=${encodeURIComponent(email)}`;
  const data = await ghlFetch(url, { method: 'GET' });
  return data?.contact || null;
}

async function addTags(contactId, tags) {
  if (!contactId || tags.length === 0) return false;
  await ghlFetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags }),
  });
  return true;
}

function loadRows() {
  const input = fs.readFileSync(IMPORT_CSV, 'utf8');
  return parse(input, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function localDuplicateGroups(rows) {
  const byEmail = new Map();
  const byPhone = new Map();

  for (const row of rows) {
    const email = clean(row.Email).toLowerCase();
    const phone = clean(row.Phone).replace(/[^\d+]/g, '');
    if (email) byEmail.set(email, [...(byEmail.get(email) || []), row]);
    if (phone) byPhone.set(phone, [...(byPhone.get(phone) || []), row]);
  }

  return {
    emailDuplicates: [...byEmail.entries()].filter(([, group]) => group.length > 1),
    phoneDuplicates: [...byPhone.entries()].filter(([, group]) => group.length > 1),
  };
}

function actionFor(row, duplicate) {
  const sourceGhlId = clean(row['GHL ID']);
  const matchedGhlId = clean(duplicate?.id);
  const hasIdConflict = Boolean(sourceGhlId && matchedGhlId && sourceGhlId !== matchedGhlId);
  const existingId = hasIdConflict ? '' : sourceGhlId || matchedGhlId;
  const suggestedTags = splitTags(row['Tags To Add']);
  const existingTags = Array.isArray(duplicate?.tags) ? duplicate.tags.map(clean).filter(Boolean) : [];
  const existingTagSet = new Set(existingTags.map((tag) => tag.toLowerCase()));
  const tagsToAdd = suggestedTags.filter((tag) => !existingTagSet.has(tag.toLowerCase()));

  const action = hasIdConflict
    ? 'review_ghl_id_conflict'
    : duplicate || sourceGhlId
      ? 'update_existing_and_tag'
      : 'create_new_contact';
  const risk = hasIdConflict
    ? 'ghl_id_conflict'
    : clean(row['Suppression Reason'])
      ? 'suppressed'
      : duplicate
        ? 'matched_by_email'
        : 'new_email';

  return {
    action,
    risk,
    email: clean(row.Email).toLowerCase(),
    name: clean(row['Full Name']),
    company: clean(row.Company),
    sourceGhlId,
    matchedGhlId,
    targetGhlId: existingId,
    pipelineStage: clean(row['Pipeline Stage']),
    priority: clean(row.Priority),
    newsletterStreams: clean(row['Newsletter Streams']),
    tagsToAdd: tagsToAdd.join('; '),
    existingTagCount: existingTags.length,
    applied: 'no',
    applyResult: applyTags ? 'pending' : 'dry-run',
  };
}

async function main() {
  if (!apiKey || !locationId) {
    throw new Error('Missing GHL_API_KEY or GHL_LOCATION_ID in .env.local');
  }
  if (!fs.existsSync(IMPORT_CSV)) {
    throw new Error(`Missing ${IMPORT_CSV}. Run npm run contained:ghl:prepare first.`);
  }

  const rows = loadRows();
  const scopedRows = limit > 0 ? rows.slice(0, limit) : rows;
  const localDupes = localDuplicateGroups(rows);
  const actions = [];

  for (const [index, row] of scopedRows.entries()) {
    const email = clean(row.Email).toLowerCase();
    let duplicate = null;
    let lookupError = '';
    try {
      duplicate = await findDuplicateByEmail(email);
    } catch (error) {
      lookupError = error.message;
    }

    const action = actionFor(row, duplicate);
    action.lookupError = lookupError;

    if (applyTags && action.targetGhlId && action.tagsToAdd && !lookupError) {
      try {
        await addTags(action.targetGhlId, splitTags(action.tagsToAdd));
        action.applied = 'yes';
        action.applyResult = 'tags_added';
      } catch (error) {
        action.applied = 'no';
        action.applyResult = error.message;
      }
    }

    actions.push(action);

    if ((index + 1) % 25 === 0) {
      console.log(`Checked ${index + 1}/${scopedRows.length}`);
    }
  }

  const columns = [
    'action', 'risk', 'email', 'name', 'company', 'sourceGhlId', 'matchedGhlId', 'targetGhlId',
    'pipelineStage', 'priority', 'newsletterStreams', 'tagsToAdd', 'existingTagCount',
    'applied', 'applyResult', 'lookupError',
  ];

  writeCsv(ACTIONS_CSV, actions, columns);
  fs.writeFileSync(ACTIONS_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: applyTags ? 'apply-tags' : 'dry-run',
    inputRows: rows.length,
    checkedRows: scopedRows.length,
    outputCsv: ACTIONS_CSV,
    localDuplicateSummary: {
      emailDuplicateGroups: localDupes.emailDuplicates.length,
      phoneDuplicateGroups: localDupes.phoneDuplicates.length,
      emailDuplicates: localDupes.emailDuplicates.map(([email, group]) => ({ email, count: group.length, names: group.map((row) => row['Full Name']) })),
      phoneDuplicates: localDupes.phoneDuplicates.map(([phone, group]) => ({ phone, count: group.length, names: group.map((row) => row['Full Name']) })),
    },
    actionCounts: actions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {}),
    riskCounts: actions.reduce((acc, action) => {
      acc[action.risk] = (acc[action.risk] || 0) + 1;
      return acc;
    }, {}),
    appliedCounts: actions.reduce((acc, action) => {
      acc[action.applyResult] = (acc[action.applyResult] || 0) + 1;
      return acc;
    }, {}),
  }, null, 2));

  console.log(JSON.stringify(JSON.parse(fs.readFileSync(ACTIONS_JSON, 'utf8')), null, 2));
}

main();
