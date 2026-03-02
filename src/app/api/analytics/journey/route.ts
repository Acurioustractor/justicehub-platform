import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const ALLOWED_EVENTS = new Set([
  'journey_path_selected',
  'contact_prefill_loaded',
  'service_action_clicked',
  'program_action_clicked',
]);

function getIpAddress(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventName = typeof body?.eventName === 'string' ? body.eventName : '';
    const properties =
      body?.properties && typeof body.properties === 'object' ? body.properties : {};

    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ success: false, error: 'Invalid event name' }, { status: 400 });
    }

    try {
      const supabase = createServiceClient();
      const ipAddress = getIpAddress(request);
      const userAgent = request.headers.get('user-agent');

      const { error } = await (supabase as any).from('community_events').insert({
        event_category: 'journey',
        event_type: 'frontend',
        event_name: eventName,
        event_properties: properties,
        event_metadata: {
          source: 'justicehub-web',
          version: 'phase-1.5',
        },
        event_timestamp: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
      });

      if (error) {
        console.error('Journey analytics insert error:', error);
        return NextResponse.json({ success: true, stored: false }, { status: 202 });
      }
    } catch (error) {
      // Service-role config missing or DB unavailable should not break page UX.
      console.error('Journey analytics unavailable:', error);
      return NextResponse.json({ success: true, stored: false }, { status: 202 });
    }

    return NextResponse.json({ success: true, stored: true });
  } catch (error) {
    console.error('Journey analytics API error:', error);
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

