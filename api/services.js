import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { page = 1, limit = 20, search, location } = req.query;
    
    let query = supabase
      .from('services')
      .select(`
        *,
        organizations(*),
        locations(*),
        contacts(*)
      `)
      .eq('project', 'youth-justice-service-finder');

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (location) {
      query = query.eq('locations.locality', location);
    }

    // Apply pagination
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;
    
    query = query.range(from, to);

    const { data, error, count } = await query;
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch services',
        message: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch services',
      message: error.message
    });
  }
} 