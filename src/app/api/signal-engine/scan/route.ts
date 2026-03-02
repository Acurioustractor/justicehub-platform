import { NextResponse } from 'next/server';
import { createSignalEngineClient } from '@/lib/supabase/signal-engine';

/**
 * SENTINEL Agent — Threshold Scanner
 * POST /api/signal-engine/scan
 *
 * Scans all data sources for threshold-crossing events.
 * Creates signal_events for any new thresholds detected.
 * Designed to run hourly via cron or manual trigger.
 */

interface SignalEvent {
  signal_type: string;
  source_table: string;
  region_code?: string;
  region_name?: string;
  state?: string;
  payload: Record<string, unknown>;
  priority: 'critical' | 'high' | 'medium' | 'low';
  cooldown_key: string;
}

const MILESTONE_THRESHOLDS = [5, 10, 25, 50, 100];
const SYSTEM_CONCENTRATION_THRESHOLD = 0.6; // 60%
const MIN_REPORTS_FOR_CONCENTRATION = 5;

// Cooldown windows in days
const COOLDOWN_DAYS: Record<string, number> = {
  milestone: 30,
  report_spike: 7,
  system_concentration: 14,
  service_gap: 30,
};

export async function POST() {
  try {
    const supabase = createSignalEngineClient();
    const signals: SignalEvent[] = [];

    // === THRESHOLD 1: Region Milestones ===
    const { data: totals } = await supabase
      .from('discrimination_sa3_totals_v')
      .select('*');

    if (totals) {
      for (const region of totals) {
        const count = Number(region.total_reports);
        // Find the highest milestone this region has crossed
        const crossedMilestones = MILESTONE_THRESHOLDS.filter(m => count >= m);
        if (crossedMilestones.length > 0) {
          const milestone = crossedMilestones[crossedMilestones.length - 1];
          signals.push({
            signal_type: 'milestone',
            source_table: 'discrimination_sa3_totals_v',
            region_code: region.sa3_code,
            region_name: region.sa3_name,
            state: region.sa3_state,
            payload: {
              total_reports: count,
              milestone,
              system_types_reported: region.system_types_reported,
            },
            priority: milestone >= 50 ? 'high' : 'medium',
            cooldown_key: `milestone:${region.sa3_code}:${milestone}`,
          });
        }
      }
    }

    // === THRESHOLD 2: System Type Concentration ===
    const { data: aggregations } = await supabase
      .from('discrimination_aggregations_v')
      .select('*');

    if (aggregations && totals) {
      // Group aggregations by region
      const byRegion = new Map<string, typeof aggregations>();
      for (const agg of aggregations) {
        const existing = byRegion.get(agg.sa3_code) || [];
        existing.push(agg);
        byRegion.set(agg.sa3_code, existing);
      }

      for (const [sa3Code, regionAggs] of byRegion) {
        const regionTotal = totals.find(t => t.sa3_code === sa3Code);
        if (!regionTotal || Number(regionTotal.total_reports) < MIN_REPORTS_FOR_CONCENTRATION) continue;

        const totalCount = Number(regionTotal.total_reports);
        for (const agg of regionAggs) {
          const count = Number(agg.report_count);
          const pct = count / totalCount;
          if (pct >= SYSTEM_CONCENTRATION_THRESHOLD) {
            signals.push({
              signal_type: 'system_concentration',
              source_table: 'discrimination_aggregations_v',
              region_code: sa3Code,
              region_name: agg.sa3_name,
              state: agg.sa3_state,
              payload: {
                system_type: agg.system_type,
                system_count: count,
                total_reports: totalCount,
                concentration_pct: Math.round(pct * 100),
              },
              priority: 'medium',
              cooldown_key: `system_concentration:${sa3Code}:${agg.system_type}`,
            });
          }
        }
      }
    }

    // === THRESHOLD 3: Service Gaps ===
    // Regions with reports but no nearby services
    if (totals) {
      const { data: services } = await supabase
        .from('services_complete')
        .select('state, latitude, longitude')
        .not('latitude', 'is', null);

      if (services) {
        for (const region of totals) {
          if (Number(region.total_reports) < 5) continue;
          // Simple check: any services in same state?
          const stateServices = services.filter(s => s.state === region.sa3_state);
          if (stateServices.length === 0) {
            signals.push({
              signal_type: 'service_gap',
              source_table: 'discrimination_sa3_totals_v',
              region_code: region.sa3_code,
              region_name: region.sa3_name,
              state: region.sa3_state,
              payload: {
                total_reports: Number(region.total_reports),
                services_in_state: 0,
              },
              priority: 'critical',
              cooldown_key: `service_gap:${region.sa3_code}`,
            });
          }
        }
      }
    }

    // === DEDUPLICATION: Check cooldown windows ===
    const newSignals: SignalEvent[] = [];
    for (const signal of signals) {
      const cooldownDays = COOLDOWN_DAYS[signal.signal_type] || 7;
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

      const { data: existing } = await supabase
        .from('signal_events')
        .select('id')
        .eq('cooldown_key', signal.cooldown_key)
        .gte('created_at', cooldownDate.toISOString())
        .limit(1);

      if (!existing || existing.length === 0) {
        newSignals.push(signal);
      }
    }

    // === INSERT new signals ===
    if (newSignals.length > 0) {
      const { error } = await supabase
        .from('signal_events')
        .insert(newSignals);

      if (error) {
        console.error('Failed to insert signals:', error);
        return NextResponse.json({ error: 'Failed to insert signals' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      scanned: {
        regions: totals?.length || 0,
        aggregations: aggregations?.length || 0,
      },
      signals_detected: signals.length,
      signals_new: newSignals.length,
      signals_deduplicated: signals.length - newSignals.length,
      signals: newSignals.map(s => ({
        type: s.signal_type,
        region: s.region_name,
        priority: s.priority,
        cooldown_key: s.cooldown_key,
      })),
    });
  } catch (error) {
    console.error('SENTINEL scan error:', error);
    return NextResponse.json(
      { error: 'Scan failed', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
