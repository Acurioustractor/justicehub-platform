export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ArticleRow = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featured_image_url: string | null
  published_at: string | null
  updated_at: string | null
  category: string | null
}

type BlogRow = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featured_image_url: string | null
  published_at: string | null
  updated_at: string | null
  tags: string[] | null
  categories: string[] | null
}

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const truncate = (value: string | null, max = 260) => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3).trimEnd()}...`
}

const resolveBaseUrl = (request: Request) => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

const resolveTags = (value: Array<string | null> | null | undefined) => {
  if (!value) return undefined
  const tags = value.filter((item): item is string => Boolean(item && item.trim()))
  const unique = Array.from(new Set(tags))
  return unique.length > 0 ? unique : undefined
}

const requireRegistryToken = (request: Request) => {
  const expected = process.env.REGISTRY_FEED_TOKEN
  if (!expected) return null

  const authHeader = request.headers.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : ''
  const headerToken = request.headers.get('x-registry-token') || ''
  const providedToken = bearerToken || headerToken

  if (!providedToken || providedToken !== expected) {
    return 'Invalid registry token.'
  }

  return null
}

export async function GET(request: Request) {
  const authError = requireRegistryToken(request)
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const limit = clamp(parseNumber(url.searchParams.get('limit'), 40), 1, 100)
    const offset = Math.max(parseNumber(url.searchParams.get('offset'), 0), 0)

    const supabase = await createClient()
    const baseUrl = resolveBaseUrl(request)

    const [articlesResult, blogsResult] = await Promise.all([
      supabase
        .from('articles')
        .select(
          'id, slug, title, excerpt, featured_image_url, published_at, updated_at, category'
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('blog_posts')
        .select(
          'id, slug, title, excerpt, featured_image_url, published_at, updated_at, tags, categories'
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ])

    if (articlesResult.error) {
      console.error('Registry articles query failed:', articlesResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch articles.' },
        { status: 500 }
      )
    }

    if (blogsResult.error) {
      console.error('Registry blog query failed:', blogsResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch blog posts.' },
        { status: 500 }
      )
    }

    const articles = (articlesResult.data || []) as ArticleRow[]
    const blogs = (blogsResult.data || []) as BlogRow[]

    const items = [
      ...articles.map((article) => ({
        id: `article-${article.id}`,
        type: 'article',
        slug: article.slug,
        title: article.title,
        summary: truncate(article.excerpt),
        image_url: article.featured_image_url ?? undefined,
        canonical_url: `${baseUrl}/stories/${article.slug}`,
        tags: resolveTags(article.category ? [article.category] : []),
        status: 'published',
        published_at: article.published_at,
        updated_at: article.updated_at,
      })),
      ...blogs.map((blog) => ({
        id: `blog-${blog.id}`,
        type: 'blog',
        slug: blog.slug,
        title: blog.title,
        summary: truncate(blog.excerpt),
        image_url: blog.featured_image_url ?? undefined,
        canonical_url: `${baseUrl}/blog/${blog.slug}`,
        tags: resolveTags([...(blog.tags ?? []), ...(blog.categories ?? [])]),
        status: 'published',
        published_at: blog.published_at,
        updated_at: blog.updated_at,
      })),
    ]
      .sort((a, b) => {
        const aDate = a.published_at ? new Date(a.published_at).getTime() : 0
        const bDate = b.published_at ? new Date(b.published_at).getTime() : 0
        return bDate - aDate
      })
      .slice(0, limit)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Registry API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
