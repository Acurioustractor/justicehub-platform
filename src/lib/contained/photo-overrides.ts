import { createServiceClient } from '@/lib/supabase/service-lite';

export const CONTAINED_PHOTO_OVERRIDES_KEY = 'contained-photo-overrides';

export type ContainedPhotoOverrides = Record<string, string>;

export async function getContainedPhotoOverrides(): Promise<ContainedPhotoOverrides> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', CONTAINED_PHOTO_OVERRIDES_KEY)
      .single();

    if (!data?.value || typeof data.value !== 'object') {
      return {};
    }

    return data.value as ContainedPhotoOverrides;
  } catch {
    return {};
  }
}

export async function saveContainedPhotoOverrides(overrides: ContainedPhotoOverrides) {
  const supabase = createServiceClient();

  return supabase
    .from('site_config')
    .upsert(
      {
        key: CONTAINED_PHOTO_OVERRIDES_KEY,
        value: overrides,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
}
