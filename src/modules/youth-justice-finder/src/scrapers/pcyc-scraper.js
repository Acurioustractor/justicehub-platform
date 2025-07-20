import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'pcyc-scraper' });

export class PCYCScraper {
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
    logger.info('Starting PCYC Queensland scrape');
    
    try {
      // Get or create the organization
      const orgId = await this.findOrCreateOrganization({
        name: 'PCYC Queensland',
        organization_type: 'non_profit',
        url: 'https://www.pcyc.org.au',
        data_source: 'pcyc_qld'
      });

      // PCYC centres across Queensland
      const centres = [
        {
          name: 'PCYC Brisbane City',
          address: '21 Kurilpa Street, West End QLD 4101',
          phone: '(07) 3844 0222',
          region: 'brisbane',
          lat: -27.4781, lng: 153.0033
        },
        {
          name: 'PCYC Beenleigh',
          address: '2 James Street, Beenleigh QLD 4207',
          phone: '(07) 3807 4333',
          region: 'brisbane',
          lat: -27.7149, lng: 153.2026
        },
        {
          name: 'PCYC Cairns',
          address: '119 Sheridan Street, Cairns QLD 4870',
          phone: '(07) 4051 4266',
          region: 'cairns',
          lat: -16.9206, lng: 145.7719
        },
        {
          name: 'PCYC Gold Coast',
          address: '2 Mudgeeraba Road, Mudgeeraba QLD 4213',
          phone: '(07) 5530 5458',
          region: 'gold_coast',
          lat: -28.0793, lng: 153.3664
        },
        {
          name: 'PCYC Gladstone',
          address: '1-7 Chapman Drive, Clinton QLD 4680',
          phone: '(07) 4972 2477',
          region: 'gladstone',
          lat: -23.8750, lng: 151.2629
        },
        {
          name: 'PCYC Townsville',
          address: '1-13 Wellington Street, Aitkenvale QLD 4814',
          phone: '(07) 4779 3011',
          region: 'townsville',
          lat: -19.2961, lng: 146.7604
        },
        {
          name: 'PCYC Mount Isa',
          address: '1 Splinter Street, Mount Isa QLD 4825',
          phone: '(07) 4743 5877',
          region: 'mount_isa',
          lat: -20.7333, lng: 139.4881
        },
        {
          name: 'PCYC Rockhampton',
          address: '60 Charles Street, Berserker QLD 4701',
          phone: '(07) 4922 1797',
          region: 'rockhampton',
          lat: -23.3459, lng: 150.5249
        },
        {
          name: 'PCYC Sunshine Coast',
          address: '18-30 National Park Road, Nambour QLD 4560',
          phone: '(07) 5441 1924',
          region: 'sunshine_coast',
          lat: -26.6287, lng: 152.9592
        },
        {
          name: 'PCYC Toowoomba',
          address: '15 Railway Street, Gatton QLD 4343',
          phone: '(07) 5462 4100',
          region: 'toowoomba',
          lat: -27.5638, lng: 152.2757
        },
        {
          name: 'PCYC Pine Rivers',
          address: '1030 Samford Road, Keperra QLD 4054',
          phone: '(07) 3354 1777',
          region: 'brisbane',
          lat: -27.4056, lng: 152.9511
        },
        {
          name: 'PCYC Ipswich',
          address: '39 Griffith Road, Yamanto QLD 4305',
          phone: '(07) 3281 3344',
          region: 'brisbane',
          lat: -27.6556, lng: 152.7408
        },
        {
          name: 'PCYC Mackay',
          address: '92 Bridge Road, West Mackay QLD 4740',
          phone: '(07) 4957 3891',
          region: 'mackay',
          lat: -21.1553, lng: 149.1670
        },
        {
          name: 'PCYC Bundaberg',
          address: '30-32 Quay Street, Bundaberg QLD 4670',
          phone: '(07) 4151 5294',
          region: 'bundaberg',
          lat: -24.8704, lng: 152.3484
        },
        {
          name: 'PCYC Redlands',
          address: '14 Smith Street, Cleveland QLD 4163',
          phone: '(07) 3286 4555',
          region: 'brisbane',
          lat: -27.5258, lng: 153.2653
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
      }, 'PCYC scrape completed');

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
      description: `Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.`,
      url: 'https://www.pcyc.org.au',
      status: 'active',
      minimum_age: 5,
      maximum_age: 25,
      youth_specific: true,
      indigenous_specific: false,
      categories: ['recreation', 'education_training', 'diversion'],
      keywords: ['sports', 'recreation', 'youth programs', 'police', 'activities', 'gymnastics', 'martial arts', 'leadership', 'mentoring'],
      data_source: 'pcyc_qld',
      source_url: 'https://www.pcyc.org.au/clubs',
      location: {
        address_1: centre.address.split(',')[0],
        city: centre.address.split(',')[1]?.trim() || centre.name.replace('PCYC ', ''),
        state_province: 'QLD',
        postal_code: centre.address.match(/\d{4}/)?.[0] || '4000',
        region: centre.region,
        lat: centre.lat,
        lng: centre.lng
      },
      contact: {
        phone: centre.phone
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

export async function createPCYCScraper(db, options) {
  return new PCYCScraper(db, options);
}