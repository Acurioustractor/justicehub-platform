#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

async function checkGHL() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  console.log('GoHighLevel Status Check');
  console.log('========================\n');

  if (!apiKey) {
    console.log('GHL_API_KEY: MISSING');
  } else {
    console.log('GHL_API_KEY: Configured');
  }

  if (!locationId) {
    console.log('GHL_LOCATION_ID: MISSING');
  } else {
    console.log('GHL_LOCATION_ID: Configured');
  }

  if (!apiKey || !locationId) {
    console.log('\nAdd these to .env.local to enable GHL integration');
    return;
  }

  console.log('\nFetching contacts from GHL...');

  try {
    const response = await fetch(
      `${GHL_API_BASE}/contacts/?locationId=${locationId}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Version: '2021-07-28',
        },
      }
    );

    if (!response.ok) {
      console.log('API Error:', response.status, await response.text());
      return;
    }

    const data = await response.json();
    console.log('Total contacts in first page:', data.contacts?.length || 0);
    console.log('Has more pages:', !!data.meta?.nextPageUrl);

    // Count tags
    const tagCounts = {};
    (data.contacts || []).forEach(c => {
      (c.tags || []).forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    if (Object.keys(tagCounts).length > 0) {
      console.log('\nTop tags:');
      Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([tag, count]) => console.log(`  - ${tag}: ${count}`));
    }

    // Show sample contacts
    if (data.contacts?.length > 0) {
      console.log('\nSample contacts:');
      data.contacts.slice(0, 5).forEach(c => {
        console.log(`  - ${c.email} (tags: ${(c.tags || []).join(', ') || 'none'})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkGHL();
