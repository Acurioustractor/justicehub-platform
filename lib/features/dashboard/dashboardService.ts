import { getSupabaseAdmin } from '@/lib/supabase/server';
import { youthStatisticsRepo } from '@/lib/repositories/youthStatistics';
import { budgetAllocationsRepo } from '@/lib/repositories/budgetAllocations';
import { withRetry } from '@/lib/supabase/errors';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export interface DashboardMetrics {
  current: {
    totalYouth: number;
    indigenousYouth: number;
    indigenousPercentage: number;
    facilities: {
      name: string;
      count: number;
      percentage: number;
    }[];
    averageAge: number;
    averageStayDays: number;
  };
  trends: {
    daily: TrendData[];
    weekly: TrendData[];
    monthly: TrendData[];
  };
  budget: {
    totalAllocated: number;
    detentionCost: number;
    communityCost: number;
    costPerYouthPerDay: number;
    projectedAnnualCost: number;
  };
  comparisons: {
    detentionVsCommunity: {
      detentionCost: number;
      communityCost: number;
      ratio: number;
      potentialSavings: number;
    };
    versusEducation: {
      detentionDailyCost: number;
      schoolYearlyCost: number;
      daysEquivalent: number;
    };
  };
  alerts: Alert[];
  lastUpdated: string;
}

interface TrendData {
  date: string;
  totalYouth: number;
  indigenousYouth: number;
  indigenousPercentage: number;
  change: number;
  changePercentage: number;
}

interface Alert {
  id: string;
  type: 'increase' | 'decrease' | 'threshold' | 'milestone';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  value?: number;
  timestamp: string;
}

export class DashboardService {
  private supabase = getSupabaseAdmin();

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [
      currentMetrics,
      trends,
      budgetMetrics,
      comparisons,
      alerts
    ] = await Promise.all([
      this.getCurrentMetrics(),
      this.getTrendData(),
      this.getBudgetMetrics(),
      this.getComparisons(),
      this.generateAlerts()
    ]);

