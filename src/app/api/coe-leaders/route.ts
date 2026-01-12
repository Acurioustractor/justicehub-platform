import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: leaders, error } = await supabase
      .from('coe_key_people')
      .select(`
        id,
        role_title,
        expertise_area,
        display_order,
        profile:public_profiles(
          id, slug, full_name, tagline, photo_url, bio
        )
      `)
      .order('display_order')
      .limit(6);

    if (error) {
      console.error('Error fetching CoE leaders:', error);
      return NextResponse.json({ leaders: [] });
    }

    return NextResponse.json({ leaders: leaders || [] });
  } catch (error) {
    console.error('Error in coe-leaders API:', error);
    return NextResponse.json({ leaders: [] });
  }
}
