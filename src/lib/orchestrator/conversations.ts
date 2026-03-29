/**
 * Conversation Persistence for ALMA Chat
 *
 * Stores multi-turn conversations so users can resume context
 * and background tasks can report results back to the right thread.
 */

import { createServiceClient } from '@/lib/supabase/service-lite';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_results?: any[];
  timestamp?: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  messages: ConversationMessage[];
  metadata: Record<string, unknown>;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new conversation
 */
export async function createConversation(opts: {
  title?: string;
  session_id?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const supabase = createServiceClient();
  const id = crypto.randomUUID();

  const { error } = await supabase.from('alma_conversations').insert({
    id,
    title: opts.title || null,
    messages: [],
    metadata: opts.metadata || {},
    session_id: opts.session_id || null,
    user_id: opts.user_id || null,
  });

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return id;
}

/**
 * Append messages to a conversation
 */
export async function appendMessages(
  conversationId: string,
  newMessages: ConversationMessage[]
): Promise<void> {
  const supabase = createServiceClient();

  // Fetch current messages
  const { data, error: fetchError } = await supabase
    .from('alma_conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  if (fetchError) throw new Error(`Conversation not found: ${fetchError.message}`);

  const existing = Array.isArray(data.messages) ? data.messages : [];
  const stamped = newMessages.map((m) => ({
    ...m,
    timestamp: m.timestamp || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('alma_conversations')
    .update({
      messages: [...existing, ...stamped],
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) throw new Error(`Failed to append messages: ${error.message}`);
}

/**
 * Get a conversation with its messages
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('alma_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) return null;
  return data as Conversation;
}

/**
 * List recent conversations for a session or user
 */
export async function listConversations(opts: {
  session_id?: string;
  user_id?: string;
  limit?: number;
}): Promise<Array<{ id: string; title: string | null; updated_at: string; message_count: number }>> {
  const supabase = createServiceClient();
  let q = supabase
    .from('alma_conversations')
    .select('id, title, updated_at, messages')
    .order('updated_at', { ascending: false })
    .limit(opts.limit || 20);

  if (opts.session_id) q = q.eq('session_id', opts.session_id);
  if (opts.user_id) q = q.eq('user_id', opts.user_id);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    updated_at: c.updated_at,
    message_count: Array.isArray(c.messages) ? c.messages.length : 0,
  }));
}

/**
 * Auto-generate a title from the first user message
 */
export async function autoTitle(conversationId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('alma_conversations')
    .select('title, messages')
    .eq('id', conversationId)
    .single();

  if (!data || data.title) return; // Already has title

  const messages = Array.isArray(data.messages) ? data.messages : [];
  const firstUser = messages.find((m: any) => m.role === 'user');
  if (!firstUser) return;

  const content = typeof firstUser.content === 'string' ? firstUser.content : '';
  const title = content.slice(0, 100) + (content.length > 100 ? '...' : '');

  await supabase
    .from('alma_conversations')
    .update({ title })
    .eq('id', conversationId);
}
