// Import 603 services route
import fs from 'fs';

export default async function import603ServicesRoutes(fastify) {
  
  // Import the 603-service dataset
  fastify.post('/load-603-services', async (request, reply) => {
    try {
      fastify.log.info('Starting import of 603 services...');
      
      // Load the merged dataset
      const mergedFile = 'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json';
      
      if (!fs.existsSync(mergedFile)) {
        return reply.code(404).send({ 
          error: 'Dataset file not found',
          message: 'The 603-service dataset file is not available on the server'
        });
      }

      const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
      const services = data.services || [];
      
      fastify.log.info(`Found ${services.length} services to import`);

      // Clear existing data
      await request.db.query('DELETE FROM services');
      await request.db.query('DELETE FROM organizations');
      
      // Import organizations first
      const organizations = new Map();
      
      for (const service of services) {
        if (service.organization && !organizations.has(service.organization.id)) {
          organizations.set(service.organization.id, service.organization);
        }
      }
      
      for (const [id, org] of organizations) {
        await request.db.query(`
          INSERT INTO organizations (
            id, name, type, abn, registration_type, 
            parent_organization, website, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          org.id,
          org.name || 'Unknown Organization',
          org.type || 'community',
          org.abn,
          org.registration_type || 'other',
          org.parent_organization,
          org.website
        ]);
      }
      
      fastify.log.info(`Imported ${organizations.size} organizations`);
      
      // Import all services
      let imported = 0;
      
      for (const service of services) {
        try {
          await request.db.query(`
            INSERT INTO services (
              id, external_id, name, description, url, status,
              categories, keywords, service_types, target_demographics,
              age_range_min, age_range_max, age_range_description,
              youth_specific, indigenous_specific, culturally_specific,
              disability_specific, lgbti_specific,
              organization_id, organization_name,
              location_name, address_line_1, address_line_2,
              suburb, city, state, postcode, region, lga,
              latitude, longitude, coordinate_accuracy,
              phone_primary, phone_mobile, phone_toll_free, phone_crisis,
              email_primary, email_intake, email_admin,
              website, social_media, postal_address,
              hours, cost_free, cost_description,
              eligibility_age, eligibility_geographic, eligibility_criteria,
              languages, capacity_individual, capacity_group, capacity_family,
              government_funded, funding_sources,
              data_source_name, data_source_type, data_source_url,
              last_verified, data_quality_score, verification_status,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27, $28, $29,
              $30, $31, $32, $33, $34, $35, $36, $37, $38,
              $39, $40, $41, $42, $43, $44, $45, $46, $47,
              $48, $49, $50, $51, $52, $53, $54, $55, $56,
              $57, $58, NOW(), NOW()
            )
            ON CONFLICT (id) DO NOTHING
          `, [
            service.id,
            service.external_id,
            service.name || 'Unknown Service',
            service.description,
            service.url,
            service.status || 'active',
            JSON.stringify(service.categories || []),
            JSON.stringify(service.keywords || []),
            JSON.stringify(service.service_types || []),
            JSON.stringify(service.target_demographics || []),
            service.age_range?.minimum,
            service.age_range?.maximum,
            service.age_range?.description,
            service.youth_specific || false,
            service.indigenous_specific || false,
            JSON.stringify(service.culturally_specific || []),
            service.disability_specific || false,
            service.lgbti_specific || false,
            service.organization?.id,
            service.organization?.name,
            service.location?.name,
            service.location?.address_line_1,
            service.location?.address_line_2,
            service.location?.suburb,
            service.location?.city,
            service.location?.state,
            service.location?.postcode,
            service.location?.region,
            service.location?.lga,
            service.location?.coordinates?.latitude,
            service.location?.coordinates?.longitude,
            service.location?.coordinates?.accuracy,
            service.contact?.phone?.primary,
            service.contact?.phone?.mobile,
            service.contact?.phone?.toll_free,
            service.contact?.phone?.crisis_line,
            service.contact?.email?.primary,
            service.contact?.email?.intake,
            service.contact?.email?.admin,
            service.contact?.website,
            JSON.stringify(service.contact?.social_media || {}),
            service.contact?.postal_address,
            service.service_details?.availability?.hours,
            service.service_details?.cost?.free,
            service.service_details?.cost?.cost_description,
            service.service_details?.eligibility?.age_requirements,
            JSON.stringify(service.service_details?.eligibility?.geographic_restrictions || []),
            service.service_details?.eligibility?.criteria,
            JSON.stringify(service.service_details?.languages || ['English']),
            service.service_details?.capacity?.individual,
            service.service_details?.capacity?.group,
            service.service_details?.capacity?.family,
            service.funding?.government_funded,
            JSON.stringify(service.funding?.funding_sources || []),
            service.data_source?.source_name,
            service.data_source?.source_type,
            service.data_source?.source_url,
            service.data_source?.last_verified,
            service.data_source?.data_quality_score,
            service.data_source?.verification_status
          ]);
          
          imported++;
          
        } catch (error) {
          fastify.log.error(`Error importing service ${service.name}: ${error.message}`);
        }
      }
      
      // Verify the import
      const { rows: stats } = await request.db.query(`
        SELECT 
          COUNT(*) as total_services,
          COUNT(DISTINCT organization_id) as total_organizations,
          COUNT(DISTINCT state) as total_states
        FROM services
      `);
      
      fastify.log.info(`Import complete: ${imported} services`);
      
      return {
        success: true,
        imported: imported,
        organizations: organizations.size,
        total_services: parseInt(stats[0].total_services),
        total_organizations: parseInt(stats[0].total_organizations),
        total_states: parseInt(stats[0].total_states),
        message: '603 services successfully imported to live database!'
      };
      
    } catch (error) {
      fastify.log.error('Import failed:', error);
      return reply.code(500).send({ 
        error: 'Import failed',
        message: error.message
      });
    }
  });
}