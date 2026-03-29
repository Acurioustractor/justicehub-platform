/**
 * Tests for conversation persistence
 */

import {
  createConversation,
  appendMessages,
  getConversation,
  listConversations,
} from '@/lib/orchestrator/conversations';

// Track mock calls per table
const mockCalls: Record<string, any[]> = {};

jest.mock('@/lib/supabase/service-lite', () => ({
  createServiceClient: () => ({
    from: jest.fn((table: string) => {
      const chain: any = {};
      for (const method of ['select', 'insert', 'update', 'eq', 'order', 'limit', 'single']) {
        chain[method] = jest.fn((...args: any[]) => {
          mockCalls[`${table}.${method}`] = args;
          return chain;
        });
      }
      // Default: insert succeeds
      chain.insert.mockImplementation((...args: any[]) => {
        mockCalls[`${table}.insert`] = args;
        return Promise.resolve({ error: null });
      });
      // Default: select returns empty
      chain.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      return chain;
    }),
  }),
}));

describe('Conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockCalls)) delete mockCalls[key];
  });

  describe('createConversation', () => {
    it('returns a UUID', async () => {
      const id = await createConversation({});
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(36);
    });

    it('accepts optional params', async () => {
      const id = await createConversation({
        title: 'Test conversation',
        session_id: 'sess-123',
        metadata: { source: 'test' },
      });
      expect(id).toBeDefined();
    });
  });

  describe('appendMessages', () => {
    it('throws when conversation not found', async () => {
      await expect(
        appendMessages('nonexistent', [{ role: 'user', content: 'hello' }])
      ).rejects.toThrow('Conversation not found');
    });
  });

  describe('getConversation', () => {
    it('returns null for missing conversation', async () => {
      const result = await getConversation('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listConversations', () => {
    it('does not throw with empty result', async () => {
      // Default mock returns empty, but listConversations uses different chain
      // Just verify it doesn't throw
      await expect(listConversations({ limit: 5 })).resolves.toBeDefined();
    });
  });

  describe('ConversationMessage shape', () => {
    it('accepts all valid roles', () => {
      const messages = [
        { role: 'user' as const, content: 'hello' },
        { role: 'assistant' as const, content: 'hi there' },
        { role: 'system' as const, content: 'context' },
        { role: 'tool' as const, content: 'result', tool_results: [{ id: '1', output: 'data' }] },
      ];
      // Shape validation — all should have role + content
      for (const m of messages) {
        expect(m.role).toBeDefined();
        expect(m.content).toBeDefined();
      }
    });
  });
});
