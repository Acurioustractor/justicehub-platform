/**
 * Tests for the Justice Matrix post-hoc faithfulness pass.
 *
 * Scope: the PURE, zero-IO half — the mechanical citation-grounding guard plus
 * the NLI output parser and cache key. The network half (checkFaithfulness) is
 * not exercised here; it depends on a live background provider and is verified
 * separately. The contract these tests lock:
 *   - an invented [C#] (not in the retrieved set) never survives into prose,
 *     whatHeld, or keyRecords,
 *   - a whatHeld entry with no valid citation is dropped,
 *   - directAnswerHadCitation is the exact signal the route clamps 'thin' on,
 *   - the NLI parser fails CLOSED to null (so the route skips the down-rank,
 *     never inflating confidence) on anything malformed,
 *   - the cache key is deterministic + order-stable on citation ids, and keyed
 *     on the answer (a different answer is a different check).
 */

import {
  stripInvalidCitations,
  mechanicalFaithfulness,
  parseFaithfulness,
  faithCacheKey,
  faithfulnessPrompt,
  type ParsedAnswer,
} from '@/lib/justice-matrix/faithfulness';

const valid = (...labels: string[]) => new Set(labels);

describe('stripInvalidCitations', () => {
  it('keeps valid labels and reports hadValid', () => {
    const r = stripInvalidCitations('The court held X [C1] and Y [C2].', valid('C1', 'C2'));
    expect(r.text).toBe('The court held X [C1] and Y [C2].');
    expect(r.hadValid).toBe(true);
    expect(r.dropped).toEqual([]);
  });

  it('drops invalid labels and tidies the space before punctuation', () => {
    const r = stripInvalidCitations('It was decided [C9].', valid('C1'));
    expect(r.text).toBe('It was decided.');
    expect(r.hadValid).toBe(false);
    expect(r.dropped).toEqual(['C9']);
  });

  it('removes the empty parens a dropped "(see [C9])" leaves behind', () => {
    const r = stripInvalidCitations('The ruling stood (see [C9]) for years.', valid('C1'));
    expect(r.text).toBe('The ruling stood for years.');
    expect(r.dropped).toEqual(['C9']);
  });

  it('keeps the valid label in a mixed entry and drops only the invalid one', () => {
    const r = stripInvalidCitations('Held X [C2], see also [C9].', valid('C2'));
    expect(r.text).toBe('Held X [C2], see also.');
    expect(r.hadValid).toBe(true);
    expect(r.dropped).toEqual(['C9']);
  });

  it('reports no valid citation when the prose carries none at all', () => {
    const r = stripInvalidCitations('A plain claim with no citation.', valid('C1'));
    expect(r.hadValid).toBe(false);
    expect(r.dropped).toEqual([]);
  });
});

describe('mechanicalFaithfulness', () => {
  const base: ParsedAnswer = {
    directAnswer: '',
    keyRecords: [],
    whatHeld: [],
    limits: 'some limits',
  };

  it('strips an invented citation from the prose and flags it grounded by a real one', () => {
    const out = mechanicalFaithfulness(
      { ...base, directAnswer: 'Al-Kateb [C1] turned on indefinite detention, unlike [C9].' },
      valid('C1', 'C2'),
    );
    expect(out.directAnswer).toBe('Al-Kateb [C1] turned on indefinite detention, unlike.');
    expect(out.directAnswerHadCitation).toBe(true);
    expect(out.droppedCitations).toEqual(['C9']);
  });

  it('marks prose ungrounded when its only citation was invalid', () => {
    const out = mechanicalFaithfulness(
      { ...base, directAnswer: 'The corpus shows a clear trend [C7].' },
      valid('C1'),
    );
    expect(out.directAnswerHadCitation).toBe(false);
    expect(out.directAnswer).toBe('The corpus shows a clear trend.');
  });

  it('drops whatHeld entries that carry no valid citation, keeps + cleans the rest', () => {
    const out = mechanicalFaithfulness(
      {
        ...base,
        directAnswer: 'Answer [C1].',
        whatHeld: [
          '[C1] indefinite detention can be lawful',
          '[C9] a holding from a record that was never retrieved',
          'a bare assertion with no label at all',
          '[C2] established non-refoulement, see also [C9]',
        ],
      },
      valid('C1', 'C2'),
    );
    expect(out.whatHeld).toEqual([
      '[C1] indefinite detention can be lawful',
      '[C2] established non-refoulement, see also',
    ]);
    expect(out.droppedWhatHeld).toBe(2);
  });

  it('filters keyRecords down to retrieved labels', () => {
    const out = mechanicalFaithfulness(
      {
        ...base,
        directAnswer: 'Answer [C1].',
        keyRecords: [
          { label: 'C1', point: 'real' },
          { label: 'C9', point: 'fabricated' },
        ],
      },
      valid('C1', 'C2'),
    );
    expect(out.keyRecords).toEqual([{ label: 'C1', point: 'real' }]);
    expect(out.droppedKeyRecords).toBe(1);
  });
});

describe('parseFaithfulness', () => {
  it('parses a clean verdict', () => {
    const v = parseFaithfulness('{"verdict":"entailed","unsupportedClaims":[]}');
    expect(v).toEqual({ verdict: 'entailed', unsupportedClaims: [] });
  });

  it('rescues JSON wrapped in prose / fences', () => {
    const v = parseFaithfulness('```json\n{"verdict":"partial","unsupportedClaims":["x"]}\n```');
    expect(v?.verdict).toBe('partial');
    expect(v?.unsupportedClaims).toEqual(['x']);
  });

  it('returns null on a missing/invalid verdict (fails closed -> route skips the clamp)', () => {
    expect(parseFaithfulness('{"unsupportedClaims":[]}')).toBeNull();
    expect(parseFaithfulness('{"verdict":"maybe"}')).toBeNull();
  });

  it('returns null on non-JSON garbage', () => {
    expect(parseFaithfulness('the model refused to answer')).toBeNull();
  });

  it('degrades a malformed unsupportedClaims to [] without sinking the verdict', () => {
    const v = parseFaithfulness('{"verdict":"contradicted","unsupportedClaims":"not-an-array"}');
    expect(v).toEqual({ verdict: 'contradicted', unsupportedClaims: [] });
  });
});

describe('faithCacheKey', () => {
  it('is stable regardless of citation id order', () => {
    const a = faithCacheKey('q', ['case:1', 'campaign:2'], 'answer');
    const b = faithCacheKey('q', ['campaign:2', 'case:1'], 'answer');
    expect(a).toBe(b);
  });

  it('changes when the answer text changes (a verdict only describes its answer)', () => {
    const a = faithCacheKey('q', ['case:1'], 'answer one');
    const b = faithCacheKey('q', ['case:1'], 'answer two');
    expect(a).not.toBe(b);
  });

  it('changes when the citation set changes', () => {
    const a = faithCacheKey('q', ['case:1'], 'answer');
    const b = faithCacheKey('q', ['case:1', 'case:2'], 'answer');
    expect(a).not.toBe(b);
  });
});

describe('faithfulnessPrompt', () => {
  it('labels each source and includes the draft answer', () => {
    const p = faithfulnessPrompt('Is indefinite detention lawful?', 'Yes in some cases [C1].', [
      { label: 'C1', title: 'Al-Kateb v Godwin', excerpt: 'The High Court held detention could be indefinite.' },
    ]);
    expect(p).toContain('[C1] Al-Kateb v Godwin');
    expect(p).toContain('The High Court held detention could be indefinite.');
    expect(p).toContain('DRAFT ANSWER:');
    expect(p).toContain('Yes in some cases [C1].');
  });
});
