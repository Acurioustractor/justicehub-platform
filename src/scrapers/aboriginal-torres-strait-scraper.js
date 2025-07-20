import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'aboriginal-torres-strait-scraper' });

export class AboriginalTorresStraitScraper {
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
    logger.info('Starting Aboriginal and Torres Strait Islander youth services scrape');
    
    try {
      // Process multiple organizations
      const organizations = [
        {
          name: 'Aboriginal and Torres Strait Islander Legal Service',
          type: 'non_profit',
          url: 'https://www.atsils.org.au',
          services: await this.getATSILSServices()
        },
        {
          name: 'Murri Youth Services',
          type: 'non_profit',
          url: 'https://www.yfs.org.au',
          services: await this.getMurriYouthServices()
        },
        {
          name: 'Aboriginal and Torres Strait Islander Community Health Service Brisbane',
          type: 'health',
          url: 'https://www.atsichsbrisbane.org.au',
          services: await this.getATSICHSServices()
        }
      ];

      for (const org of organizations) {
        // Get or create organization
        const orgId = await this.findOrCreateOrganization({
          name: org.name,
          organization_type: org.type,
          url: org.url,
          data_source: 'aboriginal_torres_strait'
        });

        // Save all services for this organization
        for (const service of org.services) {
          try {
            await this.saveService({ ...service, organization_id: orgId });
            this.stats.servicesFound++;
          } catch (error) {
            logger.error({ 
              error: error.message,
              service: service.name 
            }, 'Failed to save service');
            this.stats.errors++;
          }
        }
      }

      logger.info({
        stats: this.stats
      }, 'Aboriginal and Torres Strait Islander services scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
  }

  async getATSILSServices() {
    return [
      {
        id: uuidv4(),
        name: 'ATSILS Youth Legal Service - Brisbane',
        description: `Free culturally appropriate legal services for Aboriginal and Torres Strait Islander young people. Services include:
- Criminal law representation in Children's Court
- Bail applications and support
- Legal advice for police matters
- Child protection representation
- Victims of crime assistance
- Stolen Wages applications
- Family law matters
- Anti-discrimination matters

Culturally safe service with Aboriginal and Torres Strait Islander lawyers and support workers. Field officers provide support beyond legal representation.`,
        url: 'https://www.atsils.org.au',
        status: 'active',
        minimum_age: 10,
        maximum_age: 25,
        youth_specific: false,
        indigenous_specific: true,
        categories: ['legal_aid', 'court_support', 'advocacy', 'cultural_support'],
        keywords: ['aboriginal', 'torres strait islander', 'indigenous', 'legal', 'court', 'cultural', 'youth'],
        data_source: 'aboriginal_torres_strait',
        location: {
          address_1: '37 Herschel Street',
          city: 'Brisbane',
          state_province: 'QLD',
          postal_code: '4000',
          region: 'brisbane',
          lat: -27.4706,
          lng: 153.0242
        },
        contact: {
          phone: '1800 012 255'
        }
      },
      {
        id: uuidv4(),
        name: 'ATSILS Youth Legal Service - Cairns',
        description: `Culturally appropriate legal support for Aboriginal and Torres Strait Islander youth in Far North Queensland. Services include court representation, bail support, and connection to cultural programs.`,
        url: 'https://www.atsils.org.au',
        status: 'active',
        minimum_age: 10,
        maximum_age: 25,
        youth_specific: false,
        indigenous_specific: true,
        categories: ['legal_aid', 'court_support', 'cultural_support'],
        keywords: ['aboriginal', 'torres strait islander', 'legal', 'cairns', 'youth'],
        data_source: 'aboriginal_torres_strait',
        location: {
          address_1: '104 Grafton Street',
          city: 'Cairns',
          state_province: 'QLD',
          postal_code: '4870',
          region: 'cairns',
          lat: -16.9228,
          lng: 145.7747
        },
        contact: {
          phone: '1800 012 255'
        }
      },
      {
        id: uuidv4(),
        name: 'ATSILS Youth Legal Service - Townsville',
        description: `Free legal services for Aboriginal and Torres Strait Islander young people in North Queensland. Includes criminal law, child protection, and cultural support services.`,
        url: 'https://www.atsils.org.au',
        status: 'active',
        minimum_age: 10,
        maximum_age: 25,
        youth_specific: false,
        indigenous_specific: true,
        categories: ['legal_aid', 'court_support', 'cultural_support'],
        keywords: ['aboriginal', 'torres strait islander', 'legal', 'townsville', 'youth'],
        data_source: 'aboriginal_torres_strait',
        location: {
          address_1: '137 Flinders Street',
          city: 'Townsville',
          state_province: 'QLD',
          postal_code: '4810',
          region: 'townsville',
          lat: -19.2590,
          lng: 146.8181
        },
        contact: {
          phone: '1800 012 255'
        }
      }
    ];
  }

  async getMurriYouthServices() {
    return [
      {
        id: uuidv4(),
        name: 'Murri Youth Diversion Program - Logan',
        description: `Culturally appropriate diversion program for Aboriginal and Torres Strait Islander young people. Services include:
- Pre and post court support
- Cultural mentoring and activities
- Connection to Elders
- Bush camps and cultural healing
- Education and employment pathways
- Family support and mediation
- Substance abuse counselling
- Life skills development

Program aims to reduce reoffending through cultural connection and intensive support.`,
        url: 'https://www.yfs.org.au',
        status: 'active',
        minimum_age: 10,
        maximum_age: 17,
        youth_specific: true,
        indigenous_specific: true,
        categories: ['diversion', 'cultural_support', 'case_management', 'mentoring'],
        keywords: ['murri', 'aboriginal', 'diversion', 'cultural', 'youth', 'logan'],
        data_source: 'aboriginal_torres_strait',
        location: {
          address_1: '381 Kingston Road',
          city: 'Slacks Creek',
          state_province: 'QLD',
          postal_code: '4127',
          region: 'brisbane',
          lat: -27.6497,
          lng: 153.1346
        },
        contact: {
          phone: '(07) 3826 1500'
        }
      },
      {
        id: uuidv4(),
        name: 'Murri Youth Homelessness Service',
        description: `Specialist homelessness support for Aboriginal and Torres Strait Islander young people aged 12-21. Services include:
- Emergency accommodation
- Transitional housing support
- Case management
- Cultural activities and connection
- Education and training support
- Health and wellbeing programs
- Family reconciliation
- Independent living skills

Culturally safe service with Aboriginal workers and regular Elder involvement.`,
        url: 'https://www.yfs.org.au',
        status: 'active',
        minimum_age: 12,
        maximum_age: 21,
        youth_specific: true,
        indigenous_specific: true,
        categories: ['housing', 'case_management', 'cultural_support'],
        keywords: ['murri', 'aboriginal', 'homeless', 'housing', 'youth', 'accommodation'],
        data_source: 'aboriginal_torres_strait',
        location: {
          address_1: '655 Kingston Road',
          city: 'Loganlea',
          state_province: 'QLD',
          postal_code: '4131',
          region: 'brisbane',
          lat: -27.6750,
          lng: 153.1389
        },
        contact: {
          phone: '(07) 3826 1500'
        }
      }
    ];
  }

  async getATSICHSServices() {
    return [
      {
        id: uuidv4(),
        name: 'Aboriginal & Torres Strait Islander Youth Health Service',
        description: `Holistic health and wellbeing services for Aboriginal and Torres Strait Islander young people. Services include:
- Youth health checks and immunizations
- Mental health and social emotional wellbeing support
- Sexual health education and services
- Drug and alcohol programs
- Nutrition and healthy lifestyle programs
- Cultural activities and camps
- Deadly Choices program
- School-based health promotion

Bulk billing available. No referral needed. Transport assistance available.`,
        url: 'https://www.atsichsbrisbane.org.au',
        status: 'active',
        minimum_age: 12,
        maximum_age: 25,
        youth_specific: true,
        indigenous_specific: true,
        categories: ['mental_health', 'substance_abuse', 'health', 'cultural_support'],
        keywords: ['aboriginal', 'torres strait islander', 'health', 'youth', 'mental health', 'cultural'],
        data_source: 'aboriginal_torres_strait',
        location: {
          address_1: '55 Annerley Road',
          city: 'Woolloongabba',
          state_province: 'QLD',
          postal_code: '4102',
          region: 'brisbane',
          lat: -27.4974,
          lng: 153.0345
        },
        contact: {
          phone: '(07) 3240 8900'
        }
      },
      {
        id: uuidv4(),
        name: 'Strong Young Mums Program',
        description: `Support program for young Aboriginal and Torres Strait Islander mothers aged 14-25. Services include:
- Antenatal and postnatal care
- Parenting support and education
- Baby health checks
- Breastfeeding support
- Cultural activities for mums and bubs
- Playgroups and social support
- Connection to childcare and education
- Housing and Centrelink assistance

Home visits available. Partner and family involvement encouraged.`,
        url: 'https://www.atsichsbrisbane.org.au',
        status: 'active',
        minimum_age: 14,
        maximum_age: 25,
        youth_specific: true,
        indigenous_specific: true,
        categories: ['family_support', 'health', 'cultural_support'],
        keywords: ['aboriginal', 'torres strait islander', 'young mothers', 'parenting', 'health'],
        data_source: 'aboriginal_torres_strait',
        location: {
          address_1: '55 Annerley Road',
          city: 'Woolloongabba',
          state_province: 'QLD',
          postal_code: '4102',
          region: 'brisbane',
          lat: -27.4974,
          lng: 153.0345
        },
        contact: {
          phone: '(07) 3240 8900'
        }
      }
    ];
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

export async function createAboriginalTorresStraitScraper(db, options) {
  return new AboriginalTorresStraitScraper(db, options);
}