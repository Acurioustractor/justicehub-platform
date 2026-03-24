import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

// Trip stop org profiles — enriched from DB where available, static fallback for external orgs
const TRIP_STOPS: Record<string, TripStop[]> = {
  'oonchiumpa-seq-2026': [
    {
      slug: 'mmeic',
      name: 'MMEIC — Minjerribah Moorgumpin Elders-in-Council',
      shortName: 'MMEIC',
      location: 'Minjerribah (North Stradbroke Island), QLD',
      country: 'Quandamooka Country',
      founded: 1993,
      isIndigenousLed: true,
      description:
        '31-year Indigenous-led organisation driving justice reinvestment, economic self-determination, and cultural heritage on Minjerribah.',
      programs: [
        'Justice Reinvestment (launched 2024, targeting Quandamooka youth)',
        'Economic self-determination: ~$300K revenue, 12 permanent + 20 casual roles',
        'Cultural heritage tours and education',
        'All profits reinvested into community',
      ],
      tripDay: 1,
      tripDate: 'Monday 8 June',
      relevance:
        'MMEIC proves Indigenous-led justice reinvestment works at scale over decades. This is what Oonchiumpa at 31 looks like.',
    },
    {
      slug: 'adapt-mentorship',
      name: 'Adapt Mentorship Indigenous Corporation',
      shortName: 'Adapt Mentorship',
      location: 'Toowoomba, QLD',
      country: 'Jarowair & Giabal Country',
      founded: 2014,
      isIndigenousLed: true,
      description:
        'Sport-based mentorship for First Nations youth. Adam & Susy Wenitong — Aboriginal and Torres Strait Islander Citizens of the Year 2025.',
      programs: [
        'Street Footy — sport-based youth engagement and diversion',
        'Kickstarter Youth Mentoring — 12-month QLD Govt-funded program (ages 8-17)',
        'Following the Songlines — on-Country cultural experiences',
        'Changing the Narrative — podcast and leadership program',
      ],
      tripDay: 2,
      tripDate: 'Tuesday 9 June',
      relevance:
        'Sport-based diversion vs cultural brokerage — comparing models. Kickstarter funding model relevant for NT applications.',
      contact: { email: 'info@adaptmentor.com', instagram: '@adaptmentor' },
    },
    {
      slug: 'yac-brisbane',
      name: 'Youth Advocacy Centre (YAC)',
      shortName: 'YAC Brisbane',
      location: 'Brisbane, QLD',
      country: 'Turrbal & Jagera Country',
      isIndigenousLed: false,
      description:
        'Youth justice advocacy centre in Brisbane. Shannon Cant wants to HOST the CONTAINED Container in Brisbane.',
      programs: [
        'Youth justice legal advocacy',
        'CONTAINED hosting discussion',
        'Urban youth justice model — different context to NT',
      ],
      tripDay: 3,
      tripDate: 'Wednesday 10 June',
      relevance:
        'How Oonchiumpa\'s cultural brokerage could inform urban youth justice advocacy. Potential CONTAINED host.',
    },
    {
      slug: 'witta-manufacturing',
      name: 'A Curious Tractor — Recycling Production Facility',
      shortName: 'Witta Farm',
      location: 'Witta, Sunshine Coast Hinterland, QLD',
      country: 'Jinibara Nation Country',
      isIndigenousLed: false,
      description:
        'Containerised manufacturing facility producing flat-pack beds, washing machines, and furniture from recycled plastic for remote communities.',
      programs: [
        'Plastic shredding and sheet production',
        'Flat-pack bed manufacturing (~30/week capacity)',
        '400+ beds delivered across 8 communities',
        'Each bed diverts 20-25kg plastic from landfill',
        'Training for remote community facility operators',
      ],
      tripDay: 4,
      tripDate: 'Thursday–Friday 11–12 June',
      relevance:
        'Hands-on manufacturing training for Alice Springs facility (Innovation Fund EOI — $1.2M, 60-80 participants over 4 years).',
    },
  ],
};

interface TripStop {
  slug: string;
  name: string;
  shortName: string;
  location: string;
  country: string;
  founded?: number;
  isIndigenousLed: boolean;
  description: string;
  programs: string[];
  tripDay: number;
  tripDate: string;
  relevance: string;
  contact?: { email?: string; instagram?: string };
  orgId?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tripSlug = searchParams.get('trip') || 'oonchiumpa-seq-2026';

  const stops = TRIP_STOPS[tripSlug];
  if (!stops) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  try {
    // Try to enrich from DB
    const supabase = createServiceClient() as any;
    const enriched = await Promise.all(
      stops.map(async (stop) => {
        // Try to find org in DB by name match
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, slug, state, is_indigenous_org, website')
          .ilike('name', `%${stop.shortName}%`)
          .limit(1)
          .single();

        if (org) {
          return {
            ...stop,
            orgId: org.id,
            orgSlug: org.slug,
            website: org.website,
          };
        }
        return stop;
      })
    );

    return NextResponse.json({
      trip: tripSlug,
      stops: enriched,
    });
  } catch (err) {
    console.error('GET /api/trips/stops error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
