/**
 * Justice Matrix — post-hoc faithfulness pass for Ask the Matrix.
 *
 * Two layers, both run AFTER the grounded answer is parsed. They move the system
 * from told-not-to-hallucinate to checked-it-did-not.
 *
 *   1. mechanicalFaithfulness (pure, zero IO): the citation-grounding guard.
 *      - strips any [C#] in the prose that is NOT a retrieved record label,
 *      - drops whatHeld entries that carry no valid citation label,
 *      - filters keyRecords to real labels,
 *      - reports whether directAnswer kept >=1 valid citation. The caller clamps
 *        confidence to 'thin' when it did not: ungrounded prose is not a strong
 *        answer, whatever the model wrote.
 *
 *   2. checkFaithfulness (one background LLM call): an NLI entailment judge.
 *      - the caller gates it to answers with >=3 citations and grounded prose,
 *      - it asks whether the draft answer's claims are supported by the cited
 *        record excerpts,
 *      - it returns a verdict the caller uses ONLY to down-rank confidence and
 *        add a limits note. It never rewrites the answer and never raises
 *        confidence, so failing open (null) is safe.
 *
 * Modelled on query-understanding.ts: callBackgroundLLM -> JSON.parse (with a
 * regex rescue) -> Zod validate -> null on any failure.
 *
 * Copy rules: no em-dash, no AI-vocab.
 */

import { callBackgroundLLM } from '@/lib/ai/model-router';
import {
  MatrixFaithfulnessSchema,
  validateLLMOutput,
  type MatrixFaithfulness,
} from '@/lib/ai/llm-schemas';

const CITATION_TOKEN = /\[C(\d+)\]/g;

export interface ParsedAnswer {
  directAnswer: string;
  keyRecords: { label: string; point: string }[];
  whatHeld: string[];
  limits: string;
}

export interface MechanicalResult {
  directAnswer: string;
  keyRecords: { label: string; point: string }[];
  whatHeld: string[];
  /** True when directAnswer retained at least one VALID [C#] after cleaning. */
  directAnswerHadCitation: boolean;
  /** Invalid labels removed from prose + whatHeld (telemetry only). */
  droppedCitations: string[];
  /** whatHeld entries dropped for carrying no valid citation. */
  droppedWhatHeld: number;
  /** keyRecords dropped for referencing a non-retrieved label. */
  droppedKeyRecords: number;
}

// Strip [C#] tokens that are not in `valid`. Returns cleaned prose, whether any
// valid token survived, and which labels were dropped. Tidies the whitespace and
// empty punctuation a removed token leaves behind, never the surrounding words.
export function stripInvalidCitations(
  prose: string,
  valid: Set<string>,
): { text: string; hadValid: boolean; dropped: string[] } {
  const dropped: string[] = [];
  let hadValid = false;
  const replaced = prose.replace(CITATION_TOKEN, (full, num) => {
    if (valid.has(`C${num}`)) {
      hadValid = true;
      return full;
    }
    dropped.push(`C${num}`);
    return '';
  });
  const text = replaced
    // Citation-aside parens left empty by a removed token: "([C9])" -> "()",
    // "(see [C9])" -> "(see )", "([C9]; [C10])" -> "(; )". Drop the husk, never
    // a paren that still holds real words like "(see Table 2)".
    .replace(/\(\s*(?:see\s+also|see|cf\.?|e\.?g\.?)?[\s;,]*\)/gi, '')
    .replace(/\s+([.,;:)])/g, '$1') // space before punctuation
    .replace(/\(\s+/g, '(') // space after an open paren
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { text, hadValid, dropped };
}

