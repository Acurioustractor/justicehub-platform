import { NextRequest, NextResponse } from 'next/server';
import { createSignalEngineClient } from '@/lib/supabase/signal-engine';
import { parseJSON } from '@/lib/ai/parse-json';

/**
 * COMPOSER Agent — Content Generator
 * POST /api/signal-engine/compose
 *
 * Takes a signal event and generates multi-format content drafts.
 * Uses Claude API to draft journalism-grade content.
 *
 * Body: { event_id: string } or { all_new: true }
 */

const SYSTEM_PROMPT = `You are a data journalist for JusticeHub, an Indigenous justice advocacy platform in Australia. You write factual, community-first content following CARE principles (Collective benefit, Authority to control, Responsibility, Ethics).

Rules:
- Never name individuals
- Always cite aggregate counts, never individual reports
- Include "What you can do" action items
- Focus on systemic patterns, not individual incidents
- Avoid sensationalism — be factual and citation-backed
- When content involves police, deaths in custody, or children, add a sensitivity flag
- Include support service information for high-priority content
- Use Australian English spelling`;

interface SignalEvent {
  id: string;
  signal_type: string;
  source_table: string;
  region_code: string | null;
  region_name: string | null;
  state: string | null;
  payload: Record<string, unknown>;
  priority: string;
}

function buildPrompt(event: SignalEvent): string {
  const { signal_type, region_name, state, payload } = event;

  switch (signal_type) {
    case 'milestone':
      return `Write content about a discrimination reporting milestone. The region "${region_name}" in ${state} has now reached ${payload.total_reports} discrimination reports, crossing the ${payload.milestone}-report milestone. ${payload.system_types_reported} different system types have been reported on.

Generate these formats:
1. data_story: A 200-300 word data story for the JusticeHub blog. Include context about why this milestone matters, what systems are most affected, and what community members can do.
2. social_card: A 3-line social media post (under 280 characters total) with the key stat and a call to action.
3. widget_alert: A single-line alert (under 100 characters) for the postcode widget.

Respond in JSON format:
{
  "data_story": { "title": "...", "body": "..." },
  "social_card": { "title": "...", "body": "..." },
  "widget_alert": { "title": null, "body": "..." }
}`;

    case 'system_concentration':
      return `Write content about a system-type concentration pattern. In "${region_name}" (${state}), ${payload.concentration_pct}% of discrimination reports (${payload.system_count} out of ${payload.total_reports}) involve the ${payload.system_type} system.

Generate these formats:
1. data_story: A 200-300 word analysis of what this concentration means and what systemic factors might drive it.
2. social_card: A 3-line social post highlighting the pattern.
3. widget_alert: A single-line alert for the widget.

Respond in JSON format:
{
  "data_story": { "title": "...", "body": "..." },
  "social_card": { "title": "...", "body": "..." },
  "widget_alert": { "title": null, "body": "..." }
}`;

    case 'service_gap':
      return `Write URGENT content about a service gap. The region "${region_name}" (${state}) has ${payload.total_reports} discrimination reports but NO support services in the state.

Generate these formats:
1. data_story: A 200-300 word urgent story about the service gap and its impact on communities.
2. social_card: An urgent social post highlighting the gap.
3. widget_alert: An urgent single-line alert.

Respond in JSON format:
{
  "data_story": { "title": "...", "body": "..." },
  "social_card": { "title": "...", "body": "..." },
  "widget_alert": { "title": null, "body": "..." }
}`;

    default:
      return `Write content about a data signal. Region: ${region_name || 'National'}, State: ${state || 'All'}, Signal type: ${signal_type}. Data: ${JSON.stringify(payload)}.

Generate in JSON format:
{
  "data_story": { "title": "...", "body": "..." },
  "social_card": { "title": "...", "body": "..." },
  "widget_alert": { "title": null, "body": "..." }
}`;
  }
}

async function composeForEvent(supabase: ReturnType<typeof createSignalEngineClient>, event: SignalEvent) {
  // Mark event as composing
  await supabase
    .from('signal_events')
    .update({ status: 'composing' })
    .eq('id', event.id);

  const prompt = buildPrompt(event);

  // Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: generate template content without AI
    const fallbackContent = generateFallbackContent(event);
    await insertContent(supabase, event.id, fallbackContent);
    await supabase.from('signal_events').update({ status: 'queued' }).eq('id', event.id);
    return { event_id: event.id, method: 'fallback', formats: Object.keys(fallbackContent) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    // Parse JSON from response (robust parser handles markdown, think blocks, etc.)
    const content = parseJSON<Record<string, { title: string | null; body: string }>>(text);
    await insertContent(supabase, event.id, content);
    await supabase.from('signal_events').update({ status: 'queued' }).eq('id', event.id);

    return { event_id: event.id, method: 'ai', formats: Object.keys(content) };
  } catch (aiError) {
    console.error('AI generation failed, using fallback:', aiError);
    const fallbackContent = generateFallbackContent(event);
    await insertContent(supabase, event.id, fallbackContent);
    await supabase.from('signal_events').update({ status: 'queued' }).eq('id', event.id);
    return { event_id: event.id, method: 'fallback', formats: Object.keys(fallbackContent) };
  }
}

