import pino from 'pino';
import { createHash } from 'crypto';
import stringSimilarity from 'string-similarity';
import db from '../config/database.js';

const logger = pino({ name: 'duplicate-detector' });

export class DuplicateDetector {
  constructor(options = {}) {
    this.options = {
      nameThreshold: options.nameThreshold || 0.85,
      addressThreshold: options.addressThreshold || 0.9,
      phoneThreshold: options.phoneThreshold || 1.0,
      compositeThreshold: options.compositeThreshold || 0.8,
      ...options
    };
  }

  /**
   * Check if a service is a duplicate of existing services
   */
  async isDuplicate(service) {
    try {
      // Get potential duplicates using various strategies
      const candidates = await this.findCandidates(service);
      
      if (candidates.length === 0) {
        return { isDuplicate: false };
      }

      // Score each candidate
      const scoredCandidates = candidates.map(candidate => ({
        ...candidate,
        score: this.calculateSimilarityScore(service, candidate)
      }));

      // Find best match
      const bestMatch = scoredCandidates.reduce((best, current) => 
        current.score.composite > best.score.composite ? current : best
      );

      const isDuplicate = bestMatch.score.composite >= this.options.compositeThreshold;

      return {
        isDuplicate,
        match: isDuplicate ? bestMatch : null,
        candidates: scoredCandidates
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to check for duplicates');
      throw error;
    }
  }

  /**
   * Find potential duplicate candidates
   */
  async findCandidates(service) {
    const candidates = new Set();

    // Strategy 1: Exact name match
    const exactNameMatches = await db('services')
      .where('name', service.name)
      .where('status', 'active')
      .whereNot('id', service.id || '')
      .limit(10);
    
    exactNameMatches.forEach(match => candidates.add(JSON.stringify(match)));

    // Strategy 2: Similar names in same organization
    if (service.organization_id) {
      const orgMatches = await db('services')
        .where('organization_id', service.organization_id)
        .where('status', 'active')
        .whereNot('id', service.id || '')
        .limit(20);
      
      orgMatches.forEach(match => candidates.add(JSON.stringify(match)));
    }

    // Strategy 3: Trigram similarity search (PostgreSQL)
    const similarNames = await db.raw(`
      SELECT * FROM services
      WHERE status = 'active'
      AND id != ?
      AND similarity(name, ?) > 0.3
      ORDER BY similarity(name, ?) DESC
      LIMIT 20
    `, [service.id || '', service.name, service.name]);
    
    similarNames.rows.forEach(match => candidates.add(JSON.stringify(match)));

    // Strategy 4: Same phone number
    if (service.contact?.phone) {
      const phoneMatches = await db('services as s')
        .join('contacts as c', 's.id', 'c.service_id')
        .whereRaw(`c.phone::jsonb @> ?`, [JSON.stringify([{ number: service.contact.phone }])])
        .where('s.status', 'active')
        .whereNot('s.id', service.id || '')
        .select('s.*')
        .limit(10);
      
      phoneMatches.forEach(match => candidates.add(JSON.stringify(match)));
    }

    // Strategy 5: Geographic proximity (if coordinates available)
    if (service.location?.lat && service.location?.lng) {
      const nearbyServices = await db.raw(`
        SELECT s.*, ST_Distance(
          l.coordinates,
          ST_MakePoint(?, ?)::geography
        ) as distance
        FROM services s
        JOIN locations l ON s.id = l.service_id
        WHERE s.status = 'active'
        AND s.id != ?
        AND ST_DWithin(
          l.coordinates,
          ST_MakePoint(?, ?)::geography,
          1000  -- Within 1km
        )
        ORDER BY distance
        LIMIT 20
      `, [
        service.location.lng, service.location.lat,
        service.id || '',
        service.location.lng, service.location.lat
      ]);
      
      nearbyServices.rows.forEach(match => candidates.add(JSON.stringify(match)));
    }

    // Convert back to array and fetch full details
    const uniqueCandidates = Array.from(candidates).map(json => JSON.parse(json));
    
    // Fetch related data for candidates
    const candidateIds = uniqueCandidates.map(c => c.id);
    
    if (candidateIds.length > 0) {
      const locations = await db('locations')
        .whereIn('service_id', candidateIds);
      
      const contacts = await db('contacts')
        .whereIn('service_id', candidateIds);
      
      // Attach related data
      uniqueCandidates.forEach(candidate => {
        candidate.location = locations.find(l => l.service_id === candidate.id);
        candidate.contact = contacts.find(c => c.service_id === candidate.id);
      });
    }

    return uniqueCandidates;
  }

  /**
   * Calculate similarity score between two services
   */
  calculateSimilarityScore(service1, service2) {
    const scores = {
      name: 0,
      organization: 0,
      address: 0,
      phone: 0,
      description: 0,
      categories: 0
    };

    // Name similarity
    if (service1.name && service2.name) {
      scores.name = stringSimilarity.compareTwoStrings(
        this.normalizeString(service1.name),
        this.normalizeString(service2.name)
      );
    }

    // Organization match
    if (service1.organization_id && service2.organization_id) {
      scores.organization = service1.organization_id === service2.organization_id ? 1 : 0;
    }

    // Address similarity
    if (service1.location && service2.location) {
      const addr1 = this.normalizeAddress(service1.location);
      const addr2 = this.normalizeAddress(service2.location);
      scores.address = stringSimilarity.compareTwoStrings(addr1, addr2);
    }

    // Phone match
    if (service1.contact?.phone && service2.contact?.phone) {
      const phone1 = this.normalizePhone(service1.contact.phone);
      const phone2 = this.normalizePhone(service2.contact.phone);
      scores.phone = phone1 === phone2 ? 1 : 0;
    }

    // Description similarity (lighter weight)
    if (service1.description && service2.description) {
      scores.description = this.calculateDescriptionSimilarity(
        service1.description,
        service2.description
      );
    }

    // Category overlap
    if (service1.categories && service2.categories) {
      const cats1 = new Set(service1.categories);
      const cats2 = new Set(service2.categories);
      const intersection = new Set([...cats1].filter(x => cats2.has(x)));
      const union = new Set([...cats1, ...cats2]);
      scores.categories = union.size > 0 ? intersection.size / union.size : 0;
    }

    // Calculate composite score with weights
    const weights = {
      name: 0.35,
      organization: 0.20,
      address: 0.20,
      phone: 0.15,
      description: 0.05,
      categories: 0.05
    };

    const composite = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + (scores[key] * weight),
      0
    );

    return {
      ...scores,
      composite
    };
  }

