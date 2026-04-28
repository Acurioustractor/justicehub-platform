/**
 * Minimal markdown → HTML converter for Empathy Ledger article drafts.
 *
 * Handles: h1-h4 headings, **bold**, *italic*, > blockquote, --- hr, paragraphs.
 * Intentionally small. EL's TipTap editor renders the resulting HTML cleanly
 * and re-converts on edit, so we never need fenced code blocks or images here.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormat(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let buf: string[] = [];
  let inQuote = false;

  function flushParagraph() {
    if (!buf.length) return;
    const text = buf.join(' ').trim();
    if (text) {
      if (inQuote) {
        blocks.push(`<blockquote><p>${inlineFormat(text)}</p></blockquote>`);
      } else {
        blocks.push(`<p>${inlineFormat(text)}</p>`);
      }
    }
    buf = [];
    inQuote = false;
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      flushParagraph();
      blocks.push('<hr />');
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      if (!inQuote) flushParagraph();
      inQuote = true;
      buf.push(quote[1]);
      continue;
    }

    if (inQuote) {
      flushParagraph();
    }
    buf.push(line);
  }
  flushParagraph();

  return blocks.join('\n');
}
