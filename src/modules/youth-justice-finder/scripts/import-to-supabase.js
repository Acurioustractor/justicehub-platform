import fs from 'fs';
import { supabase, TABLES } from '../src/config/supabase.js';

// Import your 1,075 services to Supabase
async function importToSupabase() {
  try {
    console.log('🚀 Starting Supabase import...');
    
    // Read the ultra-extraction data
    const dataPath = './archive/data-extracts/ultra-extraction-2025-07-16.json';
    console.log(`📖 Reading data from: ${dataPath}`);
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Data file not found. Please ensure ultra-extraction-2025-07-16.json exists.');
      process.exit(1);
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    const services = Array.isArray(jsonData) ? jsonData : jsonData.services || [];
    console.log(`📊 Found ${services.length} services to import`);
    
    // Process and import data in batches
    const BATCH_SIZE = 50;
    let imported = 0;
    let errors = 0;
    
    for (let i = 0; i < services.length; i += BATCH_SIZE) {
      const batch = services.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(services.length/BATCH_SIZE)}`);
      
      const processedBatch = await processBatch(batch);
      if (processedBatch.length > 0) {
        await importBatch(processedBatch);
        imported += processedBatch.length;
        console.log(`✅ Imported ${imported}/${services.length} services`);
      } else {
        errors += batch.length;
      }
      
      // Small delay to be nice to Supabase
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Import completed! ${imported} services imported, ${errors} errors`);
    
    // Show final stats
    const stats = await getSupabaseStats();
    console.log('\n📊 Final Database Stats:');
    console.log(`   Services: ${stats.services}`);
    console.log(`   Organizations: ${stats.organizations}`);
    console.log(`   Locations: ${stats.locations}`);
    console.log(`   Contacts: ${stats.contacts}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

async function processBatch(services) {
  const processedServices = [];
  
  for (const service of services) {
    try {
      // Extract organization data
      const organization = {
        name: service.organization || service.provider || 'Unknown Organization',
        type: service.organization_type || 'Non-profit',
        website: service.website || service.url,
        abn: service.abn,
        description: service.organization_description,
        project: 'youth-justice-service-finder',
        source: 'ultra-extraction-2025-07-16',
        app_type: 'service-directory'
      };
      
      // Extract location data
      const location = {
        address: (service.address || '').substring(0, 500),
        suburb: service.suburb || service.locality,
        postcode: service.postcode,
        state: service.state || 'QLD',
        latitude: parseFloat(service.latitude) || null,
        longitude: parseFloat(service.longitude) || null,
        region: service.region,
        project: 'youth-justice-service-finder',
        app_type: 'service-directory'
      };
      
      // Extract contact data
      const contact = {
        phone: (service.phone || service.contact_phone || '').substring(0, 50),
        email: service.email || service.contact_email,
        website: service.website || service.url,
        project: 'youth-justice-service-finder',
        app_type: 'service-directory'
      };
      
      // Extract service data
      const processedService = {
        name: (service.name || service.service_name || 'Unknown Service').substring(0, 255),
        description: (service.description || '').substring(0, 2000),
        keywords: service.keywords || service.tags || service.categories,
        service_type: service.service_type || service.type || 'Youth Service',
        target_age_min: parseInt(service.target_age_min) || null,
        target_age_max: parseInt(service.target_age_max) || null,
        eligibility: service.eligibility,
        cost: service.cost || service.fees,
        availability: service.availability || service.hours,
        project: 'youth-justice-service-finder',
        source: 'ultra-extraction-2025-07-16',
        app_type: 'service-directory',
        import_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization,
        location,
        contact
      };
      
      processedServices.push(processedService);
      
    } catch (error) {
      console.warn(`⚠️ Error processing service ${service.name}: ${error.message}`);
    }
  }
  
  return processedServices;
}

async function importBatch(services) {
  const organizationsData = [];
  const locationsData = [];
  const contactsData = [];
  const servicesData = [];
  
  // Prepare data for bulk insert
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const serviceId = `service_${Date.now()}_${i}`;
    const orgId = `org_${Date.now()}_${i}`;
    const locId = `loc_${Date.now()}_${i}`;
    const contactId = `contact_${Date.now()}_${i}`;
    
    organizationsData.push({
      id: orgId,
      ...service.organization
    });
    
    locationsData.push({
      id: locId,
      ...service.location
    });
    
    contactsData.push({
      id: contactId,
      ...service.contact
    });
    
    servicesData.push({
      id: serviceId,
      organization_id: orgId,
      location_id: locId,
      contact_id: contactId,
      name: service.name,
      description: service.description,
      keywords: service.keywords,
      service_type: service.service_type,
      target_age_min: service.target_age_min,
      target_age_max: service.target_age_max,
      eligibility: service.eligibility,
      cost: service.cost,
      availability: service.availability,
      project: service.project,
      source: service.source,
      app_type: service.app_type,
      import_date: service.import_date,
      created_at: service.created_at,
      updated_at: service.updated_at
    });
  }
  
  // Insert data in the correct order (organizations first, then services with references)
  try {
    await supabase.from(TABLES.ORGANIZATIONS).insert(organizationsData);
    await supabase.from(TABLES.LOCATIONS).insert(locationsData);
    await supabase.from(TABLES.CONTACTS).insert(contactsData);
    await supabase.from(TABLES.SERVICES).insert(servicesData);
  } catch (error) {
    console.error('Batch import error:', error);
    throw error;
  }
}

async function getSupabaseStats() {
  try {
    const [servicesCount, orgsCount, locationsCount, contactsCount] = await Promise.all([
      supabase.from(TABLES.SERVICES).select('id', { count: 'exact', head: true }),
      supabase.from(TABLES.ORGANIZATIONS).select('id', { count: 'exact', head: true }),
      supabase.from(TABLES.LOCATIONS).select('id', { count: 'exact', head: true }),
      supabase.from(TABLES.CONTACTS).select('id', { count: 'exact', head: true })
    ]);

    return {
      services: servicesCount.count || 0,
      organizations: orgsCount.count || 0,
      locations: locationsCount.count || 0,
      contacts: contactsCount.count || 0
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { services: 0, organizations: 0, locations: 0, contacts: 0 };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importToSupabase();
}

export { importToSupabase }; 