import fetch from 'node-fetch';

const CSV_URL = "https://www.families.qld.gov.au/_media/documents/open-data/dyjvs-ontimepayments-2024-25.csv";

export default async function dataDownloadRoutes(fastify, options) {
  // Download and serve the latest DYJVS on-time payments CSV data
  fastify.get('/dyjvs-payments', {
    schema: {
      description: 'Download latest DYJVS on-time payments data',
      tags: ['Data'],
      response: {
        200: {
          type: 'string',
          description: 'CSV file content'
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const response = await fetch(CSV_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }
      
      const csvData = await response.text();
      const today = new Date().toISOString().split('T')[0];
      const filename = `dyjvs_ontimepayments_${today}.csv`;
      
      reply
        .type('text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csvData);
        
    } catch (error) {
      fastify.log.error('Error downloading CSV data:', error);
      reply.status(500).send({ 
        error: 'Failed to download CSV data',
        message: error.message 
      });
    }
  });

  // Get metadata about the DYJVS payments data
  fastify.get('/dyjvs-payments/info', {
    schema: {
      description: 'Get information about the DYJVS payments dataset',
      tags: ['Data'],
      response: {
        200: {
          type: 'object',
          properties: {
            source_url: { type: 'string' },
            description: { type: 'string' },
            last_checked: { type: 'string' },
            filename_format: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      source_url: CSV_URL,
      description: 'Department of Youth Justice, Victoria and Sport - On-time payments data for 2024-25',
      last_checked: new Date().toISOString(),
      filename_format: `dyjvs_ontimepayments_${today}.csv`
    };
  });
}