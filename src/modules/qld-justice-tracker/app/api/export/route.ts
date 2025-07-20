import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/features/export/exportService';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Export request schema
const exportRequestSchema = z.object({
  format: z.enum(['csv', 'json', 'pdf']),
  table: z.enum(['youth_statistics', 'budget_allocations', 'court_statistics', 'parliamentary_documents']),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  filters: z.record(z.any()).optional(),
  includeMetadata: z.boolean().optional(),
});

// GET endpoint for export summary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({
        success: false,
        error: 'Table parameter is required',
      }, { status: 400 });
    }

    const filters = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    const summary = await exportService.getExportSummary(table as any, filters);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}

// POST endpoint for data export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRequest = exportRequestSchema.parse(body);

    // Perform export
    const result = await exportService.exportData(validatedRequest);

    // Return file response
    const headers = new Headers({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-cache',
    });

    return new NextResponse(result.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid export request',
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