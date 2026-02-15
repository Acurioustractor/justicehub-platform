import { NextResponse } from 'next/server';
import { getFeaturedProfiles } from '@/lib/integrations/profile-linking';

export async function GET() {
  try {
    const profiles = await getFeaturedProfiles(6);

    return NextResponse.json({
      profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('Error fetching featured profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured profiles' },
      { status: 500 }
    );
  }
}
