import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/features/notifications/notificationService';
import { handleDatabaseError } from '@/lib/supabase/errors';

export const dynamic = 'force-dynamic';

// POST endpoint for marking notifications as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({
        success: false,
        error: 'Notification ID is required',
      }, { status: 400 });
    }

    await notificationService.markNotificationRead(notificationId);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}