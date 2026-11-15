import { SEVERITY_META } from '../lib/format.js'

export function SeverityBadge({ level }) {
  const meta = SEVERITY_META[level] || SEVERITY_META.info
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold font-mono uppercase tracking-wide"
      style={{ color: meta.color, background: meta.soft }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

const STATUS_META = {
  completed: { label: 'Completed', color: '#3ecf8e', soft: 'rgba(62,207,142,0.12)' },
  running: { label: 'Running', color: '#5fa8ff', soft: 'rgba(95,168,255,0.12)' },
  pending: { label: 'Pending', color: '#e8c547', soft: 'rgba(232,197,71,0.12)' },
  failed: { label: 'Failed', color: '#ef4857', soft: 'rgba(239,72,87,0.12)' },
}

export function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ color: meta.color, background: meta.soft }}>
      {status === 'running' && <span className="h-1.5 w-1.5 rounded-full bg-current pulse-ring" />}
      {meta.label}
    </span>
  )
}

export function PlanBadge({ plan }) {
  const map = {
    free: { label: 'Free', color: '#8993ad', soft: 'rgba(137,147,173,0.12)' },
    pro: { label: 'Pro', color: '#5fa8ff', soft: 'rgba(95,168,255,0.12)' },
    enterprise: { label: 'Enterprise', color: '#3ecf8e', soft: 'rgba(62,207,142,0.12)' },
    advanced: { label: 'Advanced', color: '#3ecf8e', soft: 'rgba(62,207,142,0.12)' },
  }
  const meta = map[(plan || '').toLowerCase()] || map.free
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold font-mono uppercase tracking-wide" style={{ color: meta.color, background: meta.soft }}>
      {meta.label}
    </span>
  )
}
