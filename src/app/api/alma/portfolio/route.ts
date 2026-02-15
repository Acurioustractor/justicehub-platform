import { NextRequest, NextResponse } from 'next/server';
import { portfolioService } from '@/lib/alma/portfolio-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('type') || 'all';

    let result;

    switch (analysisType) {
      case 'underfunded':
        result = await portfolioService.identifyUnderfundedPrograms();
        break;

      case 'ready-to-scale':
        result = await portfolioService.identifyReadyToScale();
        break;

      case 'high-risk':
        result = await portfolioService.identifyHighRiskPrograms();
        break;

      case 'learning-opportunities':
        result = await portfolioService.identifyLearningOpportunities();
        break;

      case 'all':
      default:
        // Return all analytics
        const [underfunded, readyToScale, highRisk, learning] =
          await Promise.all([
            portfolioService.identifyUnderfundedPrograms(),
            portfolioService.identifyReadyToScale(),
            portfolioService.identifyHighRiskPrograms(),
            portfolioService.identifyLearningOpportunities(),
          ]);

        return NextResponse.json({
          data: {
            underfunded: underfunded.data,
            ready_to_scale: readyToScale.data,
            high_risk: highRisk.data,
            learning_opportunities: learning.data,
          },
        });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('Error fetching portfolio analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch portfolio analytics' },
      { status: 500 }
    );
  }
}
