import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) parameter is required'
      });
    }
    
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        organizations(*),
        locations(*),
        contacts(*)
      `)
      .eq('project', 'youth-justice-service-finder')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,keywords.ilike.%${q}%`)
      .limit(parseInt(limit));

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message
      });
    }

    return res.status(200).json({
      success: true,
      query: q,
      results: data ? data.length : 0,
      data: data || []
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
} 