    return {
      current: currentMetrics,
      trends,
      budget: budgetMetrics,
      comparisons,
      alerts,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get current detention metrics
   */
  private async getCurrentMetrics() {
    return withRetry(async () => {
      // Get latest statistics
      const latest = await youthStatisticsRepo.getLatest(10);
      
      if (!latest || latest.length === 0) {
        throw new Error('No youth statistics data available');
      }

      // Aggregate by facility
      const facilityMap = new Map<string, { count: number; indigenous: number }>();
      let totalYouth = 0;
      let totalIndigenous = 0;
      let totalAge = 0;
      let totalStayDays = 0;
      let ageCount = 0;
      let stayCount = 0;

      for (const stat of latest) {
        const current = facilityMap.get(stat.facility_name) || { count: 0, indigenous: 0 };
        current.count += stat.total_youth;
        current.indigenous += stat.indigenous_youth;
        facilityMap.set(stat.facility_name, current);

        totalYouth += stat.total_youth;
        totalIndigenous += stat.indigenous_youth;
        
        if (stat.average_age) {
          totalAge += stat.average_age * stat.total_youth;
          ageCount += stat.total_youth;
        }
        
        if (stat.average_stay_days) {
          totalStayDays += stat.average_stay_days * stat.total_youth;
          stayCount += stat.total_youth;
        }
      }

      // Calculate facility breakdown
      const facilities = Array.from(facilityMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          percentage: (data.count / totalYouth) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        totalYouth,
        indigenousYouth: totalIndigenous,
        indigenousPercentage: (totalIndigenous / totalYouth) * 100,
        facilities,
        averageAge: ageCount > 0 ? totalAge / ageCount : 0,
        averageStayDays: stayCount > 0 ? totalStayDays / stayCount : 0,
      };
    });
  }

  /**
   * Get trend data for different time periods
   */
  private async getTrendData() {
    return withRetry(async () => {
      const endDate = new Date();
      const dailyStartDate = subDays(endDate, 30);
      const weeklyStartDate = subDays(endDate, 90);
      const monthlyStartDate = subDays(endDate, 365);

      const { data: allData } = await this.supabase
        .from('youth_statistics')
        .select('date, total_youth, indigenous_youth, indigenous_percentage')
        .gte('date', monthlyStartDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (!allData || allData.length === 0) {
        return { daily: [], weekly: [], monthly: [] };
      }

      // Process daily trends
      const daily = this.processTrendData(
        allData.filter(d => new Date(d.date) >= dailyStartDate),
        'daily'
      );

      // Process weekly trends
      const weekly = this.processTrendData(
        allData.filter(d => new Date(d.date) >= weeklyStartDate),
        'weekly'
      );

      // Process monthly trends
      const monthly = this.processTrendData(allData, 'monthly');

      return { daily, weekly, monthly };
    });
  }

  /**
   * Process trend data with change calculations
   */
  private processTrendData(data: any[], period: 'daily' | 'weekly' | 'monthly'): TrendData[] {
    const aggregated = new Map<string, { total: number; indigenous: number; count: number }>();

    // Aggregate data by period
    for (const record of data) {
      const date = new Date(record.date);
      let key: string;

      if (period === 'daily') {
        key = format(date, 'yyyy-MM-dd');
      } else if (period === 'weekly') {
        key = format(date, 'yyyy-ww');
      } else {
        key = format(date, 'yyyy-MM');
      }

      const current = aggregated.get(key) || { total: 0, indigenous: 0, count: 0 };
      current.total += record.total_youth;
      current.indigenous += record.indigenous_youth;
      current.count += 1;
      aggregated.set(key, current);
    }

    // Convert to trend data with change calculations
    const trends: TrendData[] = [];
    let previousTotal = 0;

    for (const [dateKey, data] of aggregated) {
      const avgTotal = data.total / data.count;
      const avgIndigenous = data.indigenous / data.count;
      const change = avgTotal - previousTotal;
      const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

      trends.push({
        date: dateKey,
        totalYouth: Math.round(avgTotal),
        indigenousYouth: Math.round(avgIndigenous),
        indigenousPercentage: (avgIndigenous / avgTotal) * 100,
        change: Math.round(change),
        changePercentage: parseFloat(changePercentage.toFixed(1)),
      });

      previousTotal = avgTotal;
    }

    return trends;
  }

  /**
   * Get budget metrics
   */
  private async getBudgetMetrics() {
    return withRetry(async () => {
      const currentYear = new Date().getFullYear();
      const fiscalYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
      
      const allocations = await budgetAllocationsRepo.getByFiscalYear(fiscalYear);
      
      const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
      const detentionCost = allocations
        .filter(a => a.category === 'detention')
        .reduce((sum, a) => sum + a.amount, 0);
      const communityCost = allocations
        .filter(a => a.category === 'community')
        .reduce((sum, a) => sum + a.amount, 0);

      // Get current youth count for per-capita calculations
      const currentMetrics = await this.getCurrentMetrics();
      const costPerYouthPerDay = currentMetrics.totalYouth > 0 
        ? totalAllocated / currentMetrics.totalYouth / 365
        : 0;

      return {
        totalAllocated,
        detentionCost,
        communityCost,
        costPerYouthPerDay,
        projectedAnnualCost: costPerYouthPerDay * currentMetrics.totalYouth * 365,
      };
    });
  }

  /**
   * Get cost comparisons
   */
  private async getComparisons() {
    return withRetry(async () => {
      // Get cost comparison data
      const { data: costComparisons } = await this.supabase
        .from('cost_comparisons')
        .select('*');

      const detentionDailyCost = 857; // Default from government data
      const communityDailyCost = 41;
      const schoolYearlyCost = costComparisons?.find(c => c.item.includes('school'))?.cost || 15000;

      const currentMetrics = await this.getCurrentMetrics();
      const potentialSavings = currentMetrics.totalYouth * (detentionDailyCost - communityDailyCost) * 365;

      return {
        detentionVsCommunity: {
          detentionCost: detentionDailyCost,
          communityCost: communityDailyCost,
          ratio: detentionDailyCost / communityDailyCost,
          potentialSavings,
        },
        versusEducation: {
          detentionDailyCost,
          schoolYearlyCost,
          daysEquivalent: Math.round(schoolYearlyCost / detentionDailyCost),
        },
      };
    });
  }

  /**
   * Generate alerts based on data patterns
   */
  private async generateAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    try {
      // Get recent data for comparison
      const recent = await youthStatisticsRepo.getLatest(30);
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const currentTotal = recent[0]?.total_youth || 0;
      const previousTotal = recent.find(r => 
        new Date(r.date) <= thirtyDaysAgo
      )?.total_youth || currentTotal;

      const change = currentTotal - previousTotal;
      const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

      // Alert for significant increases
      if (changePercentage > 10) {
        alerts.push({
          id: 'increase-alert',
          type: 'increase',
          severity: changePercentage > 20 ? 'critical' : 'warning',
          title: 'Significant Increase in Youth Detention',
          message: `Youth detention numbers have increased by ${changePercentage.toFixed(1)}% in the last 30 days`,
          value: change,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert for high indigenous percentage
      const currentIndigenousPercentage = recent[0]?.indigenous_percentage || 0;
      if (currentIndigenousPercentage > 70) {
        alerts.push({
          id: 'indigenous-alert',
          type: 'threshold',
          severity: currentIndigenousPercentage > 80 ? 'critical' : 'warning',
          title: 'High Indigenous Over-representation',
          message: `${currentIndigenousPercentage.toFixed(1)}% of detained youth are Indigenous`,
          value: currentIndigenousPercentage,
          timestamp: new Date().toISOString(),
        });
      }

      // Alert for milestone numbers
      if (currentTotal % 50 === 0 && currentTotal > 0) {
        alerts.push({
          id: 'milestone-alert',
          type: 'milestone',
          severity: 'info',
          title: 'Detention Milestone Reached',
          message: `Total youth in detention has reached ${currentTotal}`,
          value: currentTotal,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      console.error('Error generating alerts:', error);
    }

    return alerts;
  }

  /**
   * Get real-time updates (for WebSocket or SSE)
   */
  async subscribeToUpdates(callback: (update: any) => void) {
    // Subscribe to database changes
    const subscription = this.supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'youth_statistics'
      }, payload => {
        callback({
          type: 'youth_statistics_update',
          data: payload,
          timestamp: new Date().toISOString(),
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'budget_allocations'
      }, payload => {
        callback({
          type: 'budget_update',
          data: payload,
          timestamp: new Date().toISOString(),
        });
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();