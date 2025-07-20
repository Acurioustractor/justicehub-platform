#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'benknight',
  database: 'youth_justice_services',
  password: undefined
});

// Helper function to truncate strings to fit database constraints
function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
}

async function importServicesData() {
  console.log('�� Starting import of ALL youth justice services data...');
  
  try {
    // Read the FULL JSON data file with 1,075 services
    const dataPath = path.join(process.cwd(), 'archive/data-extracts/ultra-extraction-2025-07-16.json');
    console.log(`📖 Reading data from: ${dataPath}`);
    
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(jsonData);
    const services = data.services; // Extract services array from the object
    
    console.log(`📊 Found ${services.length} services to import (${data.totalServices} total)`);
    console.log(`🎯 Youth-specific services: ${data.youthSpecific || 'calculating...'}`);
    console.log(`✨ High-quality services: ${data.highQuality || 'calculating...'}`);
    
    // Clear existing data (in order due to foreign keys)
    console.log('🧹 Clearing existing data...');
    await pool.query('DELETE FROM contacts');
    await pool.query('DELETE FROM locations'); 
    await pool.query('DELETE FROM services');
    await pool.query('DELETE FROM organizations');
    
    // Import services
    console.log('📥 Importing services...');
    let imported = 0;
    const orgIdMap = new Map(); // Track organization IDs to avoid duplicates
    
    for (const service of services) {
      try {
        // Handle organization
        let orgId = null;
        if (service.organization) {
          const org = service.organization;
          const orgKey = org.name || 'Unknown Organization';
          
          if (!orgIdMap.has(orgKey)) {
            // Insert organization
            const orgQuery = `
              INSERT INTO organizations (
                name, description, email, url, organization_type, data_source, abn
              ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
            `;
            
            const orgValues = [
              truncate(org.name, 255) || 'Unknown Organization',
              truncate(org.description, 500),
              truncate(org.email, 255),
              truncate(org.url, 500),
              org.organization_type || 'non_profit',
              truncate(org.data_source, 255) || 'imported',
              truncate(org.tax_id, 50)
            ];
            
            const orgResult = await pool.query(orgQuery, orgValues);
            orgId = orgResult.rows[0].id;
            orgIdMap.set(orgKey, orgId);
          } else {
            orgId = orgIdMap.get(orgKey);
          }
        }
        
        // Insert service
        const serviceQuery = `
          INSERT INTO services (
            organization_id, name, description, url, email, 
            minimum_age, maximum_age, youth_specific, categories, 
            keywords, data_source, source_url, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id
        `;
        
        const serviceValues = [
          orgId,
          truncate(service.name, 255) || 'Unknown Service',
          service.description || '',  // description is text, no limit
          truncate(service.url, 500),
          truncate(service.email, 255),
          service.minimum_age || null,
          service.maximum_age || null,
          service.youth_specific !== false, // default to true for youth services
          service.categories || ['Youth Services'],
          service.keywords || [],
          truncate(service.data_source, 255) || 'imported',
          truncate(service.source_url, 500),
          service.status || 'active'
        ];
        
        const serviceResult = await pool.query(serviceQuery, serviceValues);
        const serviceId = serviceResult.rows[0].id;
        
        // Import locations
        if (service.locations && Array.isArray(service.locations)) {
          for (const location of service.locations) {
            const locationQuery = `
              INSERT INTO locations (
                service_id, name, address_1, address_2, city, postal_code, state_province, 
                latitude, longitude, region, country
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            
            const locationValues = [
              serviceId,
              truncate(location.name, 255) || 'Location',
              truncate(location.address_1, 255) || '',
              truncate(location.address_2, 255) || '',
              truncate(location.city, 100) || 'Unknown',
              truncate(location.postal_code, 10) || '0000',
              truncate(location.state_province, 50) || 'QLD',
              location.latitude || null,
              location.longitude || null,
              truncate(location.region, 50) || 'brisbane',
              truncate(location.country, 2) || 'AU'
            ];
            
            await pool.query(locationQuery, locationValues);
          }
        }
        
        // Import contacts
        if (service.contacts && Array.isArray(service.contacts)) {
          for (const contact of service.contacts) {
            const contactQuery = `
              INSERT INTO contacts (
                service_id, name, title, email, phone
              ) VALUES ($1, $2, $3, $4, $5)
            `;
            
            const contactValues = [
              serviceId,
              truncate(contact.name, 255) || 'Contact',
              truncate(contact.title, 255) || '',
              truncate(contact.email, 255) || null,
              JSON.stringify(contact.phone || [])
            ];
            
            await pool.query(contactQuery, contactValues);
          }
        }
        
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`   ✅ Imported ${imported} services...`);
        }
      } catch (error) {
        console.error(`❌ Error importing service "${service.name}":`, error.message);
        // Continue with next service
      }
    }
    
    console.log(`🎉 Successfully imported ${imported} out of ${services.length} services!`);
    
    // Verify import
    const countResult = await pool.query('SELECT COUNT(*) FROM services');
    const orgCountResult = await pool.query('SELECT COUNT(*) FROM organizations');
    const locationCountResult = await pool.query('SELECT COUNT(*) FROM locations');
    const contactCountResult = await pool.query('SELECT COUNT(*) FROM contacts');
    
    console.log(`📊 Database summary:`);
    console.log(`   🏢 Services: ${countResult.rows[0].count}`);
    console.log(`   🏛️ Organizations: ${orgCountResult.rows[0].count}`);
    console.log(`   📍 Locations: ${locationCountResult.rows[0].count}`);
    console.log(`   📞 Contacts: ${contactCountResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

importServicesData(); 