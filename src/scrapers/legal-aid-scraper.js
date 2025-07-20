import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'legal-aid-scraper' });

export class LegalAidScraper {
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
    logger.info('Starting Legal Aid Queensland scrape');
    
    try {
      // Get or create the organization
      const orgId = await this.findOrCreateOrganization({
        name: 'Legal Aid Queensland',
        organization_type: 'government',
        url: 'https://www.legalaid.qld.gov.au',
        data_source: 'legal_aid_qld'
      });

      // Legal Aid Queensland offices with youth services
      const offices = [
        {
          name: 'Legal Aid Queensland - Brisbane',
          address: '44 Herschel Street, Brisbane QLD 4000',
          phone: '1300 651 188',
          region: 'brisbane',
          lat: -27.4698, lng: 153.0251,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Caboolture',
          address: '79 King Street, Caboolture QLD 4510',
          phone: '1300 651 188',
          region: 'brisbane',
          lat: -27.0849, lng: 152.9519,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Cairns',
          address: '104 Grafton Street, Cairns QLD 4870',
          phone: '1300 651 188',
          region: 'cairns',
          lat: -16.9228, lng: 145.7747,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Gold Coast',
          address: 'Level 3, 25 Elkhorn Avenue, Surfers Paradise QLD 4217',
          phone: '1300 651 188',
          region: 'gold_coast',
          lat: -28.0034, lng: 153.4302,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Inala',
          address: '20 Wirraway Parade, Inala QLD 4077',
          phone: '1300 651 188',
          region: 'brisbane',
          lat: -27.5975, lng: 152.9734,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Ipswich',
          address: '117 Brisbane Street, Ipswich QLD 4305',
          phone: '1300 651 188',
          region: 'brisbane',
          lat: -27.6145, lng: 152.7585,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Mackay',
          address: '44 Nelson Street, Mackay QLD 4740',
          phone: '1300 651 188',
          region: 'mackay',
          lat: -21.1430, lng: 149.1860,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Mount Isa',
          address: '20 Miles Street, Mount Isa QLD 4825',
          phone: '1300 651 188',
          region: 'mount_isa',
          lat: -20.7295, lng: 139.4920,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Rockhampton',
          address: '209 Bolsover Street, Rockhampton QLD 4700',
          phone: '1300 651 188',
          region: 'rockhampton',
          lat: -23.3765, lng: 150.5095,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Sunshine Coast',
          address: 'Shop 14, 20 Bunker Road, Maroochydore QLD 4558',
          phone: '1300 651 188',
          region: 'sunshine_coast',
          lat: -26.6523, lng: 153.0905,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Toowoomba',
          address: '1/46 Neil Street, Toowoomba QLD 4350',
          phone: '1300 651 188',
          region: 'toowoomba',
          lat: -27.5623, lng: 151.9507,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Townsville',
          address: 'Level 1, 340 Ross River Road, Aitkenvale QLD 4814',
          phone: '1300 651 188',
          region: 'townsville',
          lat: -19.2928, lng: 146.7599,
          hasYouthService: true
        },
        {
          name: 'Legal Aid Queensland - Bundaberg',
          address: '3rd Floor, WIN Tower, 41-43 Targo Street, Bundaberg QLD 4670',
          phone: '1300 651 188',
          region: 'bundaberg',
          lat: -24.8669, lng: 152.3522,
          hasYouthService: true
        }
      ];

      // Process each office
      for (const office of offices) {
        try {
          const service = await this.createServiceFromOffice(office, orgId);
          await this.saveService(service);
          this.stats.servicesFound++;
        } catch (error) {
          logger.error({ 
            error: error.message,
            office: office.name 
          }, 'Failed to process office');
          this.stats.errors++;
        }
      }

      // Also create a general Youth Legal Service entry
      const youthLegalService = {
        id: uuidv4(),
        organization_id: orgId,
        name: 'Youth Legal Service - Legal Aid Queensland',
        description: `Free specialist legal help for young people under 18 years. Services include:
- Criminal law representation in Children's Court
- Legal advice for police interviews
- Bail applications and variations
- Representation for serious charges
- Child protection matters
- Education law (suspensions and exclusions)  
- Fines and SPER debt
- Victims of crime assistance
- Family law issues affecting young people

The Youth Legal Service has specialist youth lawyers who understand the unique needs of young people in the justice system. Interpreters available. Confidential service.`,
        url: 'https://www.legalaid.qld.gov.au/Find-legal-information/Criminal-justice/Youth-justice',
        status: 'active',
        minimum_age: 10,
        maximum_age: 17,
        youth_specific: true,
        indigenous_specific: false,
        categories: ['legal_aid', 'court_support', 'advocacy'],
        keywords: ['legal aid', 'lawyer', 'court', 'criminal', 'youth justice', 'children\'s court', 'bail', 'free legal help'],
        data_source: 'legal_aid_qld',
        source_url: 'https://www.legalaid.qld.gov.au'
      };

      await this.saveService(youthLegalService);
      this.stats.servicesFound++;

      logger.info({
        stats: this.stats
      }, 'Legal Aid Queensland scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
  }

  async createServiceFromOffice(office, orgId) {
    const serviceId = uuidv4();
    
    return {
      id: serviceId,
      organization_id: orgId,
      name: `${office.name} - Youth Legal Service`,
      description: `Free legal help for young people under 18 at the ${office.name.replace('Legal Aid Queensland - ', '')} office. Services include:
- Criminal law advice and representation
- Children's Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.`,
      url: 'https://www.legalaid.qld.gov.au',
      status: 'active',
      minimum_age: 10,
      maximum_age: 17,
      youth_specific: true,
      indigenous_specific: false,
      categories: ['legal_aid', 'court_support', 'advocacy'],
      keywords: ['legal aid', 'lawyer', 'court', 'criminal', 'youth', 'children\'s court', 'free legal help'],
      data_source: 'legal_aid_qld',
      location: {
        address_1: office.address.split(',')[0],
        city: office.address.split(',')[1]?.trim() || office.name.split(' - ')[1],
        state_province: 'QLD',
        postal_code: office.address.match(/\d{4}/)?.[0] || '4000',
        region: office.region,
        lat: office.lat,
        lng: office.lng
      },
      contact: {
        phone: office.phone
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

export async function createLegalAidScraper(db, options) {
  return new LegalAidScraper(db, options);
}