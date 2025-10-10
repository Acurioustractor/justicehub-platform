import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use environment variables - don't hardcode
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Get the specific service from services_complete view
    const { data: service, error } = await supabase
      .from('services_complete')
      .select('*')
      .eq('id', serviceId)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      console.error('Error fetching service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Transform the data to match the frontend interface
    const transformedService = {
      id: service.id,
      name: service.name,
      category: mapCategory(service.categories?.[0] || 'support'),
      description: service.description || 'No description available',
      location: buildLocation(service),
      contact: extractContact(service),
      cost: mapCost(service.cost || 'unknown'),
      rating: Math.round((service.score || 0.5) * 5 * 100) / 100,
      verified: service.verification_status === 'verified' || (service.score || 0) >= 0.8,
      lastUpdated: formatTimestamp(service.scraped_at || service.updated_at),
      source: service.source_url || service.url,
      aiDiscovered: service.source === 'scraper' || service.source === 'ai_scrape',
      eligibility: service.eligibility || [],
      subcategory: service.categories?.[1],
      contactInfo: {
        phone: service.contact?.phone || service.phone,
        email: service.contact?.email || service.email,
        website: service.url,
        address: buildAddress(service)
      },
      confidenceScore: service.score,
      extractionTimestamp: service.scraped_at
    };

    return NextResponse.json({
      service: transformedService,
      metadata: {
        source: 'AI Scraped Service',
        lastUpdate: new Date().toISOString(),
        confidence: 'AI-verified data'
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}

// Helper functions
function mapCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'legal_aid': 'legal',
    'mental_health': 'health',
    'crisis_support': 'emergency',
    'education_training': 'education',
    'employment': 'employment',
    'housing': 'housing',
    'substance_abuse': 'substance',
    'family_support': 'family',
    'court_support': 'legal',
    'advocacy': 'legal'
  };
  return categoryMap[category] || 'family';
}

function mapCost(cost: string): 'free' | 'low' | 'moderate' {
  if (!cost) return 'free';
  const costLower = cost.toLowerCase();
  if (costLower === 'free' || costLower === 'unknown') return 'free';
  if (costLower === 'subsidized') return 'low';
  if (costLower === 'fee_based') return 'moderate';
  return 'free';
}

function buildLocation(service: any): string {
  const parts = [];
  if (service.city) parts.push(service.city);
  if (service.state) parts.push(service.state);
  return parts.join(', ') || 'Queensland';
}

function buildAddress(service: any): string {
  const parts = [];
  if (service.address) parts.push(service.address);
  if (service.city) parts.push(service.city);
  if (service.state) parts.push(service.state);
  if (service.postcode) parts.push(service.postcode);
  return parts.join(', ') || 'Address not available';
}

function extractContact(service: any): string {
  if (service.contact?.phone) return service.contact.phone;
  if (service.phone) return service.phone;
  if (service.contact?.email) return service.contact.email;
  if (service.email) return service.email;
  if (service.url) return service.url;
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