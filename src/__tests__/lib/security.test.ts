/**
 * Security Utilities Test Suite
 *
 * Tests for input sanitization, XSS prevention, and security helpers.
 */

import {
  escapeHtml,
  stripHtml,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  containsXssPatterns,
  sanitizeObject,
} from '@/lib/security';

describe('Security Utilities', () => {
  const jsProtocolSample = ['java', 'script:alert(1)'].join('');

  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    test('escapes ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('handles empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('handles non-string input', () => {
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
      expect(escapeHtml(123 as any)).toBe('');
    });
  });

  describe('stripHtml', () => {
    test('removes HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    test('removes script tags (content remains - use sanitizeInput for full protection)', () => {
      // stripHtml only removes tags, not content between them
      // For full XSS protection, use sanitizeInput which handles script content
      expect(stripHtml('Hello<script>evil()</script>World')).toBe('Helloevil()World');
    });

    test('handles malformed HTML', () => {
      expect(stripHtml('<div>Unclosed')).toBe('Unclosed');
    });

    test('removes HTML entities', () => {
      expect(stripHtml('Hello&nbsp;World')).toBe('HelloWorld');
    });
  });

  describe('sanitizeInput', () => {
    test('strips HTML tags', () => {
      expect(sanitizeInput('<b>Bold</b> text')).toBe('Bold text');
    });

    test('removes javascript: protocol', () => {
      expect(sanitizeInput('Click javascript:alert(1)')).toBe('Click alert(1)');
    });

    test('removes event handlers', () => {
      expect(sanitizeInput('Text onclick=evil()')).toBe('Text evil()');
    });

    test('respects maxLength option', () => {
      const longText = 'a'.repeat(100);
      expect(sanitizeInput(longText, { maxLength: 50 })).toHaveLength(50);
    });

    test('preserves newlines by default', () => {
      expect(sanitizeInput('Line1\nLine2')).toBe('Line1\nLine2');
    });

    test('removes newlines when disabled', () => {
      expect(sanitizeInput('Line1\nLine2', { allowNewlines: false })).toBe('Line1 Line2');
    });

    test('collapses multiple spaces', () => {
      expect(sanitizeInput('Too    many   spaces')).toBe('Too many spaces');
    });

    test('trims whitespace', () => {
      expect(sanitizeInput('  trimmed  ')).toBe('trimmed');
    });
  });

  describe('sanitizeEmail', () => {
    test('accepts valid email', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    });

    test('lowercases email', () => {
      expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
    });

    test('trims whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    test('rejects invalid email format', () => {
      expect(sanitizeEmail('not-an-email')).toBeNull();
      expect(sanitizeEmail('missing@tld')).toBeNull();
      expect(sanitizeEmail('@nodomain.com')).toBeNull();
    });

    test('rejects email with HTML', () => {
      expect(sanitizeEmail('<script>@evil.com')).toBeNull();
      expect(sanitizeEmail('user@evil.com<script>')).toBeNull();
    });

    test('handles non-string input', () => {
      expect(sanitizeEmail(null as any)).toBeNull();
      expect(sanitizeEmail(undefined as any)).toBeNull();
    });
  });

  describe('sanitizePhone', () => {
    test('accepts valid phone numbers', () => {
      expect(sanitizePhone('+61 400 123 456')).toBe('+61 400 123 456');
      expect(sanitizePhone('(02) 9876-5432')).toBe('(02) 9876-5432');
    });

    test('removes invalid characters', () => {
      expect(sanitizePhone('0400-123-456 ext.123')).toBe('0400-123-456 123');
    });

    test('rejects too short numbers', () => {
      expect(sanitizePhone('1234567')).toBeNull();
    });

    test('rejects too long numbers', () => {
      expect(sanitizePhone('123456789012345678901')).toBeNull();
    });

    test('handles non-string input', () => {
      expect(sanitizePhone(null as any)).toBeNull();
    });
  });

  describe('sanitizeUrl', () => {
    test('accepts valid HTTP URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
    });

    test('rejects javascript: URLs', () => {
      expect(sanitizeUrl(jsProtocolSample)).toBeNull();
    });

    test('rejects data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>evil()</script>')).toBeNull();
    });

    test('rejects invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
      expect(sanitizeUrl('ftp://example.com')).toBeNull();
    });

    test('handles non-string input', () => {
      expect(sanitizeUrl(null as any)).toBeNull();
    });
  });

  describe('containsXssPatterns', () => {
    test('detects script tags', () => {
      expect(containsXssPatterns('<script>evil()</script>')).toBe(true);
      expect(containsXssPatterns('<SCRIPT>evil()</SCRIPT>')).toBe(true);
    });

    test('detects javascript: protocol', () => {
      expect(containsXssPatterns(jsProtocolSample)).toBe(true);
    });

    test('detects event handlers', () => {
      expect(containsXssPatterns('onclick=evil()')).toBe(true);
      expect(containsXssPatterns('onmouseover = alert(1)')).toBe(true);
    });

    test('detects iframe/object/embed', () => {
      expect(containsXssPatterns('<iframe src="evil">')).toBe(true);
      expect(containsXssPatterns('<object data="evil">')).toBe(true);
      expect(containsXssPatterns('<embed src="evil">')).toBe(true);
    });

    test('returns false for safe text', () => {
      expect(containsXssPatterns('Hello, World!')).toBe(false);
      expect(containsXssPatterns('This is a normal message')).toBe(false);
    });

    test('handles non-string input', () => {
      expect(containsXssPatterns(null as any)).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    test('sanitizes all string fields', () => {
      const input = {
        name: '<b>John</b>',
        email: 'john@example.com',
        age: 30,
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(30);
    });

    test('sanitizes only specified fields', () => {
      const input = {
        name: '<b>John</b>',
        bio: '<script>evil()</script>',
      };
      const result = sanitizeObject(input, { fields: ['name'] });
      expect(result.name).toBe('John');
      expect(result.bio).toBe('<script>evil()</script>');
    });

    test('respects maxLength option', () => {
      const input = { text: 'a'.repeat(100) };
      const result = sanitizeObject(input, { maxLength: 50 });
      expect(result.text).toHaveLength(50);
    });
  });
});
