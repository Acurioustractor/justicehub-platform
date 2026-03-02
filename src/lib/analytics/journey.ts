'use client';

type JourneyEventName =
  | 'journey_path_selected'
  | 'contact_prefill_loaded'
  | 'service_action_clicked'
  | 'program_action_clicked';

type JourneyEventPayload = {
  eventName: JourneyEventName;
  properties?: Record<string, unknown>;
};

function createPayload(input: JourneyEventPayload) {
  return {
    eventName: input.eventName,
    properties: {
      ...input.properties,
      route: window.location.pathname,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function trackJourneyEvent(input: JourneyEventPayload): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const payload = createPayload(input);
    const body = JSON.stringify(payload);

    // Prefer sendBeacon so navigation clicks don't drop events.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/analytics/journey', blob);
      if (sent) return;
    }

    await fetch('/api/analytics/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    // Telemetry should never block UX.
  }
}

