#!/usr/bin/env node

import dotenv from 'dotenv';
import db from '../src/config/database.js';

dotenv.config();

console.log('Adding attribution support to database...\n');

async function addAttributionSupport() {
  try {
    console.log('Adding attribution column to services table...');
    
    // Check if column exists first
    const hasAttribution = await db.schema.hasColumn('services', 'attribution');
    
    if (!hasAttribution) {
      await db.schema.alterTable('services', table => {
        table.json('attribution');
      });
      console.log('✅ Added attribution column');
    } else {
      console.log('ℹ️  Attribution column already exists');
    }

    // Check if ABN column exists
    const hasABN = await db.schema.hasColumn('organizations', 'abn');
    
    if (!hasABN) {
      await db.schema.alterTable('organizations', table => {
        table.string('abn', 50);
      });
      console.log('✅ Added ABN column to organizations');
    } else {
      console.log('ℹ️  ABN column already exists');
    }

    console.log('\n✅ Database migration completed!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

addAttributionSupport();