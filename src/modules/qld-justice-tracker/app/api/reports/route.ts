import { NextRequest, NextResponse } from 'next/server';
import { reportGenerator, ReportConfig } from '@/lib/features/reports/reportGenerator';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Report configuration schema
const reportConfigSchema = z.object({
  type: z.enum(['monthly', 'quarterly', 'annual', 'custom']),
  format: z.enum(['pdf', 'html', 'json']),
  title: z.string().min(1).max(200),
  period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['statistics', 'analysis', 'chart', 'comparison', 'text']),
    enabled: z.boolean(),
    config: z.record(z.any()).optional(),
  })),
  recipients: z.array(z.string().email()).optional(),
});

// GET endpoint for report templates and history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        const templates = reportGenerator.getDefaultConfigs();
        return NextResponse.json({
          success: true,
          data: templates,
        });

      case 'history': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const history = await reportGenerator.getReportHistory(limit);
        return NextResponse.json({
          success: true,
          data: history,
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Action parameter is required',
          availableActions: ['templates', 'history'],
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

// POST endpoint for generating reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedConfig = reportConfigSchema.parse(body);

    // Generate report
    const report = await reportGenerator.generateReport(validatedConfig as ReportConfig);

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Report generated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid report configuration',
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