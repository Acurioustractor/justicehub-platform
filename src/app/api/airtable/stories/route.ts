import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth0';
import { getMCPClient } from '@/lib/mcp-client';
import { z } from 'zod';

// Query parameters schema
const QuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  published: z.string().transform(val => val === 'true').optional(),
  storyType: z.string().optional(),
  tags: z.string().transform(val => val.split(',')).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  organizationId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = QuerySchema.parse(searchParams);

    // Build filters
    const filters: any = {};
    if (query.published !== undefined) filters.published = query.published;
    if (query.storyType) filters.storyType = query.storyType;
    if (query.tags) filters.tags = query.tags;
    if (query.startDate || query.endDate) {
      filters.dateRange = {
        start: query.startDate,
        end: query.endDate,
      };
    }

    // Get stories from MCP server
    const mcpClient = getMCPClient();
    const result = await mcpClient.getStories({
      organizationId: query.organizationId,
      limit: query.limit || 50,
      offset: query.offset || 0,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    // Add cache headers
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Airtable stories API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch stories from Airtable' },
      { status: 500 }
    );
  }
}