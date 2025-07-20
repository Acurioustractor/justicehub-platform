
# JusticeHub Code Review

This review covers potential bugs, areas for refactoring and improvement, and inconsistent coding styles or conventions across the JusticeHub codebase.

## Executive Summary

The codebase is generally well-structured, utilizing Next.js for the frontend and a separate server for Airtable integration. However, there are several areas that could be improved for better maintainability, performance, and consistency. The most critical areas for improvement are:

1.  **Error Handling:** Many API routes and components lack robust error handling, which could lead to unexpected crashes or poor user experience.
2.  **Code Duplication:** There is significant code duplication, especially in API routes and data fetching logic.
3.  **Inconsistent Styling:** There are multiple instances of inconsistent styling and component usage, particularly in the dashboard pages.
4.  **Missing Features:** Several components and pages are placeholders with "coming soon" messages.

## Potential Bugs or Errors

### 1. Missing `await` in `airtable-mcp-server/src/resources/index.ts`

In `handleStoriesResource`, the call to `airtableService.getStoriesByTag` is not awaited, which will cause the function to return a promise instead of the expected story data.

```typescript
// airtable-mcp-server/src/resources/index.ts:95
stories = airtableService.getStoriesByTag(
  ['featured', 'spotlight'],
  false, // matchAll = false (match any)
  20
);
```

**Recommendation:** Add `await` to the call.

```typescript
stories = await airtableService.getStoriesByTag(
  ['featured', 'spotlight'],
  false, // matchAll = false (match any)
  20
);
```

### 2. Incorrect Offset Logic in `airtable-mcp-server/src/tools/getStories.ts`

The offset logic in `getStoriesHandler` is incorrect. It sets `airtableOffset` to `undefined` regardless of the value of `params.offset`.

```typescript
// airtable-mcp-server/src/tools/getStories.ts:28
const airtableOffset = params.offset > 0 ? undefined : undefined; // TODO: Implement offset conversion
```

**Recommendation:** Implement the correct offset logic.

### 3. Missing `key` Prop in `src/app/analytics/page.tsx`

In the `AnalyticsPage` component, the `map` function for rendering `MetricCard` components is missing a `key` prop. This can lead to performance issues and unexpected behavior in React.

**Recommendation:** Add a unique `key` prop to each `MetricCard`.

## Areas for Refactoring and Improvement

### 1. Code Duplication in API Routes

Many API routes in `src/app/api` share similar logic for session handling, user authentication, and error handling. This can be refactored into a higher-order function or middleware to reduce duplication.

**Example:** `src/app/api/stories/route.ts` and `src/app/api/mentors/route.ts` both have similar session and user checks.

**Recommendation:** Create a `withApiAuth` higher-order function that handles session and user validation and wraps the API route handlers.

### 2. Inconsistent Component Usage

The dashboard pages (`src/app/dashboard/*`) use a mix of custom components and UI library components, leading to an inconsistent look and feel. For example, some pages use custom card components while others use the `Card` component from the UI library.

**Recommendation:** Standardize on a single set of UI components and create a style guide to ensure consistency.

### 3. Hardcoded Values

There are several instances of hardcoded values that should be moved to constants or environment variables.

**Example:** In `src/app/api/airtable/direct-test/route.ts`, the Airtable API key and base ID are hardcoded.

```typescript
// src/app/api/airtable/direct-test/route.ts:5
const apiKey = 'patvXij3ajsKB9yQR.9c7597c2fedb2fb5a1631ecb109654ecd631a816165b38ad3452ead1bddb4dd7';
const baseId = 'app7G3Ae65pBblJke';
```

**Recommendation:** Move all hardcoded secrets and configuration values to environment variables.

## Inconsistent Coding Styles or Conventions

### 1. Mixed `async/await` and `.then()`

There is inconsistent use of `async/await` and `.then()` for handling promises.

**Example:** In `scripts/optimize-db.ts`, the `optimizeDatabase` function uses `async/await`, but the final call uses `.then()` and `.catch()`.

**Recommendation:** Standardize on using `async/await` with `try/catch` blocks for better readability and error handling.

### 2. Inconsistent Naming Conventions

There are inconsistencies in naming conventions for files and variables. For example, some files use kebab-case (`db-utils.ts`) while others use camelCase (`mockStories.ts`).

**Recommendation:** Establish and enforce a consistent naming convention for all files and variables.

### 3. Lack of Comments

Many complex functions and logic blocks lack comments, making it difficult to understand their purpose and functionality.

**Recommendation:** Add comments to explain complex logic, especially in the `airtable-mcp-server` and `services` directories.

## Conclusion

The JusticeHub codebase is a solid foundation, but it would benefit from a round of refactoring and cleanup to improve its long-term maintainability and scalability. The recommendations in this review should help address the most pressing issues and set the project up for future success.
