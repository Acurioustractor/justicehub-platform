import { NextRequest, NextResponse } from 'next/server';
import { interventionService } from '@/lib/alma/intervention-service';
import { portfolioService } from '@/lib/alma/portfolio-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const includeScore = request.nextUrl.searchParams.get('include_score') === 'true';

    // Get intervention with relations
    const { data: intervention, error } =
      await interventionService.getInterventionWithRelations(params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!intervention) {
      return NextResponse.json(
        { error: 'Intervention not found' },
        { status: 404 }
      );
    }

    // Add portfolio score if requested
    if (includeScore) {
      const scoreResult = await portfolioService.calculatePortfolioScore(
        params.id
      );
      return NextResponse.json({
        data: {
          ...intervention,
          portfolio_score: scoreResult.data,
        },
      });
    }

    return NextResponse.json({ data: intervention });
  } catch (error: any) {
    console.error('Error fetching intervention:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch intervention' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Update intervention using service layer
    const result = await interventionService.update(params.id, body);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('Error updating intervention:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update intervention' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete intervention using service layer
    const result = await interventionService.delete(params.id);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting intervention:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete intervention' },
      { status: 500 }
    );
  }
}
