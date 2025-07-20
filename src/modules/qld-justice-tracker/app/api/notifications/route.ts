import { NextRequest, NextResponse } from 'next/server';
import { notificationService, NotificationRule } from '@/lib/features/notifications/notificationService';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Notification rule schema
const notificationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.enum(['data_update', 'threshold_alert', 'trend_change', 'system_event']),
  enabled: z.boolean(),
  conditions: z.object({
    table: z.string().optional(),
    field: z.string().optional(),
    operator: z.enum(['gt', 'lt', 'eq', 'change_pct']),
    value: z.number(),
    timeframe: z.enum(['daily', 'weekly', 'monthly']).optional(),
  }),
  channels: z.array(z.enum(['email', 'webhook', 'dashboard', 'sms'])),
  recipients: z.array(z.string()),
  cooldownMinutes: z.number().min(1).max(10080), // Max 1 week
});

// GET endpoint for notification rules and history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'rules':
        const rules = await notificationService.getRules();
        return NextResponse.json({
          success: true,
          data: rules,
        });

      case 'history': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const history = await notificationService.getNotificationHistory(limit);
        return NextResponse.json({
          success: true,
          data: history,
        });
      }

      case 'unread':
        const unread = await notificationService.getUnreadNotifications();
        return NextResponse.json({
          success: true,
          data: unread,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Action parameter is required',
          availableActions: ['rules', 'history', 'unread'],
        }, { status: 400 });
    }
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}

// POST endpoint for creating notification rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRule = notificationRuleSchema.parse(body);

    // Create notification rule
    const rule = await notificationService.createRule(validatedRule);

    return NextResponse.json({
      success: true,
      data: rule,
      message: 'Notification rule created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid notification rule',
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

// PUT endpoint for updating notification rules
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Rule ID is required',
      }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate partial update
    const partialSchema = notificationRuleSchema.partial();
    const validatedUpdates = partialSchema.parse(body);

    // Update notification rule
    const rule = await notificationService.updateRule(id, validatedUpdates);

    return NextResponse.json({
      success: true,
      data: rule,
      message: 'Notification rule updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid notification rule updates',
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

// DELETE endpoint for removing notification rules
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Rule ID is required',
      }, { status: 400 });
    }

    await notificationService.deleteRule(id);

    return NextResponse.json({
      success: true,
      message: 'Notification rule deleted successfully',
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}