/**
 * Tests for the robust JSON parser
 *
 * The parser handles malformed LLM output with 7-stage fallback.
 * These tests ensure each stage works correctly.
 */

import { parseJSON } from '@/lib/ai/parse-json';

describe('parseJSON', () => {
  describe('Stage 1: think block stripping', () => {
    it('strips <think> blocks from reasoning models', () => {
      const input = `<think>Let me analyze this...</think>{"name": "test"}`;
      expect(parseJSON(input)).toEqual({ name: 'test' });
    });

    it('strips multi-line think blocks', () => {
      const input = `<think>
Step 1: Consider the input
Step 2: Form response
</think>
{"results": []}`;
      expect(parseJSON(input)).toEqual({ results: [] });
    });
  });

  describe('Stage 2: markdown fence stripping', () => {
    it('strips ```json fences', () => {
      const input = '```json\n{"key": "value"}\n```';
      expect(parseJSON(input)).toEqual({ key: 'value' });
    });

    it('strips plain ``` fences', () => {
      const input = '```\n[1, 2, 3]\n```';
      expect(parseJSON(input)).toEqual([1, 2, 3]);
    });
  });

  describe('Stage 3: direct parse', () => {
    it('parses clean JSON directly', () => {
      expect(parseJSON('{"a": 1}')).toEqual({ a: 1 });
    });

    it('parses arrays', () => {
      expect(parseJSON('[1, 2, 3]')).toEqual([1, 2, 3]);
    });
  });

  describe('Stage 4-5: extraction and cleanup', () => {
    it('extracts JSON from surrounding text', () => {
      const input = 'Here is the result:\n{"name": "test"}\nHope this helps!';
      expect(parseJSON(input)).toEqual({ name: 'test' });
    });

    it('handles trailing commas', () => {
      const input = '{"items": ["a", "b", "c",]}';
      expect(parseJSON(input)).toEqual({ items: ['a', 'b', 'c'] });
    });

    it('extracts array from mixed text', () => {
      const input = 'The results are: [{"id": 1}, {"id": 2}] as requested.';
      expect(parseJSON(input)).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('Stage 6: bracket-depth parser', () => {
    it('handles nested structures', () => {
      const input = '{"outer": {"inner": [1, 2, {"deep": true}]}}';
      expect(parseJSON(input)).toEqual({
        outer: { inner: [1, 2, { deep: true }] },
      });
    });
  });

  describe('Stage 7: failure', () => {
    it('throws on empty input', () => {
      expect(() => parseJSON('')).toThrow('empty input');
    });

    it('throws on completely invalid input', () => {
      expect(() => parseJSON('This is just plain text with no JSON at all')).toThrow(
        'failed to extract'
      );
    });
  });

  describe('real-world LLM outputs', () => {
    it('handles DeepSeek reasoning + JSON', () => {
      const input = `<think>
I need to extract outcomes from this intervention description.
The program focuses on youth mentoring and cultural connection.
</think>

\`\`\`json
{
  "results": [
    {
      "idx": 1,
      "outcomes": [
        {
          "name": "Improved cultural identity connection",
          "outcome_type": "Cultural connection",
          "measurement": "Pre/post surveys measuring cultural identity"
        }
      ]
    }
  ]
}
\`\`\``;
      const result = parseJSON<{ results: Array<{ idx: number; outcomes: unknown[] }> }>(input);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].outcomes).toHaveLength(1);
    });

    it('handles Groq response with trailing text', () => {
      const input = `{"results": [{"title": "Report on Youth Justice", "evidence_type": "Program evaluation", "url": "https://example.com", "findings": "Positive outcomes observed", "relevance_score": 0.8}]}

Note: I found one relevant result from the search.`;
      const result = parseJSON<{ results: unknown[] }>(input);
      expect(result.results).toHaveLength(1);
    });
  });
});
