import { NextRequest, NextResponse } from 'next/server';
import { comparativeAnalysisService } from '@/lib/features/analysis/comparativeAnalysis';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { queryTracker } from '@/lib/monitoring/performance';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Request schemas
const trendComparisonSchema = z.object({
  periods: z.array(z.object({
    label: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })),
  metrics: z.array(z.string()).optional(),
});

// GET endpoint for different analysis types
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('type');

    if (!analysisType) {
      return NextResponse.json({
        success: false,
        error: 'Analysis type parameter is required',
        availableTypes: ['budget-efficiency', 'cross-table', 'facilities', 'regional'],
      }, { status: 400 });
    }

    let result;

    switch (analysisType) {
      case 'budget-efficiency':
        result = await queryTracker.trackQuery(
          'budget_efficiency_analysis',
          'budget_allocations',
          () => comparativeAnalysisService.analyzeBudgetEfficiency()
        );
        break;

      case 'cross-table':
        result = await queryTracker.trackQuery(
          'cross_table_analysis',
          'multiple',
          () => comparativeAnalysisService.performCrossTableAnalysis()
        );
        break;

      case 'facilities':
        result = await queryTracker.trackQuery(
          'facility_comparison',
          'youth_statistics',
          () => comparativeAnalysisService.compareFacilities()
        );
        break;

      case 'regional':
        result = await queryTracker.trackQuery(
          'regional_analysis',
          'youth_statistics',
          () => comparativeAnalysisService.analyzeRegionalDifferences()
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported analysis type: ${analysisType}`,
          availableTypes: ['budget-efficiency', 'cross-table', 'facilities', 'regional'],
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      analysisType,
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

// POST endpoint for trend comparisons with custom periods
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRequest = trendComparisonSchema.parse(body);

    // Perform trend comparison analysis
    const result = await queryTracker.trackQuery(
      'trend_comparison',
      'youth_statistics',
      () => comparativeAnalysisService.compareDetentionTrends(
        validatedRequest.periods,
        validatedRequest.metrics
      )
    );

    return NextResponse.json({
      success: true,
      analysisType: 'trend-comparison',
      data: result,
      performance: {
        queryTime: queryTracker.getStats(60000),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid trend comparison request',
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