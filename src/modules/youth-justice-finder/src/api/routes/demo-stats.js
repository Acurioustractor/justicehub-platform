// Demo stats route to showcase the 603-service database
import fs from 'fs';

export default async function demoStatsRoutes(fastify) {
  // Get demo stats from the merged dataset
  fastify.get('/demo-stats', async (request, reply) => {
    try {
      // Load the merged dataset
      const mergedFile = 'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json';
      
      if (!fs.existsSync(mergedFile)) {
        return reply.code(404).send({ 
          error: 'Dataset not found',
          message: 'The merged dataset file is not available'
        });
      }

      const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
      const services = data.services || [];
      
      // Calculate statistics
      const stats = {
        totals: {
          services: services.length,
          organizations: new Set(services.map(s => s.organization?.id).filter(Boolean)).size,
          youth_specific: services.filter(s => s.youth_specific).length,
          indigenous_specific: services.filter(s => s.indigenous_specific).length
        },
        states: data.metadata.state_breakdown,
        categories: [
          'Youth Development',
          'Mental Health',
          'Legal Aid', 
          'Housing Support',
          'Family Services',
          'Education Support',
          'Health Services',
          'Crisis Support',
          'Indigenous Services',
          'Community Services'
        ],
        regions: Object.keys(data.metadata.state_breakdown || {}),
        data_sources: data.metadata.source_breakdown,
        coverage: 'Australia-wide with enhanced QLD coverage',
        last_updated: data.metadata.generated_at
      };

      return stats;
      
    } catch (error) {
      fastify.log.error('Error generating demo stats:', error);
      return reply.code(500).send({ 
        error: 'Internal server error',
        message: 'Failed to generate statistics'
      });
    }
  });

  // Get sample services for demo
  fastify.get('/demo-services', async (request, reply) => {
    try {
      const { limit = 20, state, category } = request.query;
      
      // Load the merged dataset
      const mergedFile = 'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json';
      
      if (!fs.existsSync(mergedFile)) {
        return reply.code(404).send({ 
          error: 'Dataset not found' 
        });
      }

      const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
      let services = data.services || [];
      
      // Apply filters
      if (state) {
        services = services.filter(s => 
          s.location?.state?.toLowerCase() === state.toLowerCase()
        );
      }
      
      if (category) {
        services = services.filter(s => 
          s.categories?.some(cat => 
            cat.toLowerCase().includes(category.toLowerCase())
          )
        );
      }
      
      // Limit results
      services = services.slice(0, parseInt(limit));
      
      return {
        services,
        total: services.length,
        filters: { state, category, limit }
      };
      
    } catch (error) {
      fastify.log.error('Error getting demo services:', error);
      return reply.code(500).send({ 
        error: 'Internal server error' 
      });
    }
  });
}