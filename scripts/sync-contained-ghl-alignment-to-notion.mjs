#!/usr/bin/env node

/**
 * Sync CONTAINED Adelaide GHL campaign alignment back to the Notion CRM.
 *
 * Source files:
 * - output/ghl-contained-adelaide-audit/contained-ghl-import.csv
 * - output/ghl-contained-adelaide-audit/contained-personal-outreach.csv
 * - output/ghl-contained-adelaide-audit/contained-ghl-preflight-actions.csv
 *
 * This does not invent enrichment. It writes the audited campaign state,
 * newsletter streams, warm signals, GHL tag status, and conflict review status.
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { Client } from '@notionhq/client';

dotenv.config({ path: '.env.local' });

const notionToken =
  process.env.NOTION_API_TOKEN ||
  process.env.NOTION_TOKEN ||
  process.env.JUSTICEHUB_NOTION_TOKEN;

const PEOPLE_DS = '511ebcaa-8d57-4c8c-ae53-00a5c7fd6f59';
const OUT_DIR = path.join(process.cwd(), 'output', 'ghl-contained-adelaide-audit');
const IMPORT_CSV = path.join(OUT_DIR, 'contained-ghl-import.csv');
const PERSONAL_CSV = path.join(OUT_DIR, 'contained-personal-outreach.csv');
const PREFLIGHT_CSV = path.join(OUT_DIR, 'contained-ghl-preflight-actions.csv');
const SUMMARY_JSON = path.join(OUT_DIR, 'notion-ghl-alignment-sync-summary.json');

const dryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : 0;

if (!notionToken) {
  console.error('Missing NOTION_API_TOKEN / NOTION_TOKEN / JUSTICEHUB_NOTION_TOKEN');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function key(value) {
  return clean(value).toLowerCase();
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parse(fs.readFileSync(filePath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function rich(text) {
  return { rich_text: [{ text: { content: clean(text).slice(0, 1900) } }] };
}

function select(name) {
  return name ? { select: { name } } : undefined;
}

function multiSelect(value) {
  const names = Array.isArray(value)
    ? value
    : clean(value).split(/[;,]/).map(clean).filter(Boolean);
  return { multi_select: [...new Set(names)].map((name) => ({ name })) };
}

function checkbox(value) {
  return { checkbox: Boolean(value) };
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

function priorityFor(value) {
  const text = clean(value).toLowerCase();
  if (text.startsWith('a')) return 'A - act now';
  if (text.startsWith('b')) return 'B - targeted';
  if (text.startsWith('c')) return 'C - hold/warm';
  if (text.startsWith('d')) return 'D - future update';
  return '';
}

function preflightStatusFor(action) {
  if (!action) return 'not checked';
  if (action.action === 'review_ghl_id_conflict') return 'pending conflict review';
  if (action.applyResult === 'tags_added') return 'tags added';
  if (action.applyResult === 'dry-run') return 'dry-run only';
  return 'not checked';
}

function campaignStageFor(row, action) {
  if (action?.action === 'review_ghl_id_conflict') return 'GHL conflict review';
  return clean(row['Pipeline Stage']);
}

function mergeRows() {
  const byGhl = new Map();
  const byEmail = new Map();

  function add(row, sourceRank) {
    const merged = {
      ...row,
      sourceRank,
    };
    const ghlId = key(row['GHL ID']);
    const email = key(row.Email);
    if (ghlId && (!byGhl.has(ghlId) || sourceRank >= byGhl.get(ghlId).sourceRank)) byGhl.set(ghlId, merged);
    if (email && (!byEmail.has(email) || sourceRank >= byEmail.get(email).sourceRank)) byEmail.set(email, merged);
  }

  for (const row of readCsv(PERSONAL_CSV)) add(row, 1);
  for (const row of readCsv(IMPORT_CSV)) add(row, 2);

  return { byGhl, byEmail };
}

function preflightMaps() {
  const bySourceGhl = new Map();
  const byMatchedGhl = new Map();
  const byEmail = new Map();

  for (const action of readCsv(PREFLIGHT_CSV)) {
    if (key(action.sourceGhlId)) bySourceGhl.set(key(action.sourceGhlId), action);
    if (key(action.matchedGhlId)) byMatchedGhl.set(key(action.matchedGhlId), action);
    if (key(action.email)) byEmail.set(key(action.email), action);
  }

  return { bySourceGhl, byMatchedGhl, byEmail };
}

async function collectPeoplePages() {
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

function buildProperties(row, action) {
  const stage = campaignStageFor(row, action);
  const preflightStatus = preflightStatusFor(action);
  const priority = priorityFor(row.Priority);
  const properties = {
    Engagement: select(clean(row.Engagement)),
    'Campaign Stage': select(stage),
    'Newsletter Streams': multiSelect(row['Newsletter Streams']),
    'Warm Signals': rich(row['Warm Signals']),
    'GHL Preflight Status': select(preflightStatus),
    'GHL Tags To Add': rich(action?.tagsToAdd || row['Tags To Add']),
    'Next Ask': rich(row['Activation Ask']),
    'Manual Review': checkbox(preflightStatus === 'pending conflict review' || clean(row['Suppression Reason'])),
  };

  if (priority) properties.Priority = select(priority);
  if (clean(row.Segment)) properties.Segment = select(clean(row.Segment));
  if (clean(row['GHL ID'])) properties['GHL ID'] = rich(row['GHL ID']);

  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
}

async function main() {
  const { byGhl, byEmail } = mergeRows();
  const actions = preflightMaps();
  const pages = await collectPeoplePages();
  const scopedPages = limit > 0 ? pages.slice(0, limit) : pages;

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'apply',
    notionPagesScanned: pages.length,
    notionPagesConsidered: scopedPages.length,
    matched: 0,
    updated: 0,
    skippedNoMatch: 0,
    conflictReview: 0,
    tagsAddedStatus: 0,
    dryRunOnlyStatus: 0,
    notCheckedStatus: 0,
    errors: [],
    unmatchedSamples: [],
  };

  for (const [index, page] of scopedPages.entries()) {
    const ghlId = key(propText(page, 'GHL ID'));
    const email = key(propText(page, 'Email'));
    const row = (ghlId && byGhl.get(ghlId)) || (email && byEmail.get(email));

    if (!row) {
      summary.skippedNoMatch++;
      if (summary.unmatchedSamples.length < 12) {
        summary.unmatchedSamples.push({
          name: propText(page, 'Name'),
          email,
          ghlId,
        });
      }
      continue;
    }

    const action = (ghlId && (actions.bySourceGhl.get(ghlId) || actions.byMatchedGhl.get(ghlId))) || (email && actions.byEmail.get(email));
    const preflightStatus = preflightStatusFor(action);
    if (preflightStatus === 'pending conflict review') summary.conflictReview++;
    if (preflightStatus === 'tags added') summary.tagsAddedStatus++;
    if (preflightStatus === 'dry-run only') summary.dryRunOnlyStatus++;
    if (preflightStatus === 'not checked') summary.notCheckedStatus++;

    summary.matched++;
    if (!dryRun) {
      try {
        await notion.pages.update({
          page_id: page.id,
          properties: buildProperties(row, action),
        });
        summary.updated++;
        await sleep(120);
      } catch (error) {
        summary.errors.push({
          pageId: page.id,
          name: propText(page, 'Name'),
          email,
          message: error.message,
        });
      }
    }

    if ((index + 1) % 50 === 0) {
      console.log(`${dryRun ? 'Checked' : 'Updated'} ${index + 1}/${scopedPages.length}`);
    }
  }

  fs.writeFileSync(SUMMARY_JSON, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();
