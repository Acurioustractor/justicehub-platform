import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('scraped_services')
      .select(`
        id,
        name,
        description,
        category,
        subcategory,
        eligibility_criteria,
        cost_structure,
        contact_info,
        confidence_score,
        source_url,
        extraction_timestamp,
        validation_status
      `)
      .eq('active', true)
      .order('confidence_score', { ascending: false })
      .order('extraction_timestamp', { ascending: false })
      .limit(limit);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: scrapedServices, error } = await query;

    if (error) {
      console.error('Error fetching scraped services:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedServices = scrapedServices?.map(service => ({
      id: service.id,
      name: service.name,
      category: mapCategory(service.category),
      description: service.description,
      location: extractLocation(service.contact_info, service.source_url),
      contact: extractContact(service.contact_info),
      cost: mapCost(service.cost_structure),
      rating: Math.round(service.confidence_score * 5 * 100) / 100, // Convert confidence to 5-star rating
      verified: service.validation_status === 'approved' || service.confidence_score >= 0.8,
      lastUpdated: formatTimestamp(service.extraction_timestamp),
      source: service.source_url,
      aiDiscovered: true,
      eligibility: service.eligibility_criteria,
      subcategory: service.subcategory
    })) || [];

    return NextResponse.json({
      services: transformedServices,
      total: transformedServices.length,
      metadata: {
        source: 'AI Scraped Services',
        lastUpdate: new Date().toISOString(),
        confidence: 'AI-verified data'
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

// Helper functions
function mapCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'legal_support': 'legal',
    'crisis_intervention': 'emergency',
    'youth_support': 'family',
    'mental_health': 'health',
    'education_training': 'education',
    'employment': 'employment',
    'housing': 'housing',
    'substance_use': 'substance'
  };
  return categoryMap[category] || 'family';
}

function mapCost(costStructure: string): 'free' | 'low' | 'moderate' {
  if (!costStructure) return 'free';
  const cost = costStructure.toLowerCase();
  if (cost.includes('free') || cost.includes('no cost')) return 'free';
  if (cost.includes('low') || cost.includes('sliding')) return 'low';
  return 'moderate';
}

function extractLocation(contactInfo: any, sourceUrl: string): string {
  if (contactInfo?.address) return contactInfo.address;
  if (contactInfo?.location) return contactInfo.location;

  // Extract location from source URL
  if (sourceUrl?.includes('nsw')) return 'NSW';
  if (sourceUrl?.includes('qld')) return 'Queensland';
  if (sourceUrl?.includes('vic')) return 'Victoria';
  if (sourceUrl?.includes('wa')) return 'Western Australia';
  if (sourceUrl?.includes('sa')) return 'South Australia';
  if (sourceUrl?.includes('tas')) return 'Tasmania';
  if (sourceUrl?.includes('nt')) return 'Northern Territory';
  if (sourceUrl?.includes('act')) return 'ACT';

  return 'Australia-wide';
}

function extractContact(contactInfo: any): string {
  if (!contactInfo) return 'Contact via service website';
  if (typeof contactInfo === 'string') return contactInfo;

  if (contactInfo.phone) return contactInfo.phone;
  if (contactInfo.email) return contactInfo.email;
  if (contactInfo.website) return contactInfo.website;

  return 'Contact via service website';
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp) return 'Recently';

  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}