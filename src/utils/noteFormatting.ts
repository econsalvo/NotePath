const LEGACY_PLACEHOLDER_PATTERN = /^<p>\s*Start writing\.\.\.\s*<\/p>$/i
const NON_TEXT_CONTENT_PATTERN =
  /<(img|video|audio|iframe|table|ul|ol|li|blockquote|pre|code|hr)\b/i

export function toPlainText(html: string) {
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const node = document.createElement('div')
  node.innerHTML = html
  return node.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

export function formatRelativeTime(timestamp: number) {
  const now = Date.now()
  const diffSeconds = Math.max(1, Math.floor((now - timestamp) / 1000))

  if (diffSeconds < 60) return 'just now'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return dateFormatter.format(timestamp)
}

export function formatCreatedDate(timestamp: number) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return formatter.format(timestamp)
}

function isLegacyPlaceholderContent(content: string) {
  return LEGACY_PLACEHOLDER_PATTERN.test(content.trim())
}

export function hasMeaningfulContent(content: string) {
  const trimmed = content.trim()
  if (!trimmed || isLegacyPlaceholderContent(trimmed)) return false

  const text = toPlainText(trimmed).replace(/\u00a0/g, ' ').trim()
  if (text.length > 0) return true

  return NON_TEXT_CONTENT_PATTERN.test(trimmed)
}

export function getEditorContent(content: string) {
  if (isLegacyPlaceholderContent(content)) return ''
  return hasMeaningfulContent(content) ? content : ''
}

export function normalizeTitle(title: string) {
  const trimmed = title.trim()
  return trimmed || 'Untitled Note'
}

export function normalizeContentForSave(content: string) {
  const normalizedContent = getEditorContent(content)
  return hasMeaningfulContent(normalizedContent) ? normalizedContent : '<p></p>'
}
