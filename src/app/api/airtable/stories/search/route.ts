import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth0';
import { getMCPClient } from '@/lib/mcp-client';
import { z } from 'zod';

const SearchSchema = z.object({
  q: z.string().min(2),
  fields: z.string().transform(val => val.split(',')).optional(),
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
    const query = SearchSchema.parse(searchParams);

    // Search stories using MCP server
    const mcpClient = getMCPClient();
    const result = await mcpClient.searchStories(
      query.q,
      query.fields,
      query.limit
    );

    // Add cache headers (shorter for search results)
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('Airtable search API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search stories in Airtable' },
      { status: 500 }
    );
  }
}