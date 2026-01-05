/**
 * Jest Test Setup
 *
 * This file runs before each test suite.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// NOTE: We do NOT mock global.fetch here because Supabase client needs real fetch
// If you need to mock fetch for specific tests, do it in those test files

// Extend expect with custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid UUID`,
    };
  },
  toBeValidSlug(received: string) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const pass = slugRegex.test(received);
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid slug`,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidSlug(): R;
    }
  }
}

// Console suppression for cleaner test output (optional)
// Uncomment to suppress console output during tests
// beforeAll(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
//   jest.spyOn(console, 'error').mockImplementation(() => {});
// });

// Reset any mocks that were created in tests
afterEach(() => {
  jest.restoreAllMocks();
});
