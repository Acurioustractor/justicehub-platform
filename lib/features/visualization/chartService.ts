import { getSupabaseAdmin } from '@/lib/supabase/server';
import { withRetry } from '@/lib/supabase/errors';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
export type DataAggregation = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ChartOptions {
  type: ChartType;
  title: string;
  table: string;
  xAxis: string;
  yAxis: string | string[];
  aggregation?: DataAggregation;
  filters?: Record<string, any>;
  dateRange?: {
    from: string;
    to: string;
  };
  groupBy?: string;
  limit?: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
  metadata: {
    title: string;
    type: ChartType;
    totalRecords: number;
    dateRange?: {
      from: string;
      to: string;
    };
  };
}

export class ChartService {
  private supabase = getSupabaseAdmin();

  /**
   * Generate chart data based on options
   */
  async generateChart(options: ChartOptions): Promise<ChartData> {
    return withRetry(async () => {
      const data = await this.fetchChartData(options);
      return this.processChartData(data, options);
    });
  }

  /**
   * Get youth statistics trends over time
   */
  async getYouthTrends(
    period: DataAggregation = 'monthly',
    months: number = 12
  ): Promise<ChartData> {
    const endDate = new Date();
    const startDate = subMonths(endDate, months);

    return this.generateChart({
      type: 'line',
      title: 'Youth Detention Trends',
      table: 'youth_statistics',
      xAxis: 'date',
      yAxis: ['total_youth', 'indigenous_youth'],
      aggregation: period,
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
    });
  }

