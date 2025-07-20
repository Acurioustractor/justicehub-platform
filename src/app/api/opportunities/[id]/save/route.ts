import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { savedOpportunities } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const opportunityId = params.id;
    const { notes } = await request.json();

    // Check if already saved
    const existing = await db
      .select()
      .from(savedOpportunities)
      .where(and(
        eq(savedOpportunities.opportunityId, opportunityId),
        eq(savedOpportunities.userId, session.user.id)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update notes if provided
      if (notes !== undefined) {
        await db
          .update(savedOpportunities)
          .set({ notes })
          .where(and(
            eq(savedOpportunities.opportunityId, opportunityId),
            eq(savedOpportunities.userId, session.user.id)
          ));
      }
      
      return NextResponse.json({
        message: 'Opportunity already saved',
        saved: true,
      });
    }

    // Save opportunity
    await db
      .insert(savedOpportunities)
      .values({
        opportunityId,
        userId: session.user.id,
        notes,
      });

    return NextResponse.json({
      message: 'Opportunity saved successfully',
      saved: true,
    });
  } catch (error) {
    console.error('Error saving opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to save opportunity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const opportunityId = params.id;

    // Remove saved opportunity
    await db
      .delete(savedOpportunities)
      .where(and(
        eq(savedOpportunities.opportunityId, opportunityId),
        eq(savedOpportunities.userId, session.user.id)
      ));

    return NextResponse.json({
      message: 'Opportunity unsaved successfully',
      saved: false,
    });
  } catch (error) {
    console.error('Error unsaving opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to unsave opportunity' },
      { status: 500 }
    );
  }
}