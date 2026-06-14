/**
 * Tests for the Justice Matrix corpus-gap helpers (Phase 3 acquisition sensor).
 *
 * Scope: the PURE, zero-IO half — the gap trigger predicate + the dedup
 * normaliser. The write (recordGap) is defensive and IO-bound; it is verified
 * separately. The contract these tests lock:
 *   - a thin (or 0-citation) answer IS a gap; a partial/strong answer is NOT,
 *   - the normalizer collapses punctuation/case so recurrence counts honestly.
 */

import { shouldRecordGap, normalizeGapQuestion } from '@/lib/justice-matrix/gaps';

describe('shouldRecordGap', () => {
  it('is true for a thin answer (the gap signal)', () => {
    expect(shouldRecordGap('thin', 5)).toBe(true);
  });

  it('is true for a 0-citation answer regardless of confidence label', () => {
    expect(shouldRecordGap('partial', 0)).toBe(true);
    expect(shouldRecordGap('strong', 0)).toBe(true);
  });

  it('is false for a confident answer with citations', () => {
    expect(shouldRecordGap('partial', 4)).toBe(false);
    expect(shouldRecordGap('strong', 6)).toBe(false);
  });
});

describe('normalizeGapQuestion', () => {
  it('collapses case + punctuation so phrasings dedup to one gap', () => {
    expect(normalizeGapQuestion('Raise the age?')).toBe('raise the age');
    expect(normalizeGapQuestion('  raise   the AGE  ')).toBe('raise the age');
    expect(normalizeGapQuestion('"Raise the age!"')).toBe('raise the age');
  });

  it('two punctuation/case variants of the same question normalize equal', () => {
    expect(normalizeGapQuestion('Is indefinite detention lawful?')).toBe(
      normalizeGapQuestion('is indefinite detention lawful'),
    );
  });

  it('keeps unicode letters/numbers (no over-stripping)', () => {
    expect(normalizeGapQuestion('Article 3 ECHR')).toBe('article 3 echr');
  });

  it('returns empty for punctuation-only input (caller skips the write)', () => {
    expect(normalizeGapQuestion('???')).toBe('');
    expect(normalizeGapQuestion('   ')).toBe('');
  });

  it('caps very long questions at 300 chars', () => {
    const long = 'detention '.repeat(60); // 600 chars
    expect(normalizeGapQuestion(long).length).toBeLessThanOrEqual(300);
  });
});
