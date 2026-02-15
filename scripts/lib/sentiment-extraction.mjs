/**
 * ALMA Media Sentiment Extraction
 * Analyzes media articles for sentiment and correlates with government programs
 */

import { createClient } from '@supabase/supabase-js'

export async function extractMediaSentiment(markdown, source, jobId, env) {
  if (!markdown || markdown.length < 100) {
    console.log(`     ⏭️  Skipping sentiment (content too short)`)
    return { articles: [] }
  }

  console.log(`     💭 Extracting sentiment with Claude...`)

  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Analyze sentiment in these youth justice news articles from ${source.name}.

Extract sentiment for EACH article found in the content below.

For EACH article, provide:
1. headline (string)
2. url (string, if available)
3. published_date (ISO date string, if available)
4. sentiment (string: "positive", "negative", "neutral", or "mixed")
5. sentiment_score (number: -1.0 to +1.0, where -1.0 = very negative, 0.0 = neutral, +1.0 = very positive)
6. confidence (number: 0.0 to 1.0, how confident are you in this sentiment assessment?)
7. topics (array of strings, e.g. ["youth detention", "bail reform", "cultural programs"])
8. government_mentions (object with programs, ministers, departments arrays)
9. community_mentions (object with organizations, elders, advocates arrays)
10. summary (string, 1-2 sentences)
11. key_quotes (array of impactful quotes from the article)

IMPORTANT CONTEXT:
- "Community Controlled" or "Indigenous-led" programs = positive signal for Community Authority
- Cultural healing, Elders, yarning circles = positive cultural connection
- Detention centers, bail restrictions, "tough on crime" = often negative
- Diversion programs, family support, early intervention = usually positive

Be objective but recognize that Indigenous community-led approaches tend to have better outcomes.

Content to analyze:
${markdown.slice(0, 30000)}

Return ONLY valid JSON array of articles:
[
  {
    "headline": "...",
    "url": "...",
    "published_date": "2026-01-01T00:00:00Z",
    "sentiment": "positive",
    "sentiment_score": 0.6,
    "confidence": 0.85,
    "topics": ["cultural programs", "community-led"],
    "government_mentions": {
      "programs": ["QLD Youth Justice Reform"],
      "ministers": ["Minister Smith"],
      "departments": ["Dept of Youth Justice"]
    },
    "community_mentions": {
      "organizations": ["NATSILS"],
      "elders": [],
      "advocates": ["Jane Doe"]
    },
    "summary": "Queensland announces new cultural healing program...",
    "key_quotes": ["We need Indigenous-led solutions", "Community control works"]
  }
]`
      }]
    })
  })

  if (!claudeResponse.ok) {
    const errorBody = await claudeResponse.text()
    console.log(`     ⚠️  Claude sentiment error: ${errorBody.substring(0, 200)}`)
    return { articles: [] }
  }

  const claudeData = await claudeResponse.json()
  const responseText = claudeData.content[0].text

  // Parse JSON response
  let articles = []
  try {
    // Try to extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      articles = JSON.parse(jsonMatch[0])
    } else {
      // Try parsing the whole response
      articles = JSON.parse(responseText)
    }
  } catch (e) {
    console.log(`     ⚠️  Failed to parse sentiment JSON: ${e.message}`)
    console.log(`     Response: ${responseText.substring(0, 500)}`)
    return { articles: [] }
  }

  if (!Array.isArray(articles)) {
    articles = [articles]
  }

  console.log(`     ✅ Extracted sentiment from ${articles.length} articles`)

  return { articles }
}

export async function storeMediaSentiment(articles, jobId, sourceName, supabase) {
  if (!articles || articles.length === 0) {
    return { stored: 0 }
  }

  console.log(`     💾 Storing ${articles.length} media articles...`)

  const articlesData = articles.map(article => ({
    job_id: jobId,
    headline: article.headline || 'Untitled',
    url: article.url || null,
    published_date: article.published_date || new Date().toISOString(),
    source_name: sourceName,
    sentiment: article.sentiment || 'neutral',
    sentiment_score: article.sentiment_score || 0.0,
    confidence: article.confidence || 0.5,
    topics: article.topics || [],
    government_mentions: article.government_mentions || {},
    community_mentions: article.community_mentions || {},
    summary: article.summary || '',
    key_quotes: article.key_quotes || [],
    full_text: null, // Don't store full text to save space
  }))

  const { data, error } = await supabase
    .from('alma_media_articles')
    .insert(articlesData)
    .select()

  if (error) {
    console.log(`     ⚠️  Error storing articles: ${error.message}`)
    return { stored: 0, error }
  }

  console.log(`     ✅ Stored ${data.length} articles`)

  // Refresh sentiment analytics
  await refreshSentimentAnalytics(supabase)

  return { stored: data.length, articles: data }
}

async function refreshSentimentAnalytics(supabase) {
  try {
    // Call the refresh function
    const { error } = await supabase.rpc('refresh_sentiment_analytics')
    if (error) {
      console.log(`     ⚠️  Analytics refresh warning: ${error.message}`)
    } else {
      console.log(`     📊 Refreshed sentiment analytics`)
    }
  } catch (e) {
    // Non-critical error
    console.log(`     ⚠️  Analytics refresh skipped: ${e.message}`)
  }
}

/**
 * Calculate aggregate sentiment metrics for reporting
 */
export function calculateSentimentMetrics(articles) {
  if (!articles || articles.length === 0) {
    return {
      total: 0,
      avgSentiment: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      topTopics: [],
    }
  }

  const total = articles.length
  const avgSentiment = articles.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / total
  const positive = articles.filter(a => a.sentiment === 'positive').length
  const negative = articles.filter(a => a.sentiment === 'negative').length
  const neutral = articles.filter(a => a.sentiment === 'neutral' || a.sentiment === 'mixed').length

  // Count topics
  const topicCounts = {}
  articles.forEach(article => {
    (article.topics || []).forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1
    })
  })

  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic]) => topic)

  return {
    total,
    avgSentiment,
    positive,
    negative,
    neutral,
    topTopics,
  }
}
