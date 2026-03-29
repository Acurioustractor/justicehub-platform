/**
 * Orchestration Tools for ALMA Chat
 *
 * These tools let the LLM enqueue background tasks, check status,
 * and get results — bridging chat with the task orchestrator.
 *
 * Added to almaTools so the streaming chat can use them.
 */

import { z } from 'zod/v3';
import {
  enqueueTask,
  enqueuePipeline,
  getTaskStatus,
  getConversationTasks,
  createResearchPipeline,
  createEnrichmentPipeline,
  createAnalysisPipeline,
} from '@/lib/orchestrator/task-orchestrator';

export const orchestrationTools = {
  start_research: {
    description:
      'Start a background research task that searches across ALL data sources (interventions, funding, evidence, media, cases, organizations) for a complex question. Use this when a question needs deep cross-referencing that would take too many tool calls in a single conversation turn. Returns a task ID to check status later.',
    inputSchema: z.object({
      query: z.string().describe('The research question to investigate (e.g. "What evidence exists for culturally-led diversion programs reducing recidivism in remote NT communities?")'),
      conversation_id: z.string().optional().describe('Conversation ID to link results back to'),
    }),
    execute: async ({ query, conversation_id }: { query: string; conversation_id?: string }) => {
      try {
        const pipeline = createResearchPipeline({
          query,
          conversation_id,
        });
        const { runId, taskIds } = await enqueuePipeline(pipeline);
        return {
          status: 'queued',
          run_id: runId,
          task_count: taskIds.length,
          message: `Research pipeline started with ${taskIds.length} steps. Use check_task_status with run_id "${runId}" to monitor progress.`,
          steps: ['Search across all data sources', 'Analyze and cross-reference findings', 'Generate summary with citations'],
        };
      } catch (err) {
        return { error: `Failed to start research: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },

  enrich_organization: {
    description:
      'Start a background task to deeply enrich an organization — pull ACNC/ORIC data, financials, board members, programs, and link funding records. Use when someone asks for comprehensive info about an org that isn\'t well-covered in the database.',
    inputSchema: z.object({
      org_name: z.string().describe('Organization name to enrich'),
      conversation_id: z.string().optional().describe('Conversation ID to link results back to'),
    }),
    execute: async ({ org_name, conversation_id }: { org_name: string; conversation_id?: string }) => {
      try {
        const pipeline = createEnrichmentPipeline({
          org_name,
          conversation_id,
        });
        const { runId, taskIds } = await enqueuePipeline(pipeline);
        return {
          status: 'queued',
          run_id: runId,
          task_count: taskIds.length,
          message: `Enrichment pipeline started for "${org_name}". Use check_task_status with run_id "${runId}" to monitor progress.`,
          steps: ['Find org across ACNC, ORIC, GrantScope', 'Pull financials, board, and programs', 'Link funding records and entity graph'],
        };
      } catch (err) {
        return { error: `Failed to start enrichment: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },

  run_analysis: {
    description:
      'Start a background analysis task that gathers data, runs computations, and produces a report. Use for complex analytical questions like "Compare community control spending across states" or "Which evidence level has the highest funding allocation?".',
    inputSchema: z.object({
      question: z.string().describe('The analytical question to answer'),
      scope: z.string().optional().describe('Scope constraint (e.g. "QLD only", "Indigenous orgs", "last 3 years")'),
      conversation_id: z.string().optional().describe('Conversation ID to link results back to'),
    }),
    execute: async ({ question, scope, conversation_id }: { question: string; scope?: string; conversation_id?: string }) => {
      try {
        const pipeline = createAnalysisPipeline({
          question,
          scope,
          conversation_id,
        });
        const { runId, taskIds } = await enqueuePipeline(pipeline);
        return {
          status: 'queued',
          run_id: runId,
          task_count: taskIds.length,
          message: `Analysis pipeline started. Use check_task_status with run_id "${runId}" to monitor progress.`,
          steps: ['Gather relevant data points', 'Run computations and comparisons', 'Generate analysis report'],
        };
      } catch (err) {
        return { error: `Failed to start analysis: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },

  create_task: {
    description:
      'Create a single background task for anything not covered by research/enrichment/analysis pipelines. Use for one-off operations like "flag these programs for review" or "generate a funding gap report for WA".',
    inputSchema: z.object({
      title: z.string().describe('Short task title'),
      description: z.string().describe('What the task should do'),
      domain: z.enum(['research', 'enrichment', 'analysis', 'reporting', 'funding', 'discovery']).describe('Task domain'),
      config: z.record(z.unknown()).optional().describe('Configuration data for the task executor'),
      conversation_id: z.string().optional().describe('Conversation ID to link results back to'),
    }),
    execute: async ({ title, description, domain, config, conversation_id }: {
      title: string;
      description: string;
      domain: 'research' | 'enrichment' | 'analysis' | 'reporting' | 'funding' | 'discovery';
      config?: Record<string, unknown>;
      conversation_id?: string;
    }) => {
      try {
        const { taskId } = await enqueueTask({
          title,
          description,
          task_type: `${domain}_custom`,
          domain,
          config,
          conversation_id,
        });
        return {
          status: 'queued',
          task_id: taskId,
          message: `Task "${title}" queued. Use check_task_status with task_id "${taskId}" to monitor progress.`,
        };
      } catch (err) {
        return { error: `Failed to create task: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },

  check_task_status: {
    description:
      'Check the status of a background task or pipeline. Use the task_id or run_id returned by start_research, enrich_organization, run_analysis, or create_task.',
    inputSchema: z.object({
      id: z.string().describe('Task ID or pipeline run ID to check'),
    }),
    execute: async ({ id }: { id: string }) => {
      try {
        const result = await getTaskStatus(id);
        return {
          type: result.type,
          status: result.status,
          summary: result.summary,
          tasks: result.tasks.map((t) => ({
            title: t.title,
            status: t.status,
            output: t.output,
            error: t.error,
          })),
        };
      } catch (err) {
        return { error: `Failed to check status: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },

  list_conversation_tasks: {
    description:
      'List all background tasks that were started in the current conversation. Shows status and results for each.',
    inputSchema: z.object({
      conversation_id: z.string().describe('Conversation ID to look up tasks for'),
    }),
    execute: async ({ conversation_id }: { conversation_id: string }) => {
      try {
        const tasks = await getConversationTasks(conversation_id);
        return {
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            type: t.task_type,
            output: t.output,
          })),
          count: tasks.length,
          summary: tasks.length === 0
            ? 'No background tasks in this conversation.'
            : `${tasks.filter((t) => t.status === 'completed').length}/${tasks.length} tasks completed.`,
        };
      } catch (err) {
        return { error: `Failed to list tasks: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },
};
