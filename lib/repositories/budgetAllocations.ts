import { getSupabaseAdmin } from '@/lib/supabase/server';
import { handleDatabaseError, withRetry } from '@/lib/supabase/errors';
import type { BudgetAllocation } from '@/types/database';
import { budgetAllocationSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

export class BudgetAllocationsRepository {
  private supabase = getSupabaseAdmin();

  /**
   * Get all budget allocations with optional filters
   */
  async getAll(filters?: {
    fiscal_year?: string;
    department?: string;
    category?: string;
    limit?: number;
  }): Promise<BudgetAllocation[]> {
    return withRetry(async () => {
      let query = this.supabase
        .from('budget_allocations')
        .select('*')
        .order('fiscal_year', { ascending: false })
        .order('amount', { ascending: false });

      if (filters?.fiscal_year) {
        query = query.eq('fiscal_year', filters.fiscal_year);
      }
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Get budget allocations by fiscal year
   */
  async getByFiscalYear(fiscalYear: string): Promise<BudgetAllocation[]> {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('budget_allocations')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .order('amount', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Get total budget by category
   */
  async getTotalsByCategory(fiscalYear?: string) {
    return withRetry(async () => {
      let query = this.supabase
        .from('budget_allocations')
        .select('category, amount, fiscal_year');

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate in application layer (Supabase doesn't support direct aggregation in free tier)
      const totals = new Map<string, number>();
      
      for (const allocation of data || []) {
        const current = totals.get(allocation.category) || 0;
        totals.set(allocation.category, current + ((allocation as any).amount || 0));
      }

      return Array.from(totals.entries()).map(([category, total]) => ({
        category,
        total,
        percentage: 0, // Will be calculated after getting all totals
      }));
    });
  }

  /**
   * Get year-over-year comparison
   */
  async getYearComparison(years: string[]) {
    return withRetry(async () => {
      const { data, error } = await this.supabase
        .from('budget_allocations')
        .select('*')
        .in('fiscal_year', years)
        .order('fiscal_year', { ascending: true });

      if (error) throw error;

      // Group by year and category
      const comparison = new Map<string, Map<string, number>>();
      
      for (const allocation of data || []) {
        if (!comparison.has(allocation.fiscal_year)) {
          comparison.set(allocation.fiscal_year, new Map());
        }
        
        const yearMap = comparison.get(allocation.fiscal_year)!;
        const current = yearMap.get(allocation.category) || 0;
        yearMap.set(allocation.category, current + ((allocation as any).amount || 0));
      }

      return comparison;
    });
  }

  /**
   * Calculate budget efficiency metrics
   */
  async getEfficiencyMetrics(fiscalYear: string) {
    return withRetry(async () => {
      const [allocations, youthStats] = await Promise.all([
        this.getByFiscalYear(fiscalYear),
        this.supabase
          .from('youth_statistics')
          .select('*')
          .gte('date', `${fiscalYear.split('-')[0]}-07-01`)
          .lte('date', `${parseInt(fiscalYear.split('-')[0]) + 1}-06-30`)
          .order('date', { ascending: false })
          .limit(1)
      ]);

      const totalBudget = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
      const detentionBudget = allocations
        .filter(a => a.category === 'detention')
        .reduce((sum, a) => sum + (a.amount || 0), 0);
      const communityBudget = allocations
        .filter(a => a.category === 'community')
        .reduce((sum, a) => sum + (a.amount || 0), 0);

      const latestStats = youthStats.data?.[0];
      const costPerYouth = latestStats?.total_youth 
        ? totalBudget / latestStats.total_youth / 365 
        : 0;

      return {
        totalBudget,
        detentionBudget,
        communityBudget,
        detentionPercentage: (detentionBudget / totalBudget) * 100,
        communityPercentage: (communityBudget / totalBudget) * 100,
        costPerYouthPerDay: costPerYouth,
        youthInDetention: latestStats?.total_youth || 0,
      };
    });
  }

  /**
   * Create a new budget allocation (admin only)
   */
  async create(data: z.infer<typeof budgetAllocationSchema>): Promise<BudgetAllocation> {
    const validated = budgetAllocationSchema.parse(data);

    return withRetry(async () => {
      const { data: created, error } = await this.supabase
        .from('budget_allocations')
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
   * Update a budget allocation (admin only)
   */
  async update(
    id: string,
    updates: Partial<z.infer<typeof budgetAllocationSchema>>
  ): Promise<BudgetAllocation> {
    return withRetry(async () => {
      const { data: updated, error } = await this.supabase
        .from('budget_allocations')
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
   * Get department spending rankings
   */
  async getDepartmentRankings(fiscalYear?: string) {
    return withRetry(async () => {
      let query = this.supabase
        .from('budget_allocations')
        .select('department, amount, fiscal_year');

      if (fiscalYear) {
        query = query.eq('fiscal_year', fiscalYear);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by department
      const departmentTotals = new Map<string, number>();
      
      for (const allocation of data || []) {
        const current = departmentTotals.get(allocation.department) || 0;
        departmentTotals.set(allocation.department, current + ((allocation as any).amount || 0));
      }

      // Convert to array and sort
      return Array.from(departmentTotals.entries())
        .map(([department, total]) => ({ department, total }))
        .sort((a, b) => b.total - a.total);
    });
  }
}

// Export singleton instance
export const budgetAllocationsRepo = new BudgetAllocationsRepository();