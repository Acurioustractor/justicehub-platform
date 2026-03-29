/**
 * Tests for the generic task orchestrator
 */

import {
  enqueueTask,
  enqueuePipeline,
  getTaskStatus,
  createResearchPipeline,
  createEnrichmentPipeline,
  createAnalysisPipeline,
} from '@/lib/orchestrator/task-orchestrator';

// Mock Supabase
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockLike = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();

const chainable = () => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  like: mockLike,
  in: mockIn,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle,
});

jest.mock('@/lib/supabase/service-lite', () => ({
  createServiceClient: () => ({
    from: jest.fn(() => {
      const chain: any = {};
      for (const method of ['select', 'insert', 'update', 'eq', 'like', 'in', 'order', 'limit', 'single']) {
        chain[method] = jest.fn(() => chain);
      }
      chain.insert.mockResolvedValue({ error: null });
      chain.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      chain.like.mockReturnValue(chain);
      chain.in.mockReturnValue(chain);
      chain.order.mockReturnValue(chain);
      chain.limit.mockReturnValue(chain);
      return chain;
    }),
  }),
}));

describe('Task Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createResearchPipeline', () => {
    it('creates a 3-step pipeline', () => {
      const pipeline = createResearchPipeline({ query: 'recidivism in NT' });
      expect(pipeline.name).toContain('Research');
      expect(pipeline.domain).toBe('research');
      expect(pipeline.steps).toHaveLength(3);
      expect(pipeline.steps[0].task_type).toBe('research_search');
      expect(pipeline.steps[1].task_type).toBe('research_analyze');
      expect(pipeline.steps[2].task_type).toBe('research_summarize');
    });

    it('passes conversation_id through', () => {
      const pipeline = createResearchPipeline({
        query: 'test',
        conversation_id: 'conv-123',
      });
      expect(pipeline.conversation_id).toBe('conv-123');
    });

    it('truncates long queries in name', () => {
      const pipeline = createResearchPipeline({
        query: 'a'.repeat(100),
      });
      expect(pipeline.name.length).toBeLessThanOrEqual(70);
    });
  });

  describe('createEnrichmentPipeline', () => {
    it('creates a 3-step pipeline', () => {
      const pipeline = createEnrichmentPipeline({ org_name: 'Mission Australia' });
      expect(pipeline.name).toContain('Enrich');
      expect(pipeline.domain).toBe('enrichment');
      expect(pipeline.steps).toHaveLength(3);
      expect(pipeline.steps[0].task_type).toBe('enrichment_lookup');
      expect(pipeline.steps[1].task_type).toBe('enrichment_enrich');
      expect(pipeline.steps[2].task_type).toBe('enrichment_link');
    });
  });

  describe('createAnalysisPipeline', () => {
    it('creates a 3-step pipeline with scope', () => {
      const pipeline = createAnalysisPipeline({
        question: 'Compare state spending',
        scope: 'QLD only',
      });
      expect(pipeline.domain).toBe('analysis');
      expect(pipeline.steps).toHaveLength(3);
      expect(pipeline.steps[0].config?.scope).toBe('QLD only');
    });
  });

  describe('enqueueTask', () => {
    it('creates a single task with correct fields', async () => {
      const { taskId } = await enqueueTask({
        title: 'Test task',
        description: 'A test',
        task_type: 'research_custom',
        domain: 'research',
        priority: 3,
      });
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      expect(taskId.length).toBe(36); // UUID
    });
  });

  describe('enqueuePipeline', () => {
    it('creates tasks with dependency chain', async () => {
      const pipeline = createResearchPipeline({ query: 'test' });
      const { runId, taskIds } = await enqueuePipeline(pipeline);
      expect(runId).toBeDefined();
      expect(taskIds).toHaveLength(3);
      // All task IDs should be unique UUIDs
      const uniqueIds = new Set(taskIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('getTaskStatus', () => {
    it('returns not found for invalid ID', async () => {
      const result = await getTaskStatus('nonexistent-id');
      expect(result.tasks).toHaveLength(0);
      expect(result.summary).toContain('No task or pipeline found');
    });
  });

  describe('Pipeline templates', () => {
    it('all pipeline steps have task_type and title', () => {
      const pipelines = [
        createResearchPipeline({ query: 'test' }),
        createEnrichmentPipeline({ org_name: 'test' }),
        createAnalysisPipeline({ question: 'test' }),
      ];
      for (const p of pipelines) {
        for (const step of p.steps) {
          expect(step.task_type).toBeDefined();
          expect(step.title).toBeDefined();
          expect(step.task_type.length).toBeGreaterThan(0);
          expect(step.title.length).toBeGreaterThan(0);
        }
      }
    });

    it('pipeline domains match expected values', () => {
      expect(createResearchPipeline({ query: '' }).domain).toBe('research');
      expect(createEnrichmentPipeline({ org_name: '' }).domain).toBe('enrichment');
      expect(createAnalysisPipeline({ question: '' }).domain).toBe('analysis');
    });
  });
});
