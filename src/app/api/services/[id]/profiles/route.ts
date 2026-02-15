import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

interface ServiceProfileResponseRecord {
  profile: {
    id: string;
    name?: string;
    preferred_name?: string;
    bio?: string;
    profile_picture_url?: string;
    organization?: {
      name: string;
    };
  };
  appearanceRole?: string;
  appearanceExcerpt?: string;
  isFeatured?: boolean;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNullableBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export async function GET(
  _request: NextRequest,
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

    const supabase = createServiceClient();
    const untypedSupabase = supabase as any;

    const { data: appearances, error: appearancesError } = await untypedSupabase
      .from('profile_appearances')
      .select('public_profile_id, role, story_excerpt, featured')
      .eq('appears_on_type', 'service')
      .eq('appears_on_id', serviceId)
      .order('featured', { ascending: false });

    if (appearancesError) {
      console.error('Error fetching profile appearances:', appearancesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    const appearanceRows = Array.isArray(appearances) ? appearances : [];
    const publicProfileIds = Array.from(
      new Set(
        appearanceRows
          .map((row) => asNullableString((row as Record<string, unknown>).public_profile_id))
          .filter((id): id is string => Boolean(id))
      )
    );

    if (publicProfileIds.length === 0) {
      return NextResponse.json({
        success: true,
        profiles: [],
        count: 0,
      });
    }

    const { data: publicProfiles, error: profilesError } = await untypedSupabase
      .from('public_profiles')
      .select('id, full_name, preferred_name, bio, photo_url, current_organization, is_public')
      .in('id', publicProfileIds)
      .eq('is_public', true);

    if (profilesError) {
      console.error('Error fetching public profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    const publicRows = Array.isArray(publicProfiles) ? publicProfiles : [];
    const publicProfileById = new Map<string, Record<string, unknown>>();
    for (const row of publicRows) {
      if (!row || typeof row !== 'object') {
        continue;
      }
      const record = row as Record<string, unknown>;
      const id = asNullableString(record.id);
      if (id) {
        publicProfileById.set(id, record);
      }
    }

    const profiles: ServiceProfileResponseRecord[] = appearanceRows
      .map((row) => {
        if (!row || typeof row !== 'object') {
          return null;
        }
        const appearance = row as Record<string, unknown>;
        const publicProfileId = asNullableString(appearance.public_profile_id);
        if (!publicProfileId) {
          return null;
        }

        const publicProfile = publicProfileById.get(publicProfileId);
        if (!publicProfile) {
          return null;
        }

        const organizationName = asNullableString(publicProfile.current_organization);
        const normalized: ServiceProfileResponseRecord = {
          profile: {
            id: publicProfileId,
            name: asNullableString(publicProfile.full_name) || undefined,
            preferred_name: asNullableString(publicProfile.preferred_name) || undefined,
            bio: asNullableString(publicProfile.bio) || undefined,
            profile_picture_url: asNullableString(publicProfile.photo_url) || undefined,
            organization: organizationName ? { name: organizationName } : undefined,
          },
          appearanceRole: asNullableString(appearance.role) || undefined,
          appearanceExcerpt: asNullableString(appearance.story_excerpt) || undefined,
          isFeatured: asNullableBoolean(appearance.featured) ?? undefined,
        };

        return normalized;
      })
      .filter((record): record is ServiceProfileResponseRecord => record !== null);

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching service profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}
