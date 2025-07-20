import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'crisis-support-scraper' });

export class CrisisSupportScraper {
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
    logger.info('Starting Crisis and Emergency Support services scrape');
    
    try {
      // Process multiple crisis support organizations
      const organizations = [
        {
          name: 'Kids Helpline',
          type: 'non_profit',
          url: 'https://kidshelpline.com.au',
          services: await this.getKidsHelplineServices()
        },
        {
          name: 'Brisbane Youth Service',
          type: 'non_profit',
          url: 'https://brisyouth.org',
          services: await this.getBYSServices()
        },
        {
          name: '1800RESPECT',
          type: 'government',
          url: 'https://www.1800respect.org.au',
          services: await this.getRespectServices()
        }
      ];

      for (const org of organizations) {
        // Get or create organization
        const orgId = await this.findOrCreateOrganization({
          name: org.name,
          organization_type: org.type,
          url: org.url,
          data_source: 'crisis_support'
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
      }, 'Crisis and Emergency Support services scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
  }

  async getKidsHelplineServices() {
    return [
      {
        id: uuidv4(),
        name: 'Kids Helpline - 24/7 Phone and Online Counselling',
        description: `Free, confidential 24/7 phone and online counselling service for young people aged 5-25. Services include:
- Crisis support and suicide prevention
- Mental health and emotional wellbeing support
- Family and relationship issues
- Bullying and cyberbullying support
- School and study stress
- Alcohol and drug concerns
- Sexual health and identity
- Self-harm and eating disorders
- Abuse and violence support

Professional counsellors available 24/7 by phone (1800 55 1800), WebChat, or email. No issue too big or small.`,
        url: 'https://kidshelpline.com.au',
        status: 'active',
        minimum_age: 5,
        maximum_age: 25,
        youth_specific: true,
        indigenous_specific: false,
        categories: ['mental_health', 'crisis_support', 'family_support'],
        keywords: ['crisis', 'counselling', 'helpline', 'mental health', 'suicide', 'emergency', '24/7'],
        data_source: 'crisis_support',
        location: {
          address_1: 'Online and Phone Service',
          city: 'Queensland',
          state_province: 'QLD',
          postal_code: '4000',
          region: 'statewide',
          lat: -27.4698,
          lng: 153.0251
        },
        contact: {
          phone: '1800 55 1800'
        }
      },
      {
        id: uuidv4(),
        name: 'Kids Helpline @ School Program',
        description: `Free counselling sessions delivered in Queensland schools. Services include:
- Individual counselling sessions at school
- Group sessions on mental health topics
- Crisis response for schools
- Support for students affected by critical incidents
- Referrals to other services
- Follow-up support

Available to primary and secondary schools across Queensland. Schools can request this service for students who need extra support.`,
        url: 'https://kidshelpline.com.au/schools',
        status: 'active',
        minimum_age: 5,
        maximum_age: 18,
        youth_specific: true,
        indigenous_specific: false,
        categories: ['mental_health', 'education_training'],
        keywords: ['school', 'counselling', 'mental health', 'students'],
        data_source: 'crisis_support',
        location: {
          address_1: 'Available in Schools',
          city: 'Queensland',
          state_province: 'QLD',
          postal_code: '4000',
          region: 'statewide',
          lat: -27.4698,
          lng: 153.0251
        },
        contact: {
          phone: '1800 55 1800'
        }
      }
    ];
  }

  async getBYSServices() {
    return [
      {
        id: uuidv4(),
        name: 'Brisbane Youth Service - Crisis Accommodation',
        description: `Emergency and crisis accommodation for young people aged 12-25 who are homeless or at risk. Services include:
- 24/7 crisis accommodation
- Emergency beds (up to 3 nights)
- Medium-term accommodation (up to 3 months)
- Meals and basic necessities
- Case management and support planning
- Health services on-site
- Education and employment support
- Life skills programs
- Referrals to permanent housing

Drop-in centre open 7 days. No referral needed. Priority given to young people escaping violence or with nowhere safe to sleep.`,
        url: 'https://brisyouth.org',
        status: 'active',
        minimum_age: 12,
        maximum_age: 25,
        youth_specific: true,
        indigenous_specific: false,
        categories: ['housing', 'crisis_support', 'case_management'],
        keywords: ['homeless', 'crisis', 'accommodation', 'emergency', 'housing', 'shelter'],
        data_source: 'crisis_support',
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
          phone: '(07) 3620 2400'
        }
      },
      {
        id: uuidv4(),
        name: 'Brisbane Youth Service - Mobile Support Team',
        description: `Outreach service finding and supporting young people experiencing homelessness. Services include:
- Street outreach in Brisbane CBD and surrounds
- Mobile support across greater Brisbane
- Emergency relief (food, clothing, hygiene packs)
- Transport to safe accommodation
- Connection to health services
- Advocacy and crisis intervention
- Flexible support based on young person's needs
- After-hours response for crisis situations

Team operates 7 days a week including evenings. Can be contacted through BYS main number.`,
        url: 'https://brisyouth.org',
        status: 'active',
        minimum_age: 12,
        maximum_age: 25,
        youth_specific: true,
        indigenous_specific: false,
        categories: ['crisis_support', 'housing', 'outreach'],
        keywords: ['outreach', 'mobile', 'homeless', 'street', 'crisis', 'emergency'],
        data_source: 'crisis_support',
        location: {
          address_1: 'Mobile Service',
          city: 'Brisbane',
          state_province: 'QLD',
          postal_code: '4000',
          region: 'brisbane',
          lat: -27.4698,
          lng: 153.0251
        },
        contact: {
          phone: '(07) 3620 2400'
        }
      }
    ];
  }

  async getRespectServices() {
    return [
      {
        id: uuidv4(),
        name: '1800RESPECT - Youth Sexual Assault and Family Violence Support',
        description: `24/7 national sexual assault, domestic and family violence counselling service with specialist youth support. Services include:
- Crisis counselling for sexual assault
- Domestic and family violence support
- Safety planning for young people
- Support for young people who have experienced abuse
- Information about consent and healthy relationships
- Referrals to local youth services
- Support for friends and family
- Interpreter service available

Free, confidential service available 24/7. Trained counsellors understand issues facing young people. Online chat available.`,
        url: 'https://www.1800respect.org.au',
        status: 'active',
        minimum_age: 12,
        maximum_age: 25,
        youth_specific: false,
        indigenous_specific: false,
        categories: ['crisis_support', 'family_support', 'mental_health'],
        keywords: ['sexual assault', 'family violence', 'domestic violence', 'crisis', 'abuse', 'counselling'],
        data_source: 'crisis_support',
        location: {
          address_1: 'National Phone Service',
          city: 'Queensland',
          state_province: 'QLD',
          postal_code: '4000',
          region: 'statewide',
          lat: -27.4698,
          lng: 153.0251
        },
        contact: {
          phone: '1800 737 732'
        }
      },
      {
        id: uuidv4(),
        name: 'Yarning Circle - Aboriginal and Torres Strait Islander Support Line',
        description: `Culturally appropriate crisis support through 1800RESPECT for Aboriginal and Torres Strait Islander people affected by family violence and sexual assault. Services include:
- Yarning with Aboriginal and Torres Strait Islander counsellors
- Cultural safety and understanding
- Support in language where available
- Connection to local Aboriginal services
- Support for stolen generations survivors
- Family violence and sexual assault counselling
- Safety planning with cultural considerations

Available 24/7 through 1800RESPECT. Ask to speak with an Aboriginal or Torres Strait Islander counsellor.`,
        url: 'https://www.1800respect.org.au',
        status: 'active',
        minimum_age: 12,
        maximum_age: 99,
        youth_specific: false,
        indigenous_specific: true,
        categories: ['crisis_support', 'cultural_support', 'family_support'],
        keywords: ['aboriginal', 'torres strait islander', 'yarning', 'crisis', 'family violence', 'cultural'],
        data_source: 'crisis_support',
        location: {
          address_1: 'National Phone Service',
          city: 'Queensland',
          state_province: 'QLD',
          postal_code: '4000',
          region: 'statewide',
          lat: -27.4698,
          lng: 153.0251
        },
        contact: {
          phone: '1800 737 732'
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

export async function createCrisisSupportScraper(db, options) {
  return new CrisisSupportScraper(db, options);
}