  /**
   * Merge duplicate services
   */
  async mergeDuplicates(primaryId, duplicateIds) {
    const trx = await db.transaction();

    try {
      // Get all services
      const allIds = [primaryId, ...duplicateIds];
      const services = await trx('services')
        .whereIn('id', allIds)
        .orderBy('updated_at', 'desc');

      if (services.length < 2) {
        throw new Error('Not enough services to merge');
      }

      // Use most recently updated as primary
      const [primary, ...duplicates] = services;

      // Merge data
      const merged = this.mergeServiceData(primary, duplicates);

      // Update primary service
      await trx('services')
        .where('id', primary.id)
        .update({
          ...merged,
          updated_at: new Date()
        });

      // Merge locations
      await this.mergeLocations(trx, primary.id, duplicates.map(d => d.id));

      // Merge contacts
      await this.mergeContacts(trx, primary.id, duplicates.map(d => d.id));

      // Merge schedules
      await this.mergeSchedules(trx, primary.id, duplicates.map(d => d.id));

      // Log merge history
      for (const duplicate of duplicates) {
        await trx('service_history').insert({
          service_id: duplicate.id,
          change_type: 'merge',
          changed_fields: JSON.stringify(['merged_into']),
          previous_values: JSON.stringify({}),
          new_values: JSON.stringify({ merged_into: primary.id }),
          changed_by: 'duplicate_detector',
          changed_at: new Date()
        });
      }

      // Deactivate duplicates
      await trx('services')
        .whereIn('id', duplicates.map(d => d.id))
        .update({
          status: 'inactive',
          updated_at: new Date()
        });

      await trx.commit();

      logger.info({
        primary: primary.id,
        merged: duplicates.map(d => d.id)
      }, 'Successfully merged duplicates');

      return {
        success: true,
        primaryId: primary.id,
        mergedCount: duplicates.length
      };
    } catch (error) {
      await trx.rollback();
      logger.error({ error: error.message }, 'Failed to merge duplicates');
      throw error;
    }
  }

  /**
   * Batch process for finding all duplicates
   */
  async findAllDuplicates(options = {}) {
    const limit = options.limit || 1000;
    const minScore = options.minScore || this.options.compositeThreshold;

    logger.info('Starting duplicate detection batch process');

    const services = await db('services')
      .where('status', 'active')
      .orderBy('created_at', 'desc')
      .limit(limit);

    const duplicateGroups = [];
    const processed = new Set();

    for (const service of services) {
      if (processed.has(service.id)) continue;

      const result = await this.isDuplicate(service);
      
      if (result.isDuplicate) {
        const group = [service.id];
        processed.add(service.id);

        // Find all related duplicates
        for (const candidate of result.candidates) {
          if (candidate.score.composite >= minScore && !processed.has(candidate.id)) {
            group.push(candidate.id);
            processed.add(candidate.id);
          }
        }

        if (group.length > 1) {
          duplicateGroups.push({
            services: group,
            score: result.match.score.composite
          });
        }
      }
    }

    logger.info({
      servicesChecked: services.length,
      duplicateGroups: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.services.length - 1, 0)
    }, 'Duplicate detection completed');

