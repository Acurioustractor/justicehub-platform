import { getSupabaseAdmin } from '@/lib/supabase/server';
import { handleDatabaseError, withRetry } from '@/lib/supabase/errors';
import type { YouthStatistic } from '@/types/database';
import { youthStatisticSchema } from '@/types/validation';
import { z } from 'zod';

export class YouthStatisticsRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Get latest youth statistics with optional limit
   */
  async getLatest(limit = 10): Promise<YouthStatistic[]> {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('youth_statistics')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Get statistics by date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<YouthStatistic[]> {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('youth_statistics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Get statistics by facility
   */
  async getByFacility(facilityName: string): Promise<YouthStatistic[]> {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('youth_statistics')
        .select('*')
        .eq('facility_name', facilityName)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Get aggregated statistics
   */
  async getAggregatedStats() {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('youth_statistics')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      const latest = data?.[0];
      if (!latest) return null;

      // Calculate additional metrics
      return {
        latest,
        metrics: {
          totalYouth: latest.total_youth,
          indigenousYouth: latest.indigenous_youth,
          indigenousPercentage: latest.indigenous_percentage,
          dailyCost: latest.total_youth * 2000, // $2000 per youth per day
          annualCost: latest.total_youth * 2000 * 365,
        },
      };
    });
  }

  /**
   * Create a new statistic (admin only)
   */
  async create(data: z.infer<typeof youthStatisticSchema>): Promise<YouthStatistic> {
    // Validate input
    const validated = youthStatisticSchema.parse(data);

    return withRetry(async () => {
      const { data: created, error } = await this.supabase
        .from('youth_statistics')
        .insert({
          ...validated,
          scraped_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    });
  }

  /**
   * Update a statistic (admin only)
   */
  async update(id: string, updates: Partial<z.infer<typeof youthStatisticSchema>>): Promise<YouthStatistic> {
    return withRetry(async () => {
      const { data: updated, error } = await this.supabase
        .from('youth_statistics')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    });
  }

  /**
   * Get trend data for charts
   */
  async getTrendData(days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('youth_statistics')
        .select('date, total_youth, indigenous_youth, indigenous_percentage')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Format for charts
      return data?.map(stat => ({
        date: stat.date,
        total: stat.total_youth,
        indigenous: stat.indigenous_youth,
        percentage: stat.indigenous_percentage,
      })) || [];
    });
  }
}

// Export singleton instance
export const youthStatisticsRepo = new YouthStatisticsRepository();