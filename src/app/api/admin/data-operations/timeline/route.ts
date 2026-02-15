import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DailyActivity {
  date: string;
  services: number;
  organizations: number;
  evidence: number;
  interventions: number;
  links: number;
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all records with created_at in the date range
    const [
      servicesData,
      orgsData,
      evidenceData,
      interventionsData,
      linksData,
    ] = await Promise.all([
      supabase
        .from('services')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('organizations')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('alma_evidence')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('alma_interventions')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('alma_discovered_links')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
    ]);

    // Create a map for each day
    const dailyMap: Record<string, DailyActivity> = {};
    
    // Initialize all days in range
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = {
        date: dateStr,
        services: 0,
        organizations: 0,
        evidence: 0,
        interventions: 0,
        links: 0,
        total: 0,
      };
    }

    // Count records per day
    const countByDay = (data: { created_at: string }[] | null, field: keyof DailyActivity) => {
      data?.forEach((item) => {
        if (item.created_at) {
          const dateStr = item.created_at.split('T')[0];
          if (dailyMap[dateStr] && field !== 'date' && field !== 'total') {
            (dailyMap[dateStr][field] as number)++;
            dailyMap[dateStr].total++;
          }
        }
      });
    };

    countByDay(servicesData.data, 'services');
    countByDay(orgsData.data, 'organizations');
    countByDay(evidenceData.data, 'evidence');
    countByDay(interventionsData.data, 'interventions');
    countByDay(linksData.data, 'links');

    // Convert to sorted array
    const daily = Object.values(dailyMap).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Calculate summary stats
    const totalActivity = daily.reduce((sum, d) => sum + d.total, 0);
    const avgPerDay = totalActivity / days;
    const maxDay = daily.reduce((max, d) => d.total > max.total ? d : max, daily[0]);
    const activeDays = daily.filter(d => d.total > 0).length;

    return NextResponse.json({
      daily,
      summary: {
        totalActivity,
        avgPerDay: Math.round(avgPerDay * 10) / 10,
        maxDay: maxDay?.date || null,
        maxDayCount: maxDay?.total || 0,
        activeDays,
        totalDays: days,
      },
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}
