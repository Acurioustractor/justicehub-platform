import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

type TrackedTableName = keyof Database['public']['Tables'];

interface TrackedTable {
  name: TrackedTableName;
  keyColumns: string[];
}

const TRACKED_TABLES = [
  { name: 'alma_interventions', keyColumns: ['name', 'type'] },
  { name: 'alma_evidence', keyColumns: ['title', 'evidence_type'] },
  { name: 'alma_outcomes', keyColumns: ['outcome_type'] },
  { name: 'alma_community_contexts', keyColumns: ['context_type'] },
  { name: 'alma_funding_opportunities', keyColumns: ['name', 'funder_name'] },
  { name: 'alma_funding_data', keyColumns: ['jurisdiction', 'amount'] },
  { name: 'alma_weekly_reports', keyColumns: ['title', 'summary'] },
  { name: 'alma_source_registry', keyColumns: ['name', 'url'] },
  { name: 'alma_ingestion_jobs', keyColumns: ['source_type', 'status'] },
  { name: 'alma_discovered_links', keyColumns: ['url'] },
  { name: 'alma_raw_content', keyColumns: ['url'] },
  { name: 'alma_intervention_outcomes', keyColumns: ['intervention_id'] },
  { name: 'alma_intervention_contexts', keyColumns: ['intervention_id'] },
  { name: 'organizations', keyColumns: ['name'] },
  { name: 'services', keyColumns: ['name', 'service_type'] },
  { name: 'articles', keyColumns: ['title'] },
  { name: 'blog_posts', keyColumns: ['title'] },
  { name: 'events', keyColumns: ['title', 'event_date'] },
  { name: 'stories', keyColumns: ['title', 'status'] },
  { name: 'opportunities', keyColumns: ['title'] },
  { name: 'public_profiles', keyColumns: ['display_name'] },
  { name: 'art_innovation', keyColumns: ['title'] },
  { name: 'funding_transparency', keyColumns: [] },
] as TrackedTable[];

interface TableHealth {
  name: string;
  count: number;
  lastUpdated: string | null;
  healthScore: 'green' | 'yellow' | 'red';
  keyColumns: string[];
}

function extractTimestamp(rows: unknown, column: 'updated_at' | 'created_at'): string | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const first = rows[0];
  if (!first || typeof first !== 'object') {
    return null;
  }
  const value = (first as Record<string, unknown>)[column];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function GET() {
  const supabase = createServiceClient();
  const untypedSupabase = supabase as any;
  const results: TableHealth[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const table of TRACKED_TABLES) {
    try {
      const tableName = table.name as string;
      // Get count
      const { count, error: countError } = await untypedSupabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        results.push({
          name: table.name,
          count: 0,
          lastUpdated: null,
          healthScore: 'red',
          keyColumns: table.keyColumns,
        });
        continue;
      }

      const rowCount = count || 0;

      // Get last updated timestamp
      let lastUpdated: string | null = null;
      const timestampCol = 'updated_at';
      const fallbackCol = 'created_at';

      const { data: latestRow } = await untypedSupabase
        .from(tableName)
        .select(timestampCol)
        .order(timestampCol, { ascending: false })
        .limit(1);

      lastUpdated = extractTimestamp(latestRow, timestampCol);
      if (!lastUpdated) {
        const { data: fallbackRow } = await untypedSupabase
          .from(tableName)
          .select(fallbackCol)
          .order(fallbackCol, { ascending: false })
          .limit(1);

        lastUpdated = extractTimestamp(fallbackRow, fallbackCol);
      }

      // Calculate health score
      let healthScore: 'green' | 'yellow' | 'red' = 'red';
      if (rowCount === 0) {
        healthScore = 'red';
      } else if (lastUpdated) {
        const lastDate = new Date(lastUpdated);
        if (rowCount > 10 && lastDate > sevenDaysAgo) {
          healthScore = 'green';
        } else if (lastDate > thirtyDaysAgo) {
          healthScore = 'yellow';
        } else {
          healthScore = 'red';
        }
      } else if (rowCount > 0) {
        healthScore = 'yellow';
      }

      results.push({
        name: table.name,
        count: rowCount,
        lastUpdated,
        healthScore,
        keyColumns: table.keyColumns,
      });
    } catch {
      results.push({
        name: table.name,
        count: 0,
        lastUpdated: null,
        healthScore: 'red',
        keyColumns: table.keyColumns,
      });
    }
  }

  // Get latest ingestion job for scraper status
  let lastScrapeJob: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase
      .from('alma_ingestion_jobs')
      .select('id, status, source_type, source_url, started_at, completed_at, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      const row = data[0] as Record<string, unknown>;
      lastScrapeJob = {
        ...row,
        // Keep legacy key for existing admin UI while removing invalid DB assumptions.
        job_type: row.source_type,
      };
    }
  } catch {
    // ignore
  }

  const summary = {
    total_tables: results.length,
    healthy: results.filter(r => r.healthScore === 'green').length,
    warning: results.filter(r => r.healthScore === 'yellow').length,
    critical: results.filter(r => r.healthScore === 'red').length,
    empty_tables: results.filter(r => r.count === 0).length,
    total_records: results.reduce((sum, r) => sum + r.count, 0),
  };

  return NextResponse.json({
    tables: results,
    summary,
    lastScrapeJob,
    generatedAt: now.toISOString(),
  });
}
