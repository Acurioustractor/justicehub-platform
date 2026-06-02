# Reflex Loop Primitive

The only working operational pattern in JusticeHub today is the **reflex loop**: a task gets created, events accrete against it, and eventually an outcome is recorded. The funding conversation flow (`src/app/funding/conversations/[taskId]` + `src/app/admin/funding/os/followups`) is the canonical example.

This module extracts that pattern into three small primitives so the new Practice surface, the Empathy Ledger accountability sink, and the evidence export bundle can all speak the same language.

## The three nouns

```ts
import {
  ReflexTask,    // someone owes a system something (owner + due date + status)
  ReflexEvent,   // something happened against the task (response, contact, note)
  ReflexOutcome, // the consequence (with optional pointer to evidence)
  ReflexLoop,    // { task, events, outcome }
} from '@/lib/reflex';
```

## State machine (pure functions)

```ts
import { createTask, appendEvent, recordOutcome } from '@/lib/reflex';

let loop = createTask({
  source: 'practice',
  title: 'Reply to family contact request',
  organizationId: 'walumarra',
  ownerId: 'sam@walumarra.org.au',
  priority: 'high',
  dueAt: '2026-05-27T17:00:00+10:00',
});

loop = appendEvent(loop, {
  type: 'contacted',
  actorId: 'sam@walumarra.org.au',
  note: 'Left voicemail',
  newStatus: 'awaiting_response',
});

loop = recordOutcome(loop, {
  kind: 'progressed',
  label: 'Family meeting booked for Thursday',
  evidenceRef: 'story_2026_walumarra_42',
});
```

All three functions are pure — no I/O, no Supabase, no fetch. They return a new `ReflexLoop`. Persistence is the caller's job; that lets each surface (funding, practice, accountability) batch DB writes however it wants.

## Funding adapter

`fundingConversationToReflexLoop(detail)` projects the existing funding conversation record into the generic shape. The funding flow itself was not refactored — that would be high risk during launch week. Instead, this adapter lets new readers (evidence bundle, practice surface, Empathy Ledger sink) consume funding data through the reflex shape:

```ts
import { fundingConversationToReflexLoop } from '@/lib/reflex';

const detail = await getFundingConversationRequestPublic(taskId);
const loop = fundingConversationToReflexLoop(detail);

// now loop.task / loop.events / loop.outcome have the canonical shape
```

## Relationship to `src/lib/org-hub/practice-reflex.ts`

Codex is building a higher-level, org-hub-scoped practice reflex system in `src/lib/org-hub/practice-reflex.ts` (with lane keys like `identity`, `programs`, `people`, `proof`, `funding`, etc.). That module composes the primitive in this file — `PracticeReflexAction` is one specialised flavour of `ReflexTask`. Do not duplicate.

If you are building the Practice surface, import from `@/lib/org-hub/practice-reflex`. If you are building cross-surface plumbing (evidence export, Empathy Ledger sink, sibling-product integrations), import from `@/lib/reflex`.

## Migration path for funding code

The funding flow keeps working unchanged today. When we have time post-launch:

1. Funding `getFundingConversationRequestPublic()` already returns a record with the same fields the adapter expects. Step 1 is to add a `toReflexLoop()` method on the funding-os module that wraps the adapter.
2. Funding follow-up writes (`submitFundingConversationRequestResponse`, etc.) should also write a generic `reflex_events` row so the Empathy Ledger accountability sink can pick them up.
3. Eventually `funding-operating-system.ts` becomes a thin orchestrator over the reflex primitive plus funding-specific business rules (matching, prioritisation, alert rules).

None of that is required for launch. The adapter is enough.

## Why this exists

We had four different "task" shapes drifting apart across funding, practice, compliance, and the conversation page. Each new surface was reinventing the same three nouns with slightly different field names. The reflex primitive freezes the language so the four surfaces can finally talk to each other without translation glue.
