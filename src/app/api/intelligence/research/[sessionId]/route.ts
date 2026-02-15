import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * ALMA Research Session API
 *
 * GET /api/intelligence/research/[sessionId] - Get session status and results
 * POST /api/intelligence/research/[sessionId] - Provide feedback on research
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('alma_research_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Research session not found' },
        { status: 404 }
      );
    }

    // Get findings for this session
    const { data: findings } = await supabase
      .from('alma_research_findings')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Get tool execution logs
    const { data: toolLogs } = await supabase
      .from('alma_research_tool_logs')
      .select('tool_name, execution_time_ms, success, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      session: {
        id: session.id,
        query: session.query,
        status: session.status,
        depth: session.depth,
        maxConsentLevel: session.max_consent_level,
        plan: session.plan,
        results: session.results,
        createdAt: session.created_at,
        completedAt: session.completed_at,
        errorMessage: session.error_message,
      },
      findings: findings || [],
      toolLogs: toolLogs || [],
    });

  } catch (error) {
    console.error('Research session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { helpful, corrections, additionalQuestions } = body;

    // Update session scratchpad with feedback
    const { data: session, error: getError } = await supabase
      .from('alma_research_sessions')
      .select('scratchpad')
      .eq('id', sessionId)
      .single();

    if (getError || !session) {
      return NextResponse.json(
        { error: 'Research session not found' },
        { status: 404 }
      );
    }

    const updatedScratchpad = {
      ...session.scratchpad,
      feedback: {
        helpful,
        corrections,
        additionalQuestions,
        submittedAt: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase
      .from('alma_research_sessions')
      .update({ scratchpad: updatedScratchpad, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to record feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded. Thank you for improving ALMA research.',
    });

  } catch (error) {
    console.error('Research feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
