import { NextRequest, NextResponse } from 'next/server';
import { interventionService } from '@/lib/alma/intervention-service';
import { portfolioService } from '@/lib/alma/portfolio-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const state = searchParams.get('state');
    const type = searchParams.get('type');
    const consentLevel = searchParams.get('consent_level');
    const search = searchParams.get('search');
    const includeScores = searchParams.get('include_scores') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filters
    const filters: any = {};
    if (state) filters['metadata->state'] = state;
    if (type) filters.type = type;
    if (consentLevel) filters.consent_level = consentLevel;

    // Get interventions
    const { data: interventions, error } = await interventionService.list({
      filters,
      limit,
      offset,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by search if provided
    let results = interventions || [];
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (intervention) =>
          intervention.name.toLowerCase().includes(searchLower) ||
          intervention.description?.toLowerCase().includes(searchLower)
      );
    }

    // Add portfolio scores if requested
    if (includeScores) {
      const resultsWithScores = await Promise.all(
        results.map(async (intervention) => {
          const score = await portfolioService.calculatePortfolioScore(
            intervention.id
          );
          return {
            ...intervention,
            portfolio_score: score.data,
          };
        })
      );
      results = resultsWithScores;
    }

    return NextResponse.json({
      data: results,
      count: results.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interventions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create intervention using service layer
    const result = await interventionService.create(body);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating intervention:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create intervention' },
      { status: 500 }
    );
  }
}
