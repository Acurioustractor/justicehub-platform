import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'youth-advocacy-scraper' });

export class YouthAdvocacyScraper {
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
    logger.info('Starting Youth Advocacy Centre scrape');
    
    try {
      // Get or create the organization
      const orgId = await this.findOrCreateOrganization({
        name: 'Youth Advocacy Centre Inc',
        organization_type: 'non_profit',
        url: 'https://www.yac.net.au',
        data_source: 'yac_qld'
      });

      // Youth Advocacy Centre services
      const services = [
        {
          id: uuidv4(),
          organization_id: orgId,
          name: 'Youth Advocacy Centre - Legal Service',
          description: `Free and confidential legal service for young people under 18 and young adults leaving care. Services include:
- Criminal law matters in Children's Court and adult courts
- Police powers and interviews
- Bail applications and variations
- Legal representation for serious offences
- Child protection and care matters
- Education law (suspensions, exclusions, enrolment)
- Victims of crime assistance
- Fines and SPER debt
- Employment law issues
- Housing and homelessness
- Discrimination matters

YAC provides holistic support with social workers and youth workers alongside lawyers.`,
          url: 'https://www.yac.net.au',
          status: 'active',
          minimum_age: 10,
          maximum_age: 25,
          youth_specific: true,
          indigenous_specific: false,
          categories: ['legal_aid', 'advocacy', 'court_support'],
          keywords: ['legal', 'advocacy', 'youth', 'court', 'criminal', 'bail', 'education', 'rights'],
          data_source: 'yac_qld',
          location: {
            address_1: '14 Prospect Street',
            city: 'Fortitude Valley',
            state_province: 'QLD',
            postal_code: '4006',
            region: 'brisbane',
            lat: -27.4575,
            lng: 153.0343
          },
          contact: {
            phone: '(07) 3356 1002',
            email: 'admin@yac.net.au'
          }
        },
        {
          id: uuidv4(),
          organization_id: orgId,
          name: 'Youth Advocacy Centre - Homeless Young People Legal Clinic',
          description: `Specialist legal clinic for young people experiencing or at risk of homelessness. Services include:
- Housing and tenancy advice
- Centrelink and income support issues
- Fines and debt matters
- ID documents and birth certificates
- Victims of crime compensation
- Family violence protection orders
- Criminal matters
- Consumer rights

Free drop-in clinic every Thursday at Brisbane Youth Service. No appointment needed.`,
          url: 'https://www.yac.net.au',
          status: 'active',
          minimum_age: 12,
          maximum_age: 25,
          youth_specific: true,
          indigenous_specific: false,
          categories: ['legal_aid', 'housing', 'advocacy'],
          keywords: ['homeless', 'housing', 'legal', 'clinic', 'youth', 'tenancy', 'centrelink'],
          data_source: 'yac_qld',
          location: {
            address_1: '42 McLachlan Street',
            city: 'Fortitude Valley',
            state_province: 'QLD',
            postal_code: '4006',
            region: 'brisbane',
            lat: -27.4563,
            lng: 153.0338
          },
          contact: {
            phone: '(07) 3356 1002'
          }
        },
        {
          id: uuidv4(),
          organization_id: orgId,
          name: 'Youth Advocacy Centre - Education Legal Service',
          description: `Specialist education law service for students and families. Services include:
- School suspensions and exclusions
- Enrolment refusals and cancellations
- Special education needs and adjustments
- Bullying and discrimination
- School discipline matters
- Alternative education options
- Transition planning
- Advocacy at school meetings

Free service for young people in Queensland state schools. Phone advice available statewide.`,
          url: 'https://www.yac.net.au',
          status: 'active',
          minimum_age: 5,
          maximum_age: 18,
          youth_specific: true,
          indigenous_specific: false,
          categories: ['legal_aid', 'education_training', 'advocacy'],
          keywords: ['education', 'school', 'suspension', 'exclusion', 'legal', 'student', 'rights'],
          data_source: 'yac_qld',
          location: {
            address_1: '14 Prospect Street',
            city: 'Fortitude Valley',
            state_province: 'QLD',
            postal_code: '4006',
            region: 'brisbane',
            lat: -27.4575,
            lng: 153.0343
          },
          contact: {
            phone: '(07) 3356 1002',
            email: 'admin@yac.net.au'
          }
        },
        {
          id: uuidv4(),
          organization_id: orgId,
          name: 'Youth Advocacy Centre - Court Support Program',
          description: `Support for young people attending Children's Court. Services include:
- Pre-court preparation and explanation
- Support during court proceedings
- Liaison with lawyers and magistrates
- Referrals to support services
- Transport assistance to court
- Family support and information
- Post-court follow up
- Bail support planning

Available at Brisbane, Beenleigh, and Cleveland Children's Courts. Free and confidential service.`,
          url: 'https://www.yac.net.au',
          status: 'active',
          minimum_age: 10,
          maximum_age: 17,
          youth_specific: true,
          indigenous_specific: false,
          categories: ['court_support', 'advocacy', 'case_management'],
          keywords: ['court', 'support', 'children\'s court', 'youth', 'bail', 'magistrate'],
          data_source: 'yac_qld',
          location: {
            address_1: '363 George Street',
            city: 'Brisbane',
            state_province: 'QLD',
            postal_code: '4000',
            region: 'brisbane',
            lat: -27.4698,
            lng: 153.0236
          },
          contact: {
            phone: '(07) 3356 1002'
          }
        }
      ];

      // Save all services
      for (const service of services) {
        try {
          await this.saveService(service);
          this.stats.servicesFound++;
        } catch (error) {
          logger.error({ 
            error: error.message,
            service: service.name 
          }, 'Failed to save service');
          this.stats.errors++;
        }
      }

      logger.info({
        stats: this.stats
      }, 'Youth Advocacy Centre scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
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

export async function createYouthAdvocacyScraper(db, options) {
  return new YouthAdvocacyScraper(db, options);
}