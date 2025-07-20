import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/lib/features/dashboard/dashboardService';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { queryTracker } from '@/lib/monitoring/performance';

export const dynamic = 'force-dynamic';

// Cache dashboard data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedData: any = null;
let cacheTimestamp: number = 0;

export async function GET(request: NextRequest) {
  try {
    // Check if we have cached data
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000), // seconds
      });
    }

    // Track performance
    const metrics = await queryTracker.trackQuery(
      'dashboard_metrics',
      'multiple',
      async () => await dashboardService.getDashboardMetrics()
    );

    // Transform to expected frontend format for backward compatibility
    const frontendData = {
      timestamp: new Date().toISOString(),
      lastUpdated: {
        court: metrics.lastUpdated,
        detention: metrics.lastUpdated,
        budget: metrics.lastUpdated,
        police: metrics.lastUpdated,
        audit: metrics.lastUpdated
      },
      court: {
        totalDefendants: 8457,
        indigenousDefendants: 5235,
        indigenousPercentage: 61.9,
        bailRefusedCount: 892,
        bailRefusedPercentage: 10.6,
        remandedInCustody: 203,
        averageDaysToFinalization: 89,
        overrepresentationFactor: 24.8,
        source: {
          document: "Children's Court of Queensland Annual Report 2023-24",
          url: "https://www.courts.qld.gov.au/__data/assets/pdf_file/0024/783950/childrens-court-annual-report-2023-24.pdf",
          pageReferences: { "total_defendants": "Page 15", "indigenous_percentage": "Page 18" }
        }
      },
      detention: {
        totalYouth: metrics.current.totalYouth || 338,
        indigenousYouth: metrics.current.indigenousYouth || 248,
        indigenousPercentage: metrics.current.indigenousPercentage || 73.4,
        onRemand: 203,
        remandPercentage: 60.1,
        capacityPercentage: 98.2,
        overrepresentationFactor: 29.4,
        ageBreakdown: { '10-13': 23, '14-15': 89, '16-17': 226 },
        source: {
          document: "Youth Detention Population Census March 2024",
          url: "https://www.youthsjustice.qld.gov.au/about-us/reporting-and-research/youth-detention-population-census",
          date: "March 2024"
        }
      },
      budget: {
        totalYouthJustice: metrics.budget.totalAllocated || 489000000,
        detentionOperations: metrics.budget.detentionCost || 443000000,
        detentionPercentage: 90.6,
        communityPrograms: metrics.budget.communityCost || 46000000,
        communityPercentage: 9.4,
        administration: 12000000,
        dailyDetentionCost: 857,
        dailyCommunityProgramCost: 41,
        costRatio: 20.9,
        claimedDetentionCostPerDay: 857,
        trueCostPerDay: 1570,
        source: {
          document: "Queensland State Budget 2024-25",
          url: "https://budget.qld.gov.au/budget-papers/",
          fiscalYear: "2024-25"
        }
      },
      police: {
        youthOffenders: 15420,
        repeatOffenders: 8934,
        repeatOffenderPercentage: 58.0,
        seriousRepeatOffenders: 2847,
        clearanceRate: 67.8,
        source: {
          document: "Queensland Police Statistical Review 2023-24",
          url: "https://www.police.qld.gov.au/about-us/statistics-and-research",
          period: "2023-24"
        }
      },
      audit: {
        totalSpending2018to2023: 2400000000,
        trueCostPerDay: 1570,
        claimedCost: 857,
        hiddenCostPercentage: 83.2,
        accountabilityFinding: "No clear link between spending and outcomes",
        source: {
          document: "Queensland Audit Office Report 7: 2024-25",
          url: "https://www.qao.qld.gov.au/reports-resources/reports-parliament",
          date: "June 2024"
        }
      },
      insights: {
        moneyWastedToday: metrics.budget.costPerYouthPerDay * metrics.current.totalYouth,
        kidsWhoCouldBeHelpedInstead: Math.floor((metrics.budget.costPerYouthPerDay * metrics.current.totalYouth) / 41),
        indigenousOverrepresentation: {
          detention: metrics.current.indigenousPercentage || 73.4,
          court: 61.9,
          populationPercentage: 2.5
        },
        systemFailures: {
          overcrowding: true,
          majorityOnRemand: true,
          highRepeatOffending: true,
          budgetMisallocation: true
        }
      }
    };

    // Update cache
    cachedData = frontendData;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      data: frontendData,
      cached: false,
      performance: {
        queryTime: queryTracker.getStats(60000), // Last minute stats
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

// Webhook endpoint for real-time updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook secret (if configured)
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Invalid webhook secret',
      }, { status: 401 });
    }

    // Invalidate cache on data update
    cachedData = null;
    cacheTimestamp = 0;

    // You could also trigger notifications here
    console.log('Dashboard data updated:', body);

    return NextResponse.json({
      success: true,
      message: 'Cache invalidated',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request',
    }, { status: 400 });
  }
}