function generateFallbackContent(event: SignalEvent): Record<string, { title: string | null; body: string }> {
  const { signal_type, region_name, state, payload } = event;

  switch (signal_type) {
    case 'milestone':
      return {
        data_story: {
          title: `${region_name} reaches ${payload.milestone} discrimination reports`,
          body: `Community-sourced data from JusticeHub's Call It Out platform shows that ${region_name} in ${state} has now received ${payload.total_reports} discrimination reports, crossing the ${payload.milestone}-report milestone. Reports span ${payload.system_types_reported} different system types including education, health, policing, and housing.\n\nThis data reflects the experiences shared by community members who chose to document discrimination they faced. Every report contributes to a clearer picture of systemic patterns.\n\n**What you can do:**\n- Report discrimination at justicehub.org.au/call-it-out\n- Share this data with your local representative\n- Contact a support service if you need help`,
        },
        social_card: {
          title: `${region_name} hits ${payload.milestone} reports`,
          body: `${payload.total_reports} discrimination reports in ${region_name}, ${state}. The data is building a picture of systemic racism. Add your voice: justicehub.org.au/call-it-out`,
        },
        widget_alert: {
          title: null,
          body: `${region_name} has reached ${payload.milestone} discrimination reports`,
        },
      };

    case 'system_concentration':
      return {
        data_story: {
          title: `${payload.concentration_pct}% of ${region_name} discrimination reports involve ${payload.system_type}`,
          body: `Data from JusticeHub shows a significant concentration of discrimination reports in the ${payload.system_type} system in ${region_name}, ${state}. ${payload.system_count} out of ${payload.total_reports} reports — ${payload.concentration_pct}% — cite ${payload.system_type} as the system involved.\n\nThis concentration pattern suggests systemic issues within ${payload.system_type} institutions in the region that warrant closer examination.\n\n**What you can do:**\n- If you've experienced discrimination in ${payload.system_type}, report it at justicehub.org.au/call-it-out\n- Contact your local anti-discrimination body\n- Reach out to a community legal service`,
        },
        social_card: {
          title: `${region_name}: ${payload.system_type} pattern`,
          body: `${payload.concentration_pct}% of discrimination reports in ${region_name} involve ${payload.system_type}. That's ${payload.system_count} out of ${payload.total_reports} reports. Data: justicehub.org.au`,
        },
        widget_alert: {
          title: null,
          body: `${payload.concentration_pct}% of reports here involve ${payload.system_type}`,
        },
      };

    case 'service_gap':
      return {
        data_story: {
          title: `Service gap: ${region_name} has ${payload.total_reports} reports but no local support`,
          body: `JusticeHub data reveals a critical service gap in ${region_name}, ${state}. Despite receiving ${payload.total_reports} discrimination reports, there are no advocacy or legal support services available in the region.\n\nCommunities experiencing discrimination in this area must travel significant distances to access support, creating an additional barrier for those already facing systemic disadvantage.\n\n**What you can do:**\n- Contact the national Anti-Discrimination hotline: 1300 369 711\n- If you're a service provider, consider establishing a presence in this region\n- Share this data to raise awareness of the gap`,
        },
        social_card: {
          title: `Service gap in ${region_name}`,
          body: `${payload.total_reports} discrimination reports in ${region_name}, ${state} — but ZERO local support services. Communities deserve better. justicehub.org.au`,
        },
        widget_alert: {
          title: null,
          body: `Service gap alert: no local support services in ${region_name}`,
        },
      };

    default:
      return {
        data_story: {
          title: `Signal detected in ${region_name || 'national data'}`,
          body: `JusticeHub's Signal Engine has detected a noteworthy pattern in ${region_name || 'national'} data. ${JSON.stringify(payload)}`,
        },
        social_card: {
          title: `New signal: ${region_name || 'National'}`,
          body: `New data pattern detected in ${region_name || 'national data'}. See more at justicehub.org.au`,
        },
        widget_alert: {
          title: null,
          body: `New data signal for ${region_name || 'your area'}`,
        },
      };
  }
}

async function insertContent(
  supabase: ReturnType<typeof createSignalEngineClient>,
  eventId: string,
  content: Record<string, { title: string | null; body: string }>
) {
  const rows = Object.entries(content).map(([format, { title, body }]) => ({
    signal_event_id: eventId,
    format,
    title,
    body,
    status: 'draft' as const,
  }));

  const { error } = await supabase.from('signal_content').insert(rows);
  if (error) {
    console.error('Failed to insert content:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSignalEngineClient();
    const body = await request.json().catch(() => ({}));
    const { event_id, all_new } = body as { event_id?: string; all_new?: boolean };

    const results: Array<{ event_id: string; method: string; formats: string[] }> = [];

    if (event_id) {
      // Compose for a specific event
      const { data: event } = await supabase
        .from('signal_events')
        .select('*')
        .eq('id', event_id)
        .single();

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const result = await composeForEvent(supabase, event as SignalEvent);
      results.push(result);
    } else if (all_new) {
      // Compose for all new events
      const { data: events } = await supabase
        .from('signal_events')
        .select('*')
        .eq('status', 'new')
        .order('priority', { ascending: true }) // critical first
        .limit(10);

      if (events) {
        for (const event of events) {
          const result = await composeForEvent(supabase, event as SignalEvent);
          results.push(result);
        }
      }
    } else {
      return NextResponse.json({ error: 'Provide event_id or all_new: true' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      composed: results.length,
      results,
    });
  } catch (error) {
    console.error('COMPOSER error:', error);
    return NextResponse.json(
      { error: 'Composition failed', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
