import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  deleteSystem0FilterPreset,
  listSystem0FilterPresets,
  upsertSystem0FilterPreset,
  type System0AuditFilterState,
} from '@/lib/funding/system0-presets';
import { logSystem0Event } from '@/lib/funding/system0-audit';

function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing service role key');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (message === 'Preset not found') {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  if (
    message === 'Preset id is required' ||
    message === 'Preset name is required' ||
    message === 'User id is required to save presets' ||
    message === 'User id is required to delete presets'
  ) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (
    message === 'Cannot edit a private preset owned by another user' ||
    message === 'Cannot delete a private preset owned by another user'
  ) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 50)));
    const serviceClient = getServiceClient();
    const presets = await listSystem0FilterPresets(serviceClient, {
      limit,
      userId: user.id,
      includeShared: true,
      includePrivate: true,
    });
    return NextResponse.json({
      success: true,
      viewerId: user.id,
      presets,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const presetId = typeof body?.id === 'string' ? body.id : undefined;
    const filters = (body?.filters || {}) as Partial<System0AuditFilterState>;
    const isShared = body?.isShared !== false;

    const serviceClient = getServiceClient();
    const preset = await upsertSystem0FilterPreset(serviceClient, {
      id: presetId,
      name,
      filters,
      isShared,
      userId: user.id,
    });

    await logSystem0Event(serviceClient, {
      eventType: 'filter_preset_saved',
      source: 'admin_presets',
      actorId: user.id,
      message: `Saved System 0 audit preset "${preset.name}".`,
      payload: {
        presetId: preset.id,
        name: preset.name,
        filters: preset.filters,
        isShared: preset.isShared,
      },
    });

    return NextResponse.json({
      success: true,
      preset,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const presetId = String(body?.id || '').trim();
    if (!presetId) {
      return NextResponse.json({ error: 'Preset id is required' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const deletedPreset = await deleteSystem0FilterPreset(serviceClient, presetId, {
      userId: user.id,
    });

    await logSystem0Event(serviceClient, {
      eventType: 'filter_preset_deleted',
      source: 'admin_presets',
      actorId: user.id,
      message: `Deleted System 0 audit preset "${deletedPreset.name}".`,
      payload: {
        presetId,
        name: deletedPreset.name,
        isShared: deletedPreset.isShared,
        createdBy: deletedPreset.createdBy,
      },
    });

    return NextResponse.json({
      success: true,
      deletedId: presetId,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}
