import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { tagRhetoric } from '@/lib/ai/rhetoric-tagger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient() as any;
  const stats = {
    processed: 0,
    errors: 0,
  };

  try {
    // 1. Fetch speeches that don't have a 'stance:' tag in their topics
    // We fetch a modest batch of 20 to avoid function timeouts.
    const { data: speeches, error } = await supabase
      .from('civic_hansard')
      .select('id, subject, body_text, topics')
      // Only get rows where topics is empty or doesn't have a stance
      // We can use postgrest filter if possible, but simplest is fetching a chunk and filtering in JS
      .order('sitting_date', { ascending: false })
      .limit(200);

    if (error) throw error;
    
    if (!speeches || speeches.length === 0) {
      return NextResponse.json({ success: true, message: 'No speeches found' });
    }

    // Filter in JS for speeches lacking a 'stance:' tag in their topics array
    const untagged = speeches.filter((s: any) => {
      const topics = s.topics || [];
      return !topics.some((t: string) => t.startsWith('stance:'));
    }).slice(0, 20); // only process 20 max per run

    for (const speech of untagged) {
      const snippet = (speech.body_text || '').slice(0, 3000); // limit context window
      const newTags = await tagRhetoric(speech.subject || '', snippet);
      
      if (newTags.length > 0) {
        // Merge with existing topics
        const existingTopics = Array.isArray(speech.topics) ? speech.topics : [];
        // deduplicate
        const mergedTopics = Array.from(new Set([...existingTopics, ...newTags]));
        
        const { error: updateError } = await supabase
          .from('civic_hansard')
          .update({ topics: mergedTopics, enriched_at: new Date().toISOString() })
          .eq('id', speech.id);
          
        if (updateError) {
          console.error(`[RhetoricTagger] Error updating ${speech.id}:`, updateError.message);
          stats.errors++;
        } else {
          stats.processed++;
        }
      } else {
        // If LLM fails or returns empty, we might want to flag it so we don't retry endlessly.
        // For now, we'll just skip and it will retry next run.
        console.warn(`[RhetoricTagger] No tags returned for ${speech.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[RhetoricTagger] Fatal error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        stats,
      },
      { status: 500 }
    );
  }
}
