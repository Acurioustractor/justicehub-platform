import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://justicehub.com.au';

/**
 * GET /api/contained/social-snippets?id=<synced_story_id>
 *
 * Takes a synced story ID and generates ready-to-post social media snippets:
 * - Twitter/X (280 chars)
 * - LinkedIn (longer, professional)
 * - Instagram caption (with hashtags)
 * - Newsletter blurb (for email)
 *
 * Returns all four variants with the article link.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get('id');

  if (!storyId) {
    return NextResponse.json(
      { error: 'Missing ?id= parameter (synced_stories.id)' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: story, error } = await (supabase as any)
      .from('synced_stories')
      .select('id, title, summary, content, themes, story_category, is_featured')
      .eq('id', storyId)
      .single();

    if (error || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    const slug = slugify(story.title || '');
    const articleUrl = `${SITE_URL}/blog/${slug}`;
    const title = story.title || '';
    const summary = story.summary || firstSentences(story.content, 2);

    // Normalise themes
    const rawThemes = (story.themes as Array<string | { name?: string }>) || [];
    const themes = rawThemes
      .map(t => typeof t === 'string' ? t : (t?.name || ''))
      .filter(Boolean);

    const hashtags = themes
      .slice(0, 5)
      .map(t => '#' + t.replace(/[^a-zA-Z0-9]/g, ''))
      .join(' ');

    const containedHashtags = '#CONTAINED #YouthJustice #JusticeHub';

    // Generate snippets
    const snippets = {
      twitter: generateTwitter(title, summary, articleUrl, containedHashtags),
      linkedin: generateLinkedIn(title, summary, articleUrl, themes),
      instagram: generateInstagram(title, summary, hashtags, containedHashtags),
      newsletter: generateNewsletter(title, summary, articleUrl),
      articleUrl,
      shareCardUrl: `${SITE_URL}/api/contained/share-card?type=story&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(summary.slice(0, 120))}`,
    };

    return NextResponse.json(snippets, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('Social snippets error:', err);
    return NextResponse.json(
      { error: 'Failed to generate snippets' },
      { status: 500 }
    );
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function firstSentences(text: string | null, count: number): string {
  if (!text) return '';
  // Strip HTML tags
  const plain = text.replace(/<[^>]+>/g, '').trim();
  const sentences = plain.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return plain.slice(0, 200);
  return sentences.slice(0, count).join(' ').trim();
}

function truncate(text: string, max: number, suffix = '...'): string {
  if (text.length <= max) return text;
  return text.slice(0, max - suffix.length).trimEnd() + suffix;
}

function generateTwitter(
  title: string,
  summary: string,
  url: string,
  hashtags: string
): string {
  // Budget: 280 chars total, URL ~23 chars (t.co), hashtags, newlines
  const urlLen = 25; // t.co length + newlines
  const hashLen = hashtags.length + 2;
  const budget = 280 - urlLen - hashLen;

  const hook = truncate(title, Math.min(budget, 100));
  const remaining = budget - hook.length - 2;
  const body = remaining > 30 ? '\n' + truncate(summary, remaining) : '';

  return `${hook}${body}\n\n${url}\n\n${hashtags}`;
}

function generateLinkedIn(
  title: string,
  summary: string,
  url: string,
  themes: string[]
): string {
  const themeList = themes.slice(0, 3).join(', ');
  return [
    title,
    '',
    summary,
    '',
    themeList ? `Topics: ${themeList}` : '',
    '',
    `Read more: ${url}`,
    '',
    '#CONTAINED #YouthJustice #JusticeHub #JusticeReform',
  ].filter(line => line !== undefined).join('\n');
}

function generateInstagram(
  title: string,
  summary: string,
  hashtags: string,
  containedHashtags: string
): string {
  return [
    title,
    '',
    summary,
    '',
    '🔗 Link in bio',
    '',
    containedHashtags,
    hashtags,
  ].join('\n');
}

function generateNewsletter(
  title: string,
  summary: string,
  url: string
): string {
  return [
    `**${title}**`,
    '',
    summary,
    '',
    `[Read the full story →](${url})`,
  ].join('\n');
}
