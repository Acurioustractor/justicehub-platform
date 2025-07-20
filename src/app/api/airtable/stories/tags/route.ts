import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth0';
import { getMCPClient } from '@/lib/mcp-client';
import { z } from 'zod';

const TagsSchema = z.object({
  tags: z.string().transform(val => val.split(',')),
  matchAll: z.string().transform(val => val === 'true').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    
    if (!searchParams.tags) {
      return NextResponse.json(
        { error: 'Tags parameter is required' },
        { status: 400 }
      );
    }

    const query = TagsSchema.parse(searchParams);

    // Get stories by tags from MCP server
    const mcpClient = getMCPClient();
    const result = await mcpClient.getStoriesByTag(
      query.tags,
      query.matchAll || false,
      query.limit
    );

    // Add cache headers
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Airtable tags API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch stories by tags' },
      { status: 500 }
    );
  }
}