  /**
   * Get budget allocation breakdown
   */
  async getBudgetBreakdown(fiscalYear?: string): Promise<ChartData> {
    const currentYear = new Date().getFullYear();
    const year = fiscalYear || `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    return this.generateChart({
      type: 'pie',
      title: `Budget Allocation Breakdown (${year})`,
      table: 'budget_allocations',
      xAxis: 'category',
      yAxis: 'amount',
      filters: { fiscal_year: year },
      groupBy: 'category',
    });
  }

  /**
   * Get facility capacity comparison
   */
  async getFacilityComparison(): Promise<ChartData> {
    return this.generateChart({
      type: 'bar',
      title: 'Youth by Facility',
      table: 'youth_statistics',
      xAxis: 'facility_name',
      yAxis: 'total_youth',
      aggregation: 'monthly',
      limit: 10,
    });
  }

  /**
   * Get indigenous representation over time
   */
  async getIndigenousRepresentation(months: number = 24): Promise<ChartData> {
    const endDate = new Date();
    const startDate = subMonths(endDate, months);

    return this.generateChart({
      type: 'area',
      title: 'Indigenous Representation Over Time',
      table: 'youth_statistics',
      xAxis: 'date',
      yAxis: 'indigenous_percentage',
      aggregation: 'monthly',
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
    });
  }

  /**
   * Get court statistics by type
   */
  async getCourtStatistics(): Promise<ChartData> {
    return this.generateChart({
      type: 'bar',
      title: 'Court Statistics by Type',
      table: 'court_statistics',
      xAxis: 'court_type',
      yAxis: ['total_defendants', 'indigenous_defendants'],
      groupBy: 'court_type',
    });
  }

  /**
   * Get cost comparison scatter plot
   */
  async getCostEfficiencyScatter(): Promise<ChartData> {
    // This would require joining budget and youth data
    // For now, return a simplified version
    const { data: budgetData } = await this.supabase
      .from('budget_allocations')
      .select('category, amount')
      .order('amount', { ascending: false })
      .limit(20);

    const { data: youthData } = await this.supabase
      .from('youth_statistics')
      .select('facility_name, total_youth, indigenous_percentage')
      .order('date', { ascending: false })
      .limit(20);

    if (!budgetData || !youthData) {
      throw new Error('Insufficient data for cost efficiency analysis');
    }

    // Create scatter plot data
    const scatterData = youthData.map((youth, index) => ({
      x: youth.total_youth,
      y: youth.indigenous_percentage,
      label: youth.facility_name,
    }));

    return {
      labels: youthData.map(y => y.facility_name),
      datasets: [{
        label: 'Facility Efficiency',
        data: scatterData.map(d => d.y),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
      }],
      metadata: {
        title: 'Facility Capacity vs Indigenous Representation',
        type: 'scatter',
        totalRecords: youthData.length,
      },
    };
  }

  /**
   * Fetch data for chart generation
   */
  private async fetchChartData(options: ChartOptions): Promise<any[]> {
    // Select columns
    const columns = [options.xAxis];
    if (Array.isArray(options.yAxis)) {
      columns.push(...options.yAxis);
    } else {
      columns.push(options.yAxis);
    }
    if (options.groupBy && !columns.includes(options.groupBy)) {
      columns.push(options.groupBy);
    }

    let query = this.supabase.from(options.table).select(columns.join(', '));

    // Apply filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      }
    }

    // Apply date range
    if (options.dateRange) {
      const dateColumn = this.getDateColumn(options.table);
      if (options.dateRange.from) {
        query = query.gte(dateColumn, options.dateRange.from);
      }
      if (options.dateRange.to) {
        query = query.lte(dateColumn, options.dateRange.to);
      }
    }

    // Apply ordering
    query = query.order(options.xAxis, { ascending: true });

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch chart data: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Process raw data into chart format
   */
  private processChartData(data: any[], options: ChartOptions): ChartData {
    if (data.length === 0) {
      return {
        labels: [],
        datasets: [],
        metadata: {
          title: options.title,
          type: options.type,
          totalRecords: 0,
        },
      };
    }

    let processedData;

    if (options.aggregation && options.aggregation !== 'daily') {
      processedData = this.aggregateData(data, options);
    } else if (options.groupBy) {
      processedData = this.groupData(data, options);
    } else {
      processedData = data;
    }

    // Extract labels
    const labels = processedData.map(item => 
      this.formatLabel((item as any)[options.xAxis], options.xAxis)
    );

    // Create datasets
    const datasets = this.createDatasets(processedData, options);

    return {
      labels,
      datasets,
      metadata: {
        title: options.title,
        type: options.type,
        totalRecords: data.length,
        dateRange: options.dateRange,
      },
    };
  }

  /**
   * Aggregate data by time period
   */
  private aggregateData(data: any[], options: ChartOptions): any[] {
    const aggregated = new Map<string, any>();

    for (const item of data) {
      const date = new Date(item[options.xAxis]);
      let key: string;

      switch (options.aggregation) {
        case 'weekly':
          key = format(date, 'yyyy-ww');
          break;
        case 'monthly':
          key = format(date, 'yyyy-MM');
          break;
        case 'quarterly':
          key = format(date, 'yyyy-QQQ');
          break;
        case 'yearly':
          key = format(date, 'yyyy');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      if (!aggregated.has(key)) {
        const newItem: any = { [options.xAxis]: key };
        
        // Initialize numeric fields
        if (Array.isArray(options.yAxis)) {
          for (const field of options.yAxis) {
            newItem[field] = 0;
            newItem[`${field}_count`] = 0;
          }
        } else {
          newItem[options.yAxis] = 0;
          newItem[`${options.yAxis}_count`] = 0;
        }
        
        aggregated.set(key, newItem);
      }

      const current = aggregated.get(key)!;
      
      // Aggregate values
      if (Array.isArray(options.yAxis)) {
        for (const field of options.yAxis) {
          if (item[field] !== null && item[field] !== undefined) {
            current[field] += item[field];
            current[`${field}_count`] += 1;
          }
        }
      } else {
        if (item[options.yAxis] !== null && item[options.yAxis] !== undefined) {
          current[options.yAxis] += item[options.yAxis];
          current[`${options.yAxis}_count`] += 1;
        }
      }
    }

    // Calculate averages
    const result = Array.from(aggregated.values()).map(item => {
      const averaged = { ...item };
      
      if (Array.isArray(options.yAxis)) {
        for (const field of options.yAxis) {
          const count = averaged[`${field}_count`];
          if (count > 0) {
            averaged[field] = averaged[field] / count;
          }
          delete averaged[`${field}_count`];
        }
      } else {
        const count = averaged[`${options.yAxis}_count`];
        if (count > 0) {
          averaged[options.yAxis] = averaged[options.yAxis] / count;
        }
        delete averaged[`${options.yAxis}_count`];
      }
      
      return averaged;
    });

    return result.sort((a, b) => a[options.xAxis].localeCompare(b[options.xAxis]));
  }

  /**
   * Group data by specified field
   */
  private groupData(data: any[], options: ChartOptions): any[] {
    const grouped = new Map<string, any>();

    for (const item of data) {
      const key = item[options.groupBy!];
      
      if (!grouped.has(key)) {
        const newItem: any = { [options.xAxis]: key };
        
        if (Array.isArray(options.yAxis)) {
          for (const field of options.yAxis) {
            newItem[field] = 0;
          }
        } else {
          newItem[options.yAxis] = 0;
        }
        
        grouped.set(key, newItem);
      }

      const current = grouped.get(key)!;
      
      if (Array.isArray(options.yAxis)) {
        for (const field of options.yAxis) {
          if (item[field] !== null && item[field] !== undefined) {
            current[field] += item[field];
          }
        }
      } else {
        if (item[options.yAxis] !== null && item[options.yAxis] !== undefined) {
          current[options.yAxis] += item[options.yAxis];
        }
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * Create datasets for Chart.js format
   */
  private createDatasets(data: any[], options: ChartOptions): any[] {
    const datasets = [];
    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 205, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
    ];

    if (Array.isArray(options.yAxis)) {
      options.yAxis.forEach((field, index) => {
        datasets.push({
          label: this.formatFieldName(field),
          data: data.map(item => (item as any)[field] || 0),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.6', '1'),
          fill: options.type === 'area',
        });
      });
    } else {
      if (options.type === 'pie') {
        datasets.push({
          label: this.formatFieldName(options.yAxis as string),
          data: data.map(item => (item as any)[options.yAxis as string] || 0),
          backgroundColor: colors.slice(0, data.length),
        });
      } else {
        datasets.push({
          label: this.formatFieldName(options.yAxis as string),
          data: data.map(item => (item as any)[options.yAxis as string] || 0),
          backgroundColor: colors[0],
          borderColor: colors[0].replace('0.6', '1'),
          fill: options.type === 'area',
        });
      }
    }

    return datasets;
  }

  /**
   * Helper: Get date column for table
   */
  private getDateColumn(table: string): string {
    switch (table) {
      case 'youth_statistics':
      case 'parliamentary_documents':
        return 'date';
      case 'budget_allocations':
        return 'fiscal_year';
      case 'court_statistics':
        return 'report_period';
      default:
        return 'created_at';
    }
  }

  /**
   * Helper: Format label for display
   */
  private formatLabel(value: any, field: string): string {
    if (field === 'date' && value) {
      return format(new Date(value), 'MMM yyyy');
    }
    return String(value || '');
  }

  /**
   * Helper: Format field name for display
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}

// Export singleton instance
export const chartService = new ChartService();