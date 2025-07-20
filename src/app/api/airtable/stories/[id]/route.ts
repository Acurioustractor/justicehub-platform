import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth0';
import { getMCPClient } from '@/lib/mcp-client';

interface RouteParams {
  params: {
    id: string;
  };
}

export const GET = async (
  req: NextRequest,
  { params }: RouteParams
) => {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const includeMedia = req.nextUrl.searchParams.get('includeMedia') !== 'false';

    // Get story from MCP server
    const mcpClient = getMCPClient();
    const story = await mcpClient.getStoryById(id, includeMedia);

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Add cache headers
    const response = NextResponse.json(story);
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    
    return response;
  } catch (error) {
    console.error('Airtable story API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story from Airtable' },
      { status: 500 }
    );
  }
};