import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient();

  try {
    // Fetch organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json(
        { success: false, error: orgsError.message },
        { status: 500 }
      );
    }

    // Fetch program counts
    const { data: programs } = await supabase
      .from('registered_services')
      .select('organization_id');

    const programCounts: Record<string, number> = {};
    if (programs) {
      programs.forEach((program) => {
        if (program.organization_id) {
          programCounts[program.organization_id] = (programCounts[program.organization_id] || 0) + 1;
        }
      });
    }

    return NextResponse.json({
      success: true,
      organizations: orgs || [],
      programCounts,
    });
  } catch (error: any) {
    console.error('Organizations API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
