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

export function normalizeTitle(title: string) {
  const trimmed = title.trim()
  return trimmed || 'Untitled Note'
}
