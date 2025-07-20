import { NextRequest, NextResponse } from 'next/server';
import { searchService, searchParamsSchema } from '@/lib/features/search/searchService';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse search parameters
    const params = {
      query: searchParams.get('query') || undefined,
      tables: searchParams.get('tables')?.split(',').filter(Boolean),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      facility: searchParams.get('facility') || undefined,
      department: searchParams.get('department') || undefined,
      courtType: searchParams.get('courtType') || undefined,
      documentType: searchParams.get('documentType') || undefined,
      minAmount: searchParams.get('minAmount') ? Number(searchParams.get('minAmount')) : undefined,
      maxAmount: searchParams.get('maxAmount') ? Number(searchParams.get('maxAmount')) : undefined,
      minYouthCount: searchParams.get('minYouthCount') ? Number(searchParams.get('minYouthCount')) : undefined,
      maxYouthCount: searchParams.get('maxYouthCount') ? Number(searchParams.get('maxYouthCount')) : undefined,
      indigenousOnly: searchParams.get('indigenousOnly') === 'true',
      detentionOnly: searchParams.get('detentionOnly') === 'true',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
    };

    // Validate parameters
    const validatedParams = searchParamsSchema.parse(params);

    // Perform search
    const results = await searchService.search(validatedParams);

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query: validatedParams.query,
        filters: {
          dateRange: validatedParams.dateFrom || validatedParams.dateTo ? {
            from: validatedParams.dateFrom,
            to: validatedParams.dateTo,
          } : null,
          facility: validatedParams.facility,
          department: validatedParams.department,
          courtType: validatedParams.courtType,
          documentType: validatedParams.documentType,
          amountRange: validatedParams.minAmount || validatedParams.maxAmount ? {
            min: validatedParams.minAmount,
            max: validatedParams.maxAmount,
          } : null,
          youthCountRange: validatedParams.minYouthCount || validatedParams.maxYouthCount ? {
            min: validatedParams.minYouthCount,
            max: validatedParams.maxYouthCount,
          } : null,
          indigenousOnly: validatedParams.indigenousOnly,
          detentionOnly: validatedParams.detentionOnly,
        },
        pagination: {
          page: results.page,
          limit: validatedParams.limit,
          totalPages: results.totalPages,
          totalCount: results.totalCount,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
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

// Search suggestions endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prefix, table } = body;

    if (!prefix || typeof prefix !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Prefix is required',
      }, { status: 400 });
    }

    const suggestions = await searchService.getSearchSuggestions(prefix, table);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}