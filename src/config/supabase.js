import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database tables
export const TABLES = {
  SERVICES: 'services',
  ORGANIZATIONS: 'organizations', 
  LOCATIONS: 'locations',
  CONTACTS: 'contacts'
};

// Helper functions for database operations
export const supabaseHelpers = {
  // Get all services with pagination
  async getServices(page = 1, limit = 20, filters = {}) {
    let query = supabase
      .from(TABLES.SERVICES)
      .select(`
        *,
        organizations(*),
        locations(*),
        contacts(*)
      `)
      .eq('project', 'youth-justice-service-finder'); // Filter for this app only

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.location) {
      query = query.eq('locations.locality', filters.location);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);

    const { data, error, count } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return {
      services: data || [],
      total: count || 0,
      page,
      limit
    };
  },

  // Search services
  async searchServices(searchTerm, limit = 50) {
    const { data, error } = await supabase
      .from(TABLES.SERVICES)
      .select(`
        *,
        organizations(*),
        locations(*),
        contacts(*)
      `)
      .eq('project', 'youth-justice-service-finder') // Filter for this app only
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('Supabase search error:', error);
      throw error;
    }

    return data || [];
  },

  // Get service by ID
  async getServiceById(id) {
    const { data, error } = await supabase
      .from(TABLES.SERVICES)
      .select(`
        *,
        organizations(*),
        locations(*),
        contacts(*)
      `)
      .eq('project', 'youth-justice-service-finder') // Filter for this app only
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase get service error:', error);
      throw error;
    }

    return data;
  },

  // Get database stats
  async getStats() {
    const [servicesCount, orgsCount, locationsCount, contactsCount] = await Promise.all([
      supabase.from(TABLES.SERVICES).select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder'),
      supabase.from(TABLES.ORGANIZATIONS).select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder'),
      supabase.from(TABLES.LOCATIONS).select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder'),
      supabase.from(TABLES.CONTACTS).select('id', { count: 'exact', head: true }).eq('project', 'youth-justice-service-finder')
    ]);

    return {
      services: servicesCount.count || 0,
      organizations: orgsCount.count || 0,
      locations: locationsCount.count || 0,
      contacts: contactsCount.count || 0
    };
  }
};

export default supabase; 