export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

export function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return '—'
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return min > 0 ? `${min}m ${sec.toString().padStart(2, '0')}s` : `${sec}s`
}

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info']

export const SEVERITY_META = {
  critical: { label: 'Critical', color: 'var(--color-crit)', soft: 'var(--color-crit-soft)' },
  high: { label: 'High', color: 'var(--color-high)', soft: 'var(--color-high-soft)' },
  medium: { label: 'Medium', color: 'var(--color-med)', soft: 'var(--color-med-soft)' },
  low: { label: 'Low', color: 'var(--color-low)', soft: 'var(--color-low-soft)' },
  info: { label: 'Info', color: 'var(--color-info)', soft: 'var(--color-info-soft)' },
}

export function countBySeverity(items) {
  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]))
  for (const item of items) {
    if (counts[item.severity] !== undefined) counts[item.severity] += 1
  }
  return counts
}
