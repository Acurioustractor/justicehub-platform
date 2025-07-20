import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth0';
import { getMCPClient } from '@/lib/mcp-client';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = req.nextUrl.searchParams.get('organizationId') || undefined;

    // Get metadata from MCP server
    const mcpClient = getMCPClient();
    const metadata = await mcpClient.getStoryMetadata(organizationId);

    // Add cache headers
    const response = NextResponse.json(metadata);
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    
    return response;
  } catch (error) {
    console.error('Airtable metadata API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata from Airtable' },
      { status: 500 }
    );
  }
}