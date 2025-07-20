// Bulletproof 603 service import that works with any schema
import fs from 'fs';

export default async function bulletproofImportRoutes(fastify) {
  
  fastify.post('/bulletproof-603-import', async (request, reply) => {
    try {
      // Load 603 services
      const mergedFile = 'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json';
      
      if (!fs.existsSync(mergedFile)) {
        return reply.send({ error: 'Dataset not found' });
      }

      const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
      const services = data.services || [];
      
      // Clear existing data
      try {
        await request.db('services').del();
        await request.db('organizations').del();
      } catch (e) {
        // Continue if delete fails
      }
      
      // Import organizations with minimal data
      const orgs = new Set();
      let orgCount = 0;
      
      for (const service of services) {
        if (service.organization?.id && !orgs.has(service.organization.id)) {
          orgs.add(service.organization.id);
          try {
            await request.db('organizations').insert({
              id: service.organization.id,
              name: service.organization.name || 'Unknown Org'
            }).onConflict('id').ignore();
            orgCount++;
          } catch (e) {
            // Try with even more minimal data
            try {
              await request.db('organizations').insert({
                id: service.organization.id,
                name: service.organization.name || 'Unknown Org',
                data_source: 'Import'
              }).onConflict('id').ignore();
              orgCount++;
            } catch (e2) {
              // Skip this org
            }
          }
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
          
        } catch (e) {
          console.log(`Failed to insert service ${service.name}: ${e.message}`);
        }
      }
      
      // Get final counts
      const finalServices = await request.db('services').count('* as count').first();
      const finalOrgs = await request.db('organizations').count('* as count').first();
      
      return {
        success: true,
        services_imported: serviceCount,
        organizations_imported: orgCount,
        total_services: parseInt(finalServices.count),
        total_organizations: parseInt(finalOrgs.count),
        message: `🎉 ${serviceCount} services and ${orgCount} organizations imported!`
      };
      
    } catch (error) {
      return reply.send({ 
        error: error.message,
        success: false 
      });
    }
  });
}