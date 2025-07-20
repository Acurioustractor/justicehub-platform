import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { apprenticeships } from '@/server/db/schema/apprenticeships';
import { eq } from 'drizzle-orm';

interface StatusUpdateRequest {
  status: 'pending' | 'active' | 'completed' | 'terminated' | 'on_hold';
  reason?: string;
  notes?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only org admins and platform admins can update status
    if (!['org_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get apprenticeship
    const [apprenticeship] = await db
      .select()
      .from(apprenticeships)
      .where(eq(apprenticeships.id, params.id))
      .limit(1);

    if (!apprenticeship) {
      return NextResponse.json({ error: 'Apprenticeship not found' }, { status: 404 });
    }

    // Check org admin permissions
    if (user.role === 'org_admin' && user.organizationId !== apprenticeship.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: StatusUpdateRequest = await req.json();
    const { status, reason, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['active', 'terminated'],
      active: ['completed', 'terminated', 'on_hold'],
      on_hold: ['active', 'terminated'],
      completed: [], // Cannot change from completed
      terminated: [], // Cannot change from terminated
    };

    if (!validTransitions[apprenticeship.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${apprenticeship.status} to ${status}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (notes) {
      updateData.progressNotes = apprenticeship.progressNotes 
        ? `${apprenticeship.progressNotes}\n\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'terminated' && reason) {
      updateData.terminatedAt = new Date();
      updateData.terminationReason = reason;
    }

    // Update apprenticeship
    const [updated] = await db
      .update(apprenticeships)
      .set(updateData)
      .where(eq(apprenticeships.id, params.id))
      .returning();

    return NextResponse.json({
      success: true,
      apprenticeship: updated,
      message: `Apprenticeship status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating apprenticeship status:', error);
    return NextResponse.json(
      { error: 'Failed to update apprenticeship status' },
      { status: 500 }
    );
  }
}