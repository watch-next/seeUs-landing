// Tiny HTML-escaper for rendering comment content with v-html. The mentions
// metadata is used to highlight @names; we keep this simple — regex over the
// escaped string — rather than slicing offsets that break on surrogate pairs.

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;')
}

const MENTION_RE = /@([\w][\w .-]*[\w.])/g

/**
 * Render comment content for display with v-html. HTML is escaped first,
 * newlines become <br>, and @mentions are wrapped in a span.mention.
 *
 * Mentions metadata (when provided) is used to resolve the visible display
 * name but offset slicing is intentionally avoided — surrogate-pair offsets
 * would misalign. Regex matching on the escaped content is robust enough
 * for v1.
 */
export function renderCommentContent(content: string): string {
  if (!content) return ''
  const escaped = escapeHtml(content)
  return escaped
    .replace(/\n/g, '<br>')
    .replace(MENTION_RE, '<span class="mention">@$1</span>')
}
