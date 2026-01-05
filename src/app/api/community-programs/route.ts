import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServiceClient();

  try {
    const { data: programs, error } = await supabase
      .from('community_programs')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching community programs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      programs: programs || [],
    });
  } catch (error: any) {
    console.error('Community programs API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