    return duplicateGroups;
  }

  // Helper methods

  normalizeString(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  normalizeAddress(location) {
    const parts = [
      location.address_1,
      location.address_2,
      location.city,
      location.state_province,
      location.postal_code
    ].filter(Boolean);

    return this.normalizeString(parts.join(' '));
  }

  normalizePhone(phone) {
    if (typeof phone === 'string') {
      return phone.replace(/\D/g, '');
    }
    
    if (Array.isArray(phone) && phone[0]?.number) {
      return phone[0].number.replace(/\D/g, '');
    }

    return '';
  }

  calculateDescriptionSimilarity(desc1, desc2) {
    // Use simpler comparison for descriptions
    const words1 = new Set(desc1.toLowerCase().split(/\s+/));
    const words2 = new Set(desc2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  mergeServiceData(primary, duplicates) {
    const merged = { ...primary };

    // Merge fields, preferring non-null and longer values
    for (const duplicate of duplicates) {
      // Description - take longest
      if (duplicate.description && duplicate.description.length > (merged.description?.length || 0)) {
        merged.description = duplicate.description;
      }

      // Categories - union
      if (duplicate.categories) {
        merged.categories = [...new Set([...(merged.categories || []), ...duplicate.categories])];
      }

      // Keywords - union
      if (duplicate.keywords) {
        merged.keywords = [...new Set([...(merged.keywords || []), ...duplicate.keywords])];
      }

      // Age range - take widest
      if (duplicate.minimum_age !== null && (merged.minimum_age === null || duplicate.minimum_age < merged.minimum_age)) {
        merged.minimum_age = duplicate.minimum_age;
      }
      if (duplicate.maximum_age !== null && (merged.maximum_age === null || duplicate.maximum_age > merged.maximum_age)) {
        merged.maximum_age = duplicate.maximum_age;
      }

      // Verification - prefer verified
      if (duplicate.verification_status === 'verified' && merged.verification_status !== 'verified') {
        merged.verification_status = 'verified';
        merged.last_verified_at = duplicate.last_verified_at;
      }

      // Quality scores - take best
      if (duplicate.completeness_score > merged.completeness_score) {
        merged.completeness_score = duplicate.completeness_score;
      }
      if (duplicate.verification_score > merged.verification_score) {
        merged.verification_score = duplicate.verification_score;
      }
    }

    return merged;
  }

  async mergeLocations(trx, primaryId, duplicateIds) {
    // Get all locations
    const locations = await trx('locations')
      .whereIn('service_id', [primaryId, ...duplicateIds]);

    if (locations.length <= 1) return;

    // Group by similar addresses
    const groups = this.groupSimilarLocations(locations);

    // Keep one from each group, update to primary service
    for (const group of groups) {
      const [keep, ...remove] = group;
      
      if (keep.service_id !== primaryId) {
        await trx('locations')
          .where('id', keep.id)
          .update({ service_id: primaryId });
      }

      // Remove duplicates
      if (remove.length > 0) {
        await trx('locations')
          .whereIn('id', remove.map(l => l.id))
          .delete();
      }
    }
  }

  groupSimilarLocations(locations) {
    const groups = [];
    const used = new Set();

    for (const loc1 of locations) {
      if (used.has(loc1.id)) continue;

      const group = [loc1];
      used.add(loc1.id);

      for (const loc2 of locations) {
        if (used.has(loc2.id)) continue;

        const addr1 = this.normalizeAddress(loc1);
        const addr2 = this.normalizeAddress(loc2);
        const similarity = stringSimilarity.compareTwoStrings(addr1, addr2);

        if (similarity > this.options.addressThreshold) {
          group.push(loc2);
          used.add(loc2.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  async mergeContacts(trx, primaryId, duplicateIds) {
    const contacts = await trx('contacts')
      .whereIn('service_id', [primaryId, ...duplicateIds]);

    if (contacts.length <= 1) return;

    // Merge all unique phone numbers and emails
    const phones = new Map();
    const emails = new Set();

    for (const contact of contacts) {
      if (contact.phone) {
        const phoneData = typeof contact.phone === 'string' 
          ? JSON.parse(contact.phone) 
          : contact.phone;
        
        for (const phone of phoneData) {
          const normalized = this.normalizePhone(phone.number);
          if (!phones.has(normalized)) {
            phones.set(normalized, phone);
          }
        }
      }

      if (contact.email) {
        emails.add(contact.email.toLowerCase());
      }
    }

    // Update primary contact
    const primaryContact = contacts.find(c => c.service_id === primaryId) || contacts[0];
    
    await trx('contacts')
      .where('id', primaryContact.id)
      .update({
        service_id: primaryId,
        phone: JSON.stringify(Array.from(phones.values())),
        email: Array.from(emails)[0] || null,
        updated_at: new Date()
      });

    // Remove other contacts
    await trx('contacts')
      .whereIn('service_id', duplicateIds)
      .delete();
  }

  async mergeSchedules(trx, primaryId, duplicateIds) {
    // Simply reassign all schedules to primary service
    await trx('schedules')
      .whereIn('service_id', duplicateIds)
      .update({ service_id: primaryId });
  }
}

// Create singleton instance
let detector;

export function getDuplicateDetector(options) {
  if (!detector) {
    detector = new DuplicateDetector(options);
  }
  return detector;
}