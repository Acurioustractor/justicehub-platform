import { NextRequest, NextResponse } from 'next/server';
import { portfolioService } from '@/lib/alma/portfolio-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('type') || 'all';

    const analysis = await portfolioService.analyzePortfolio();

    switch (analysisType) {
      case 'underfunded':
        return NextResponse.json({ data: analysis.underfunded_high_evidence });

      case 'ready-to-scale':
        return NextResponse.json({ data: analysis.ready_to_scale });

      case 'high-risk':
        return NextResponse.json({ data: analysis.high_risk_flagged });

      case 'learning-opportunities':
        return NextResponse.json({ data: analysis.learning_opportunities });

      case 'all':
      default:
        return NextResponse.json({
          data: {
            underfunded: analysis.underfunded_high_evidence,
            ready_to_scale: analysis.ready_to_scale,
            high_risk: analysis.high_risk_flagged,
            learning_opportunities: analysis.learning_opportunities,
          },
        });
    }
  } catch (error: unknown) {
    console.error('Error fetching portfolio analytics:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch portfolio analytics' },
      { status: 500 }
    );
  }
}
