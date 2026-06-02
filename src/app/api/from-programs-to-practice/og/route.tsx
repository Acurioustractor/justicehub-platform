/**
 * Open Graph image for /from-programs-to-practice.
 *
 * Rendered with @vercel/og via the Edge runtime so social-share previews on
 * Reintegration conference week look like a JusticeHub brief, not a fallback.
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default function FromProgramsToPracticeOg() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#121212',
          border: '24px solid #121212',
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#d02020',
            fontWeight: 900,
          }}
        >
          JusticeHub Field Briefing · Reintegration 2026
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 96,
            lineHeight: 1.0,
            textTransform: 'uppercase',
            letterSpacing: -2,
            fontWeight: 900,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>From Programs</span>
          <span style={{ color: '#1040c0' }}>to Practice.</span>
        </div>
        <div
          style={{
            marginTop: 'auto',
            fontSize: 30,
            lineHeight: 1.3,
            maxWidth: 980,
            fontWeight: 600,
          }}
        >
          Programs do not save kids. Practice does. Read the field briefing and meet the
          practitioners holding the line.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 18,
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontWeight: 900,
            color: '#444',
          }}
        >
          justicehub.org.au/from-programs-to-practice
        </div>
      </div>
    ),
    { ...size }
  );
}
