/**
 * Media Sentiment Analysis Engine
 *
 * Analyzes alma_media_articles for fear vs solutions framing.
 * Proves the media narrative is disconnected from evidence.
 *
 * Used by: /api/cron/alma/enrich?mode=sentiment
 */

import { parseJSON } from '@/lib/ai/parse-json';
import {
  SentimentAnalysisSchema,
  validateLLMOutput,
} from '@/lib/ai/llm-schemas';
import type { SentimentAnalysis } from '@/lib/ai/llm-schemas';
import type { LLMClient } from '@/lib/ai/model-router';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaArticle {
  id: string;
  headline: string | null;
  source: string | null;
  content: string | null;
  state: string | null;
  source_url: string | null;
}

interface SentimentStats {
  analyzed: number;
  skipped: number;
  errors: number;
  fear_narrative: number;
  solutions_focused: number;
  mixed: number;
  neutral: number;
  avg_score: number;
  state_breakdown: Record<string, number>;
}

// Max content length sent to LLM (chars). Articles longer than this get truncated.
const MAX_CONTENT_LENGTH = 4000;

// ---------------------------------------------------------------------------
// Prompt builder (exported for testing)
// ---------------------------------------------------------------------------

export function buildSentimentPrompt(article: {
  headline: string | null;
  source: string | null;
  content: string | null;
}): string {
  const content = article.content
    ? article.content.slice(0, MAX_CONTENT_LENGTH)
    : '(no article text available)';

  return `Analyze this Australian youth justice media article for narrative framing.

Headline: ${article.headline || '(no headline)'}
Source: ${article.source || '(unknown source)'}
Content: ${content}

Classify the sentiment:
- fear_narrative: focuses on crime stats, victim stories, calls for tougher penalties
- solutions_focused: highlights programs, community responses, evidence-based approaches
- neutral: balanced reporting
- mixed: contains both fear and solutions elements

Score from -1 (pure fear/punitive) to +1 (pure solutions/evidence).

Identify any organizations and programs mentioned by name.
Extract key claims made in the article.

Return ONLY a JSON object with this exact structure:
{
  "sentiment": "fear_narrative|solutions_focused|neutral|mixed",
  "sentiment_score": <number between -1 and 1>,
  "framing": {
    "punitive_language": <boolean>,
    "community_voice": <boolean>,
    "evidence_cited": <boolean>,
    "political_framing": <boolean>
  },
  "organizations_mentioned": ["org names"],
  "programs_mentioned": ["program names"],
  "key_claims": [
    {
      "claim": "the claim text",
      "type": "statistic|anecdote|expert_opinion|political_statement",
      "verifiable": <boolean>
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// Batch processor (exported for testing)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processSentimentBatch(
  supabase: any,
  llm: LLMClient,
  batchSize: number
): Promise<SentimentStats> {
  // Fetch unanalyzed articles
  const { data: articles, error: fetchError } = await supabase
    .from('alma_media_articles')
    .select('id, headline, source, content, state, source_url')
    .is('sentiment', null)
    .order('published_date', { ascending: false, nullsFirst: false })
    .limit(batchSize);

  if (fetchError) {
    console.error('[Sentiment] Fetch error:', fetchError);
    throw new Error(`Failed to fetch articles: ${fetchError.message}`);
  }

  if (!articles?.length) {
    return {
      analyzed: 0,
      skipped: 0,
      errors: 0,
      fear_narrative: 0,
      solutions_focused: 0,
      mixed: 0,
      neutral: 0,
      avg_score: 0,
      state_breakdown: {},
    };
  }

  const stats: SentimentStats = {
    analyzed: 0,
    skipped: 0,
    errors: 0,
    fear_narrative: 0,
    solutions_focused: 0,
    mixed: 0,
    neutral: 0,
    avg_score: 0,
    state_breakdown: {},
  };

  const scores: number[] = [];
  const stateScores: Record<string, number[]> = {};

  for (const article of articles as MediaArticle[]) {
    // Skip articles with no headline AND no content
    if (!article.headline && !article.content) {
      stats.skipped++;
      console.log(`[Sentiment] Skipping article ${article.id} — no headline or content`);
      continue;
    }

    try {
      const prompt = buildSentimentPrompt(article);
      const raw = await llm.call(prompt, {
        jsonMode: true,
        systemPrompt:
          'You are a media framing analyst specializing in Australian youth justice reporting. Return only valid JSON.',
      });

      const parsed = parseJSON<Record<string, unknown>>(raw);
      const validation = validateLLMOutput(parsed, SentimentAnalysisSchema);

      if (!validation.success) {
        console.warn(
          `[Sentiment] Validation failed for article ${article.id}:`,
          validation.errors.slice(0, 3)
        );
        stats.errors++;
        continue;
      }

      const result: SentimentAnalysis = validation.data;

      // Update the article in the database
      const { error: updateError } = await supabase
        .from('alma_media_articles')
        .update({
          sentiment: result.sentiment,
          sentiment_score: result.sentiment_score,
          organizations_mentioned: result.organizations_mentioned,
          programs_mentioned: result.programs_mentioned,
          key_claims: result.key_claims,
        })
        .eq('id', article.id);

      if (updateError) {
        console.error(`[Sentiment] Update failed for ${article.id}:`, updateError);
        stats.errors++;
        continue;
      }

      // Track stats
      stats.analyzed++;
      stats[result.sentiment]++;
      scores.push(result.sentiment_score);

      if (article.state) {
        if (!stateScores[article.state]) stateScores[article.state] = [];
        stateScores[article.state].push(result.sentiment_score);
      }

      // Try to link mentioned organizations (best-effort, don't fail on this)
      await tryLinkOrganizations(supabase, result.organizations_mentioned, article.id);
    } catch (err) {
      stats.errors++;
      console.error(
        `[Sentiment] Error processing article ${article.id}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Compute averages
  stats.avg_score =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : 0;

  for (const [state, stScores] of Object.entries(stateScores)) {
    stats.state_breakdown[state] =
      Math.round((stScores.reduce((a, b) => a + b, 0) / stScores.length) * 100) / 100;
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Organization linking (best-effort)
// ---------------------------------------------------------------------------

async function tryLinkOrganizations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgNames: string[],
  _articleId: string
): Promise<void> {
  for (const orgName of orgNames.slice(0, 5)) {
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', `%${orgName}%`)
        .limit(1)
        .single();

      if (org) {
        console.log(
          `[Sentiment] Matched org "${orgName}" -> ${org.name} (${org.id})`
        );
        // Future: store in media_article_organizations junction table
      }
    } catch {
      // Best-effort — don't fail the batch for org matching
    }
  }
}
