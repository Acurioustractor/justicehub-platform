import type { CSSProperties } from 'react';

/**
 * Cormorant Garamond display style, matching the canonical editorial surface
 * (src/app/pitch/minderoo/page.tsx). DESIGN.md reserves this for h1/h2 and
 * large pullquotes. `font-serif` in Tailwind resolves to a generic browser
 * serif here, so we apply the family inline like the rest of the system.
 */
export const serifDisplay: CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontWeight: 500,
};
