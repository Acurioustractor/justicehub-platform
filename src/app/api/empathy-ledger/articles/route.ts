import { NextRequest, NextResponse } from 'next/server';
import { fetchContentHubArticles } from '@/lib/empathy-ledger-content-hub';

export const revalidate = 300;

/**
 * GET /api/empathy-ledger/articles
 * Returns published articles from Empathy Ledger content hub.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const articles = await fetchContentHubArticles({ limit });

    return NextResponse.json({ articles, count: articles.length });
  } catch (error) {
    console.error('EL articles route error:', error);
    return NextResponse.json({ articles: [], count: 0 });
  }
}
