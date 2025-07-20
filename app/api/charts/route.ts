import { NextRequest, NextResponse } from 'next/server';
import { chartService, ChartOptions } from '@/lib/features/visualization/chartService';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { queryTracker } from '@/lib/monitoring/performance';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Chart request schema
const chartRequestSchema = z.object({
  type: z.enum(['line', 'bar', 'pie', 'area', 'scatter']),
  title: z.string(),
  table: z.enum(['youth_statistics', 'budget_allocations', 'court_statistics', 'parliamentary_documents']),
  xAxis: z.string(),
  yAxis: z.union([z.string(), z.array(z.string())]),
  aggregation: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  filters: z.record(z.any()).optional(),
  dateRange: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
  groupBy: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
});

// GET endpoint for predefined charts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chartType = searchParams.get('type');

    if (!chartType) {
      return NextResponse.json({
        success: false,
        error: 'Chart type parameter is required',
        availableTypes: [
          'youth-trends',
          'budget-breakdown',
          'facility-comparison',
          'indigenous-representation',
          'court-statistics',
          'cost-efficiency'
        ],
      }, { status: 400 });
    }

    let result;

    switch (chartType) {
      case 'youth-trends': {
        const period = searchParams.get('period') as any || 'monthly';
        const months = parseInt(searchParams.get('months') || '12');
        
        result = await queryTracker.trackQuery(
          'youth_trends_chart',
          'youth_statistics',
          () => chartService.getYouthTrends(period, months)
        );
        break;
      }

      case 'budget-breakdown': {
        const fiscalYear = searchParams.get('fiscalYear') || undefined;
        
        result = await queryTracker.trackQuery(
          'budget_breakdown_chart',
          'budget_allocations',
          () => chartService.getBudgetBreakdown(fiscalYear)
        );
        break;
      }

      case 'facility-comparison':
        result = await queryTracker.trackQuery(
          'facility_comparison_chart',
          'youth_statistics',
          () => chartService.getFacilityComparison()
        );
        break;

      case 'indigenous-representation': {
        const months = parseInt(searchParams.get('months') || '24');
        
        result = await queryTracker.trackQuery(
          'indigenous_representation_chart',
          'youth_statistics',
          () => chartService.getIndigenousRepresentation(months)
        );
        break;
      }

      case 'court-statistics':
        result = await queryTracker.trackQuery(
          'court_statistics_chart',
          'court_statistics',
          () => chartService.getCourtStatistics()
        );
        break;

      case 'cost-efficiency':
        result = await queryTracker.trackQuery(
          'cost_efficiency_chart',
          'multiple',
          () => chartService.getCostEfficiencyScatter()
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported chart type: ${chartType}`,
          availableTypes: [
            'youth-trends',
            'budget-breakdown',
            'facility-comparison',
            'indigenous-representation',
            'court-statistics',
            'cost-efficiency'
          ],
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      chartType,
      data: result,
      performance: {
        queryTime: queryTracker.getStats(60000),
      },
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}

// POST endpoint for custom charts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRequest = chartRequestSchema.parse(body);

    // Generate custom chart
    const result = await queryTracker.trackQuery(
      'custom_chart',
      validatedRequest.table,
      () => chartService.generateChart(validatedRequest as ChartOptions)
    );

    return NextResponse.json({
      success: true,
      chartType: 'custom',
      data: result,
      performance: {
        queryTime: queryTracker.getStats(60000),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid chart request',
        details: error.errors,
      }, { status: 400 });
    }

    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}