/**
 * Service Data Transfer Object
 * Ensures consistent, safe API responses
 */

export class ServiceDTO {
  constructor(service) {
    this.id = this.sanitizeString(service.id);
    this.name = this.sanitizeString(service.name) || 'Unnamed Service';
    this.description = this.sanitizeDescription(service.description);
    this.status = this.sanitizeString(service.status) || 'active';
    this.categories = this.sanitizeArray(service.categories);
    this.youth_specific = Boolean(service.youth_specific);
    this.indigenous_specific = Boolean(service.indigenous_specific);
    this.age_range = this.sanitizeAgeRange(service);
    this.contact = this.sanitizeContact(service);
    this.location = this.sanitizeLocation(service);
    this.organization = this.sanitizeOrganization(service);
    this.metadata = this.sanitizeMetadata(service);
  }

  sanitizeString(value) {
    if (value === null || value === undefined) return null;
    return String(value).trim();
  }

  sanitizeDescription(description) {
    if (!description) return null;
    const cleaned = String(description).trim();
    return cleaned.length > 500 ? cleaned.substring(0, 500) + '...' : cleaned;
  }

  sanitizeArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => item != null).map(item => String(item).trim());
  }

  sanitizeAgeRange(service) {
    return {
      minimum: this.sanitizeNumber(service.minimum_age),
      maximum: this.sanitizeNumber(service.maximum_age)
    };
  }

  sanitizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  sanitizeContact(service) {
    return {
      email: this.sanitizeString(service.email),
      phone: this.sanitizePhone(service.phone),
      website: this.sanitizeUrl(service.url)
    };
  }

  sanitizePhone(phone) {
    if (!phone) return null;
    if (typeof phone === 'string') {
      try {
        return JSON.parse(phone);
      } catch {
        return { primary: phone };
      }
    }
    return phone;
  }

  sanitizeUrl(url) {
    if (!url) return null;
    const cleaned = String(url).trim();
    if (!cleaned.startsWith('http')) return `https://${cleaned}`;
    return cleaned;
  }

  sanitizeLocation(service) {
    return {
      address: this.sanitizeString(service.address_1),
      city: this.sanitizeString(service.city),
      state: this.sanitizeString(service.state_province),
      postcode: this.sanitizeString(service.postal_code),
      region: this.sanitizeString(service.region),
      coordinates: this.sanitizeCoordinates(service)
    };
  }

  sanitizeCoordinates(service) {
    const lat = this.sanitizeNumber(service.latitude);
    const lng = this.sanitizeNumber(service.longitude);
    return (lat && lng) ? { lat, lng } : null;
  }

  sanitizeOrganization(service) {
    return {
      name: this.sanitizeString(service.organization_name),
      type: this.sanitizeString(service.organization_type),
      url: this.sanitizeUrl(service.organization_url)
    };
  }

  sanitizeMetadata(service) {
    return {
      data_source: this.sanitizeString(service.data_source),
      source_url: this.sanitizeUrl(service.source_url),
      created_at: this.sanitizeDate(service.created_at),
      updated_at: this.sanitizeDate(service.updated_at)
    };
  }

  sanitizeDate(date) {
    if (!date) return null;
    try {
      return new Date(date).toISOString();
    } catch {
      return null;
    }
  }

  // Static method for bulk conversion
  static fromArray(services) {
    return services.map(service => new ServiceDTO(service));
  }
}

export class SearchResponseDTO {
  constructor(services, pagination, filters = {}) {
    this.services = ServiceDTO.fromArray(services);
    this.pagination = this.sanitizePagination(pagination);
    this.filters = this.sanitizeFilters(filters);
    this.metadata = {
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  sanitizePagination(pagination) {
    return {
      limit: Math.max(1, Math.min(100, Number(pagination.limit) || 20)),
      offset: Math.max(0, Number(pagination.offset) || 0),
      total: Math.max(0, Number(pagination.total) || 0),
      pages: Math.max(1, Number(pagination.pages) || 1),
      current_page: Math.max(1, Number(pagination.current_page) || 1),
      has_next: Boolean(pagination.has_next),
      has_prev: Boolean(pagination.has_prev)
    };
  }

  sanitizeFilters(filters) {
    return {
      query: filters.q ? String(filters.q).trim() : null,
      category: filters.category ? String(filters.category).trim() : null,
      youth_specific: filters.youth_specific === 'true' ? true : null,
      indigenous_specific: filters.indigenous_specific === 'true' ? true : null
    };
  }
}