// The mechanical citation-grounding pass. Pure, deterministic, no model call.
export function mechanicalFaithfulness(
  parsed: ParsedAnswer,
  validLabels: Set<string>,
): MechanicalResult {
  const dropped: string[] = [];

  // 1. directAnswer prose: strip invalid labels, learn if any valid one stayed.
  const da = stripInvalidCitations(parsed.directAnswer, validLabels);
  dropped.push(...da.dropped);

  // 2. whatHeld: each entry MUST carry a valid citation; strip invalid labels
  //    inside the entries we keep, drop the entries that carry none.
  let droppedWhatHeld = 0;
  const whatHeld: string[] = [];
  for (const entry of parsed.whatHeld) {
    const cleaned = stripInvalidCitations(entry, validLabels);
    dropped.push(...cleaned.dropped);
    if (cleaned.hadValid && cleaned.text) whatHeld.push(cleaned.text);
    else droppedWhatHeld += 1;
  }

  // 3. keyRecords: keep only labels that map to a retrieved record.
  const keyRecords = parsed.keyRecords.filter((r) => validLabels.has(r.label));
  const droppedKeyRecords = parsed.keyRecords.length - keyRecords.length;

  return {
    directAnswer: da.text,
    keyRecords,
    whatHeld,
    directAnswerHadCitation: da.hadValid,
    droppedCitations: dropped,
    droppedWhatHeld,
    droppedKeyRecords,
  };
}

// ---------------------------------------------------------------------------
// NLI entailment check (one background LLM call)
// ---------------------------------------------------------------------------

export interface FaithfulnessRecord {
  label: string;
  title: string;
  excerpt: string | null;
}

// Excerpts come from the DB and can be long; cap them so the gated call stays
// inside its ~400-token budget. Restricted-evidence excerpts are already
// redacted upstream in /search, so nothing private reaches the prompt here.
const EXCERPT_CAP = 320;

export function faithfulnessPrompt(
  question: string,
  directAnswer: string,
  records: FaithfulnessRecord[],
): string {
  const sources = records
    .map((r) => `[${r.label}] ${r.title}${r.excerpt ? `\n${r.excerpt.slice(0, EXCERPT_CAP)}` : ''}`)
    .join('\n\n');
  return [
    'You are a strict faithfulness checker for a legal research assistant.',
    'You are given SOURCE RECORDS and a DRAFT ANSWER that cites them with [C#] labels.',
    'Decide whether every factual claim in the draft answer is supported by the source records.',
    'Judge ONLY against the records shown. Do not use outside knowledge. If a claim',
    'has no support in the records, it is unsupported, even when it sounds true.',
    '',
    'Return ONLY JSON: {"verdict","unsupportedClaims"}',
    '- verdict: "entailed" when every claim is supported by the records; "partial"',
    '  when some claims are supported and some are not; "contradicted" when a claim',
    '  conflicts with a record.',
    '- unsupportedClaims: short quotes of any claims not supported by the records (max 6, [] when none).',
    '',
    `QUESTION: ${question}`,
    '',
    'SOURCE RECORDS:',
    sources,
    '',
    'DRAFT ANSWER:',
    directAnswer,
  ].join('\n');
}

// Parse the NLI output. Returns null on any failure so the caller skips the
// clamp (the check only ever down-ranks, so failing open never inflates trust).
export function parseFaithfulness(raw: string): MatrixFaithfulness | null {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return null;
      parsed = JSON.parse(m[0]);
    }
    const validated = validateLLMOutput(parsed, MatrixFaithfulnessSchema);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

// djb2 over (question + sorted citation ids + the exact answer being checked).
// Keyed on the answer, not just the question: the same question yields a
// different answer run to run, and a verdict only describes the answer it judged.
// Deterministic, no Date/random (both throw in this runtime anyway).
export function faithCacheKey(
  question: string,
  citationIds: string[],
  directAnswer: string,
): string {
  const basis = `${question}||${[...citationIds].sort().join(',')}||${directAnswer}`;
  let h = 5381;
  for (let i = 0; i < basis.length; i += 1) h = ((h << 5) + h + basis.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// One background LLM call, validated. null on any failure (caller skips the
// clamp on null). Routed through the background chain, off the user-facing
// provider, like planQuery and theme-mapper.
export async function checkFaithfulness(
  question: string,
  directAnswer: string,
  records: FaithfulnessRecord[],
): Promise<MatrixFaithfulness | null> {
  try {
    const prompt = faithfulnessPrompt(question, directAnswer, records);
    const raw = await callBackgroundLLM(prompt, { jsonMode: true, maxTokens: 400 });
    return parseFaithfulness(raw);
  } catch (error) {
    console.warn(
      '[faithfulness] check failed, skipping clamp:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
