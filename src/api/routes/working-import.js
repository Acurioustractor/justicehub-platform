// Working import that handles all required fields
import fs from 'fs';
import path from 'path';

// Function to determine state from postcode
function getStateFromPostcode(postcode) {
  if (!postcode) return 'Unknown';
  
  const code = postcode.toString().substring(0, 1);
  switch (code) {
    case '1':
    case '2': return 'NSW';
    case '3':
    case '8': return 'VIC';
    case '4': return 'QLD';
    case '5': return 'SA';
    case '6': return 'WA';
    case '7': return 'TAS';
    case '0': return postcode.startsWith('02') || postcode.startsWith('08') ? 'ACT' : 'NT';
    default: return 'Unknown';
  }
}

// Function to determine region from location
function getRegionFromLocation(city, state, postcode) {
  if (!city && !postcode) return 'unknown';
  
  const cityLower = (city || '').toLowerCase();
  const code = postcode ? postcode.toString() : '';
  
  // Queensland regions
  if (state === 'QLD') {
    if (cityLower.includes('brisbane')) return 'brisbane_major';
    if (cityLower.includes('gold coast')) return 'gold coast_regional';
    if (cityLower.includes('cairns')) return 'cairns_regional';
    if (cityLower.includes('townsville')) return 'townsville';
    if (cityLower.includes('toowoomba')) return 'toowoomba_regional';
    if (cityLower.includes('mackay')) return 'mackay';
    if (cityLower.includes('ipswich')) return 'ipswich';
    if (cityLower.includes('logan')) return 'logan';
    if (cityLower.includes('bundaberg')) return 'bundaberg_rural';
    if (cityLower.includes('gladstone')) return 'gladstone_central';
    return 'queensland';
  }
  
  // NSW regions
  if (state === 'NSW') {
    if (cityLower.includes('sydney')) return 'sydney_major';
    if (cityLower.includes('newcastle')) return 'newcastle_regional';
    if (cityLower.includes('wollongong')) return 'wollongong_regional';
    if (cityLower.includes('parramatta')) return 'parramatta_regional';
    if (cityLower.includes('dubbo')) return 'dubbo_rural';
    return 'sydney_major';
  }
  
  // Victoria regions
  if (state === 'VIC') {
    if (cityLower.includes('melbourne')) return 'melbourne_major';
    if (cityLower.includes('geelong')) return 'geelong_regional';
    if (cityLower.includes('ballarat')) return 'ballarat_regional';
    if (cityLower.includes('bendigo')) return 'bendigo_regional';
    return 'melbourne_major';
  }
  
  // Other states
  if (state === 'WA') return cityLower.includes('perth') ? 'perth_major' : 'fremantle_regional';
  if (state === 'SA') return cityLower.includes('adelaide') ? 'adelaide_major' : 'mount gambier_rural';
  if (state === 'TAS') return cityLower.includes('hobart') ? 'hobart_major' : 'launceston_regional';
  if (state === 'ACT') return 'canberra_major';
  if (state === 'NT') return 'darwin_major';
  
  return 'unknown';
}

