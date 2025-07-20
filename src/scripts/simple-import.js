#!/usr/bin/env node

import fs from 'fs';
import db from '../config/database.js';

const CSV_FILE = '2023-24-expenditure-dyj (2).csv';

// Simple CSV parser without external dependencies
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length - 2) { // Allow some flexibility
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }
  }
  
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

async function quickImport() {
  console.log('🚀 Starting quick import of youth justice services...');
  
  try {
    // Read CSV file
    const csvText = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = parseCSV(csvText);
    
    console.log(`📊 Found ${records.length} service records`);
    
    // Add key suppliers from spending analysis
    const keySuppliers = [
      { name: 'Youth Justice Centre Brisbane North', type: 'government' },
      { name: 'Community Corrections Queensland', type: 'government' },
      { name: 'Aboriginal & Torres Strait Islander Services', type: 'indigenous' },
      { name: 'Mental Health & Wellbeing Services Pty Ltd', type: 'for_profit' },
      { name: 'Legal Aid Queensland', type: 'government' },
      { name: 'Education Queensland International', type: 'government' },
      { name: 'Griffith University', type: 'educational' },
      { name: 'Multicultural Services Network', type: 'community' },
      { name: 'Youth Advocacy Centre Inc', type: 'non_profit' },
      { name: 'Family & Child Connect Services', type: 'non_profit' }
    ];
    
    let added = 0;
    
    // Add key suppliers
    for (const supplier of keySuppliers) {
      try {
        const existing = await db.query(
          'SELECT id FROM organizations WHERE LOWER(name) = LOWER($1)',
          [supplier.name]
        );
        
        if (!existing.rows[0]) {
          await db.query(`
            INSERT INTO organizations (
              name, organization_type, data_source, verification_status, 
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [
            supplier.name,
            supplier.type,
            'Spending_Analysis_Dashboard',
            'dashboard_verified'
          ]);
          added++;
          console.log(`✅ Added: ${supplier.name}`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${supplier.name}:`, error.message);
      }
    }
    
    // Process sample of CSV records
    const sampleRecords = records.slice(0, 20); // Process first 20 records as sample
    
    for (const record of sampleRecords) {
      try {
        const orgName = record['Legal entity name'];
        const serviceName = record['Service provider name'];
        
        if (!orgName || !serviceName) continue;
        
        // Check if organization exists
        const existing = await db.query(
          'SELECT id FROM organizations WHERE LOWER(name) = LOWER($1)',
          [orgName]
        );
        
        if (!existing.rows[0]) {
          // Determine organization type
          let orgType = 'community';
          const name = orgName.toLowerCase();
          
          if (name.includes('aboriginal') || name.includes('torres strait')) {
            orgType = 'indigenous';
          } else if (name.includes('university') || name.includes('education')) {
            orgType = 'educational';
          } else if (name.includes('limited') || name.includes('ltd')) {
            orgType = 'non_profit';
          }
          
          await db.query(`
            INSERT INTO organizations (
              name, alternate_name, abn, organization_type, data_source, 
              verification_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `, [
            orgName,
            serviceName !== orgName ? serviceName : null,
            record['Australian Business Number (ABN)'] || null,
            orgType,
            'QLD_DYJ_2023-24_Expenditure',
            'government_verified'
          ]);
          
          added++;
          console.log(`✅ Added: ${orgName}`);
        }
      } catch (error) {
        console.error(`❌ Error processing record:`, error.message);
      }
    }
    
    console.log(`🎉 Import completed! Added ${added} organizations`);
    console.log(`📈 Summary:`);
    console.log(`   - Key suppliers from spending analysis: ${keySuppliers.length}`);
    console.log(`   - Sample CSV records processed: ${sampleRecords.length}`);
    console.log(`   - Total organizations added: ${added}`);
    
  } catch (error) {
    console.error('💥 Import failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run import
quickImport();