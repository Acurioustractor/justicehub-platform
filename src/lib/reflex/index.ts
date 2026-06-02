/**
 * Reflex Loop Primitive — public entry point.
 *
 * import { createTask, fundingConversationToReflexLoop } from '@/lib/reflex';
 */

export * from './types';
export * from './loop';
export { fundingConversationToReflexLoop } from './adapters/funding';
export type { FundingConversationRequestDetail } from './adapters/funding';