export default async function workingImportRoutes(fastify) {
  
  fastify.post('/load-603-services', async (request, reply) => {
    try {
      // Find the merged dataset file
      const possibleFiles = [
        'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json',
        'COMPREHENSIVE-Australian-Services-2025-07-08T02-25-42-652Z.json',
        'Database-Summary.json'
      ];
      
      let mergedFile = null;
      let services = [];
      
      for (const file of possibleFiles) {
        if (fs.existsSync(file)) {
          mergedFile = file;
          break;
        }
      }
      
      if (!mergedFile) {
        return reply.send({ 
          error: 'No dataset file found',
          searched: possibleFiles
        });
      }

      const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
      services = data.services || data.consolidated_services || [];
      
      if (services.length === 0) {
        return reply.send({ 
          error: 'No services found in dataset',
          file: mergedFile 
        });
      }
      
      fastify.log.info(`Found ${services.length} services in ${mergedFile}`);
      
      // Clear existing data
      await request.db('services').del();
      await request.db('organizations').del();
      
      // Import organizations first
      const organizations = new Map();
      
      for (const service of services) {
        const orgId = service.organization?.id || service.organization_id || `org-${service.id}`;
        const orgName = service.organization?.name || service.organization_name || 'Unknown Organization';
        
        if (!organizations.has(orgId)) {
          organizations.set(orgId, {
            id: orgId,
            name: orgName,
            organization_type: service.organization?.type || 'non_profit',
            data_source: service.data_source?.source_name || 'Import'
          });
        }
      }
      
      // Insert organizations
      let orgCount = 0;
      for (const [id, org] of organizations) {
        try {
          await request.db('organizations').insert(org).onConflict('id').ignore();
          orgCount++;
        } catch (error) {
          fastify.log.error(`Failed to insert organization ${org.name}: ${error.message}`);
        }
      }
      
      // Import services with required fields
      let serviceCount = 0;
      
      for (const service of services) {
        try {
          const orgId = service.organization?.id || service.organization_id || `org-${service.id}`;
          
          const serviceData = {
            id: service.id,
            name: service.name || 'Unknown Service',
            description: service.description || 'No description available',
            organization_id: orgId,
            categories: service.categories || ['youth_development'],
            data_source: service.data_source?.source_name || 'Import',
            url: service.url || service.contact?.website,
            email: service.email || service.contact?.email?.primary,
            status: service.status || 'active',
            minimum_age: service.age_range?.minimum || service.minimum_age,
            maximum_age: service.age_range?.maximum || service.maximum_age,
            youth_specific: service.youth_specific !== undefined ? service.youth_specific : true,
            indigenous_specific: service.indigenous_specific || false,
            keywords: service.keywords || [],
            source_url: service.data_source?.source_url
          };
          
          await request.db('services').insert(serviceData).onConflict('id').ignore();
          serviceCount++;
          
          // Add location if available
          if (service.location) {
            const postcode = service.location.postcode || service.location.postal_code || '0000';
            const correctState = getStateFromPostcode(postcode);
            const correctRegion = getRegionFromLocation(service.location.city, correctState, postcode);
            
            const locationData = {
              service_id: service.id,
              name: service.location.name || 'Primary Location',
              address_1: service.location.address_line_1 || service.location.address || 'Address not available',
              address_2: service.location.address_line_2,
              city: service.location.city || 'Unknown City',
              state_province: correctState,
              postal_code: postcode,
              latitude: service.location.coordinates?.latitude,
              longitude: service.location.coordinates?.longitude,
              region: correctRegion
            };
            
            try {
              await request.db('locations').insert(locationData);
            } catch (error) {
              fastify.log.error(`Failed to insert location for service ${service.name}: ${error.message}`);
            }
          }
          
          // Add contact if available
          if (service.contact) {
            const contactData = {
              service_id: service.id,
              phone: service.contact.phone ? JSON.stringify(service.contact.phone) : null,
              email: service.contact.email?.primary || service.contact.email
            };
            
            try {
              await request.db('contacts').insert(contactData);
            } catch (error) {
              fastify.log.error(`Failed to insert contact for service ${service.name}: ${error.message}`);
            }
          }
          
        } catch (error) {
          fastify.log.error(`Failed to insert service ${service.name}: ${error.message}`);
        }
      }
      
      // Get final counts
      const finalServices = await request.db('services').count('* as count').first();
      const finalOrgs = await request.db('organizations').count('* as count').first();
      const finalLocations = await request.db('locations').count('* as count').first();
      const finalContacts = await request.db('contacts').count('* as count').first();
      
      return {
        success: true,
        dataset_file: mergedFile,
        services_imported: serviceCount,
        organizations_imported: orgCount,
        total_services: parseInt(finalServices.count),
        total_organizations: parseInt(finalOrgs.count),
        total_locations: parseInt(finalLocations.count),
        total_contacts: parseInt(finalContacts.count),
        message: `✅ Successfully imported ${serviceCount} services and ${orgCount} organizations from ${mergedFile}!`
      };
      
    } catch (error) {
      fastify.log.error('Import failed:', error);
      return reply.send({ 
        error: error.message,
        success: false,
        stack: error.stack
      });
    }
  });
  
  // Check import status
  fastify.get('/status', async (request, reply) => {
    try {
      const services = await request.db('services').count('* as count').first();
      const organizations = await request.db('organizations').count('* as count').first();
      const locations = await request.db('locations').count('* as count').first();
      const contacts = await request.db('contacts').count('* as count').first();
      
      return {
        database_status: {
          services: parseInt(services.count),
          organizations: parseInt(organizations.count),
          locations: parseInt(locations.count),
          contacts: parseInt(contacts.count)
        },
        ready_for_search: parseInt(services.count) > 0
      };
      
    } catch (error) {
      return reply.send({ 
        error: error.message,
        database_status: 'error'
      });
    }
  });
}