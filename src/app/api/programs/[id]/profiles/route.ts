import { NextRequest, NextResponse } from 'next/server';
import { getProfilesFor } from '@/lib/integrations/profile-linking';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programId = params.id;

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const profiles = await getProfilesFor('program', programId);

    return NextResponse.json({
      profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('Error fetching program profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}
