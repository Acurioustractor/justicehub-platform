import { NextRequest, NextResponse } from 'next/server';
import { getProfilesFor } from '@/lib/integrations/profile-linking';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    const profiles = await getProfilesFor('service', serviceId);

    return NextResponse.json({
      profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('Error fetching service profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}
