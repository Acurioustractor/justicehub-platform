/**
 * When the kiosk links to a page outside /kiosk/* (eg /sites/[slug],
 * /intelligence/civic/...), append ?from=kiosk so the destination can render
 * a "Return to kiosk" banner. Idempotent — won't double-append if the URL
 * already carries the param.
 */

export function withKioskRef(href: string): string {
  if (!href) return href;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  if (href.includes('from=kiosk')) return href;
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}from=kiosk`;
}
