import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'headspace-scraper' });

export class HeadspaceScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.firecrawl = getFirecrawlClient();
    this.options = options;
    this.stats = {
      servicesFound: 0,
      servicesProcessed: 0,
      errors: 0
    };
  }

  async scrape() {
    logger.info('Starting headspace centres scrape');
    
    try {
      // Get or create the organization
      const orgId = await this.findOrCreateOrganization({
        name: 'headspace National Youth Mental Health Foundation',
        organization_type: 'non_profit',
        url: 'https://headspace.org.au',
        data_source: 'headspace'
      });

      // Queensland headspace centres
      const centres = [
        {
          name: 'headspace Brisbane',
          url: 'https://headspace.org.au/headspace-centres/brisbane/',
          address: 'Level 2, 139 Melbourne Street, South Brisbane QLD 4101',
          phone: '(07) 3114 4200',
          email: 'headspace.brisbane@health.qld.gov.au',
          region: 'brisbane',
          lat: -27.4781, lng: 153.0170
        },
        {
          name: 'headspace Cairns',
          url: 'https://headspace.org.au/headspace-centres/cairns/',
          address: '176 Grafton Street, Cairns QLD 4870',
          phone: '(07) 4041 6850',
          region: 'cairns',
          lat: -16.9235, lng: 145.7703
        },
        {
          name: 'headspace Gold Coast',
          url: 'https://headspace.org.au/headspace-centres/gold-coast/',
          address: 'Level 1, 1 Bay Street, Southport QLD 4215',
          phone: '(07) 5509 0900',
          region: 'gold_coast',
          lat: -27.9716, lng: 153.4146
        },
        {
          name: 'headspace Ipswich', 
          url: 'https://headspace.org.au/headspace-centres/ipswich/',
          address: '15 Gordon Street, Ipswich QLD 4305',
          phone: '(07) 3280 7900',
          region: 'brisbane',
          lat: -27.6139, lng: 152.7594
        },
        {
          name: 'headspace Logan',
          url: 'https://headspace.org.au/headspace-centres/logan/',
          address: '10-16 Civic Parade, Logan Central QLD 4114',
          phone: '(07) 3387 1200',
          region: 'brisbane',
          lat: -27.6393, lng: 153.1099
        },
        {
          name: 'headspace Mackay',
          url: 'https://headspace.org.au/headspace-centres/mackay/',
          address: 'Level 1, 60 Wood Street, Mackay QLD 4740',
          phone: '(07) 4842 1600',
          region: 'mackay',
          lat: -21.1425, lng: 149.1847
        },
        {
          name: 'headspace Mount Isa',
          url: 'https://headspace.org.au/headspace-centres/mount-isa/',
          address: '17-19 Isa Street, Mount Isa QLD 4825',
          phone: '(07) 4743 2746',
          region: 'mount_isa',
          lat: -20.7260, lng: 139.4949
        },
        {
          name: 'headspace Rockhampton',
          url: 'https://headspace.org.au/headspace-centres/rockhampton/',
          address: '134 Alma Street, Rockhampton QLD 4700',
          phone: '(07) 4921 5335',
          region: 'rockhampton',
          lat: -23.3782, lng: 150.5094
        },
        {
          name: 'headspace Sunshine Coast',
          url: 'https://headspace.org.au/headspace-centres/sunshine-coast/',
          address: '37 First Avenue, Maroochydore QLD 4558',
          phone: '(07) 5479 3958',
          region: 'sunshine_coast',
          lat: -26.6546, lng: 153.0905
        },
        {
          name: 'headspace Toowoomba',
          url: 'https://headspace.org.au/headspace-centres/toowoomba/',
          address: '484 Ruthven Street, Toowoomba QLD 4350',
          phone: '(07) 4639 9000',
          region: 'toowoomba',
          lat: -27.5567, lng: 151.9537
        },
        {
          name: 'headspace Townsville',
          url: 'https://headspace.org.au/headspace-centres/townsville/',
          address: '143 Walker Street, Townsville QLD 4810',
          phone: '(07) 4799 5000',
          region: 'townsville',
          lat: -19.2627, lng: 146.8162
        },
        {
          name: 'headspace Bundaberg',
          url: 'https://headspace.org.au/headspace-centres/bundaberg/',
          address: '6 Barolin Street, Bundaberg QLD 4670',
          phone: '(07) 4151 1129',
          region: 'bundaberg',
          lat: -24.8656, lng: 152.3508
        },
        {
          name: 'headspace Gladstone',
          url: 'https://headspace.org.au/headspace-centres/gladstone/',
          address: '147 Goondoon Street, Gladstone QLD 4680',
          phone: '(07) 4976 2466',
          region: 'gladstone',
          lat: -23.8429, lng: 151.2571
        },
        {
          name: 'headspace Fraser Coast',
          url: 'https://headspace.org.au/headspace-centres/fraser-coast/',
          address: '422 Kent Street, Maryborough QLD 4650',
          phone: '(07) 4122 0820',
          region: 'hervey_bay',
          lat: -25.5378, lng: 152.7019
        },
        {
          name: 'headspace Caboolture',
          url: 'https://headspace.org.au/headspace-centres/caboolture/',
          address: '32 King Street, Caboolture QLD 4510',
          phone: '(07) 5294 5480',
          region: 'brisbane',
          lat: -27.0834, lng: 152.9517
        }
      ];

      // Process each centre
      for (const centre of centres) {
        try {
          const service = await this.createServiceFromCentre(centre, orgId);
          await this.saveService(service);
          this.stats.servicesFound++;
        } catch (error) {
          logger.error({ 
            error: error.message,
            centre: centre.name 
          }, 'Failed to process centre');
          this.stats.errors++;
        }
      }

      logger.info({
        stats: this.stats
      }, 'headspace scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
  }

  async createServiceFromCentre(centre, orgId) {
    const serviceId = uuidv4();
    
    return {
      id: serviceId,
      organization_id: orgId,
      name: centre.name,
      description: `Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services`,
      url: centre.url,
      email: centre.email,
      status: 'active',
      minimum_age: 12,
      maximum_age: 25,
      youth_specific: true,
      indigenous_specific: false,
      categories: ['mental_health', 'substance_abuse', 'education_training'],
      keywords: ['mental health', 'counselling', 'psychology', 'youth', 'wellbeing', 'drug', 'alcohol', 'education', 'employment'],
      data_source: 'headspace',
      source_url: centre.url,
      location: {
        address_1: centre.address.split(',')[0],
        city: centre.address.split(',')[1]?.trim() || centre.name.replace('headspace ', ''),
        state_province: 'QLD',
        postal_code: centre.address.match(/\d{4}/)?.[0] || '4000',
        region: centre.region,
        lat: centre.lat,
        lng: centre.lng
      },
      contact: {
        phone: centre.phone,
        email: centre.email
      }
    };
  }

  async findOrCreateOrganization(orgData) {
    try {
      const existing = await this.db('organizations')
        .where('name', orgData.name)
        .first();

      if (existing) {
        return existing.id;
      }

      const [org] = await this.db('organizations')
        .insert({
          id: uuidv4(),
          name: orgData.name,
          organization_type: orgData.organization_type,
          url: orgData.url,
          data_source: orgData.data_source,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      return org.id;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to find/create organization');
      throw error;
    }
  }

  async saveService(service) {
    const trx = await this.db.transaction();

    try {
      // Check for existing service
      const existing = await trx('services')
        .where('name', service.name)
        .where('organization_id', service.organization_id)
        .first();

      if (existing) {
        logger.info({ service: service.name }, 'Service already exists, updating');
        
        // Update existing service
        await trx('services')
          .where('id', existing.id)
          .update({
            description: service.description,
            categories: service.categories,
            keywords: service.keywords,
            url: service.url,
            email: service.email,
            updated_at: new Date()
          });
          
        service.id = existing.id;
      } else {
        // Insert new service
        const { location, contact, ...serviceData } = service;
        
        await trx('services').insert({
          ...serviceData,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Handle location
      if (service.location) {
        const existingLocation = await trx('locations')
          .where('service_id', service.id)
          .first();

        if (existingLocation) {
          const { lat, lng, ...locationData } = service.location;
          await trx('locations')
            .where('id', existingLocation.id)
            .update({
              ...locationData,
              latitude: lat,
              longitude: lng,
              updated_at: new Date()
            });
        } else {
          const { lat, lng, ...locationData } = service.location;
          await trx('locations').insert({
            id: uuidv4(),
            service_id: service.id,
            ...locationData,
            latitude: lat,
            longitude: lng,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      // Handle contact
      if (service.contact) {
        const existingContact = await trx('contacts')
          .where('service_id', service.id)
          .first();

        const phoneData = service.contact.phone ? [{
          number: normalizePhoneNumber(service.contact.phone),
          type: 'voice'
        }] : [];

        if (existingContact) {
          await trx('contacts')
            .where('id', existingContact.id)
            .update({
              phone: JSON.stringify(phoneData),
              email: service.contact.email,
              updated_at: new Date()
            });
        } else {
          await trx('contacts').insert({
            id: uuidv4(),
            service_id: service.id,
            phone: JSON.stringify(phoneData),
            email: service.contact.email,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      await trx.commit();
      this.stats.servicesProcessed++;
      logger.info({ service: service.name }, 'Service saved successfully');
    } catch (error) {
      await trx.rollback();
      logger.error({ 
        error: error.message,
        service: service.name 
      }, 'Failed to save service');
      throw error;
    }
  }
}

export async function createHeadspaceScraper(db, options) {
  return new HeadspaceScraper(db, options);
}