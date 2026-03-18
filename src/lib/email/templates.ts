/**
 * Branded HTML email templates for JusticeHub / THE CONTAINED
 *
 * Uses brand colors:
 * - Primary Black: #0A0A0A
 * - Off-White: #F5F0E8
 * - Urgent Red: #DC2626
 * - Emerald: #059669
 */

const BRAND = {
  black: '#0A0A0A',
  offWhite: '#F5F0E8',
  red: '#DC2626',
  emerald: '#059669',
  site: 'https://justicehub.com.au',
};

/**
 * Wraps plain text email body in branded HTML with header and footer
 */
export function wrapInBrandedTemplate(body: string, preheader?: string): string {
  // Convert plain text to HTML paragraphs
  const htmlBody = body
    .split('\n\n')
    .map(paragraph => {
      // Check if it's a list-like line (starts with - or number.)
      const lines = paragraph.split('\n');
      const isList = lines.every(l => /^[\s]*[-•→\d]/.test(l) || l.trim() === '');

      if (isList) {
        const items = lines
          .filter(l => l.trim())
          .map(l => {
            const text = l.replace(/^[\s]*[-•→\d.]+\s*/, '');
            // Make links clickable
            const linked = text.replace(
              /(https?:\/\/[^\s]+)/g,
              '<a href="$1" style="color: ' + BRAND.red + '; text-decoration: underline;">$1</a>'
            );
            return `<li style="margin-bottom: 6px; color: ${BRAND.black};">${linked}</li>`;
          })
          .join('');
        return `<ul style="padding-left: 20px; margin: 16px 0;">${items}</ul>`;
      }

      // Check for stat-like lines (ALL CAPS headers)
      if (/^[A-Z\s$,.%—–]+$/.test(paragraph.trim()) && paragraph.trim().length < 80) {
        return `<h3 style="font-family: 'Space Grotesk', Arial, sans-serif; font-weight: 700; font-size: 18px; color: ${BRAND.black}; margin: 24px 0 8px; letter-spacing: -0.02em;">${paragraph.trim()}</h3>`;
      }

      // Regular paragraph — make links clickable
      const linked = paragraph.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" style="color: ' + BRAND.red + '; text-decoration: underline;">$1</a>'
      );

      return `<p style="margin: 0 0 16px; line-height: 1.6; color: ${BRAND.black};">${linked.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<meta name="description" content="${escapeHtml(preheader)}">` : ''}
  <title>JusticeHub</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.offWhite}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: ${BRAND.black};">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(preheader)}</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.offWhite};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px; border-bottom: 3px solid ${BRAND.red};">
              <a href="${BRAND.site}" style="text-decoration: none;">
                <span style="font-family: 'Space Grotesk', Arial, sans-serif; font-weight: 700; font-size: 24px; color: ${BRAND.black}; letter-spacing: -0.03em;">JUSTICEHUB</span>
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 0;">
              ${htmlBody}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0; border-top: 1px solid #d1d5db;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                <a href="${BRAND.site}" style="color: #6b7280; text-decoration: underline;">JusticeHub</a> · Evidence-driven justice reform
              </p>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                <a href="${BRAND.site}/api/ghl/newsletter?email={{email}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
