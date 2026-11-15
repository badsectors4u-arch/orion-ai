import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Crosshair, Plus, ShieldAlert } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { StatusPill } from '../components/Badges.jsx'
import { useScanDetails, flattenFindings } from '../hooks/useScans.js'
import { countBySeverity, formatDateTime } from '../lib/format.js'
import * as api from '../lib/api.js'

export default function Dashboard() {
  const { scans, loading, error } = useScanDetails({ pollMs: 15000 })
  const [quota, setQuota] = useState(null)

  useEffect(() => {
    api.getQuota().then(setQuota).catch(() => {})
  }, [])

  const findings = useMemo(() => flattenFindings(scans), [scans])
  const severityCounts = useMemo(() => countBySeverity(findings), [findings])
  const targets = useMemo(() => new Set(scans.map((s) => s.target_url)).size, [scans])
  const recentScans = useMemo(
    () => [...scans].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6),
    [scans],
  )

  return (
    <div className="pb-8">
      <PageHeader
        title="Dashboard"
        subtitle="Your security posture at a glance"
        action={
          <Link to="/scans/new" className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
            <Plus size={16} /> New scan
          </Link>
        }
      />

      <div className="px-8 pt-6">
      {error && (
        <p className="mb-6 rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
          Couldn&apos;t load your scans: {error.message}
        </p>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Crosshair} label="Targets scanned" value={targets} />
        <StatCard icon={Activity} label="Scans run" value={scans.length} />
        <StatCard icon={ShieldAlert} label="Open findings" value={findings.length} />
        <StatCard
          icon={AlertTriangle}
          label="Critical / High"
          value={severityCounts.critical + severityCounts.high}
          tone={severityCounts.critical + severityCounts.high > 0 ? 'crit' : 'ok'}
        />
      </div>

      {quota && (
        <div className="card mb-8 flex items-center justify-between rounded-2xl p-5">
          <div>
            <p className="text-sm font-medium">Plan: <span className="capitalize">{quota.plan}</span></p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
              {quota.daily_limit === -1
                ? `${quota.scans_today} scans today · unlimited plan`
                : `${quota.scans_today} / ${quota.daily_limit} scans used today`}
            </p>
          </div>
          {quota.daily_limit !== -1 && (
            <div className="h-2 w-40 overflow-hidden rounded-full" style={{ background: 'var(--color-panel-2)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (quota.scans_today / Math.max(1, quota.daily_limit)) * 100)}%`,
                  background: 'var(--color-accent-bright)',
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="card rounded-2xl p-5">
        <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>Recent scans</h2>
        {loading ? (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--color-dim)' }}>Loading…</p>
        ) : recentScans.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
            {recentScans.map((s) => (
              <Link
                key={s.id} to={`/scans/${s.id}`}
                className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.target_url}</p>
                  <p className="text-xs" style={{ color: 'var(--color-dim)' }}>{formatDateTime(s.created_at)} · {s.scan_type}</p>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{(s.vulnerabilities || []).length} findings</span>
                <StatusPill status={s.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  const color = tone === 'crit' ? 'var(--color-crit)' : tone === 'ok' ? 'var(--color-ok)' : 'var(--color-accent-bright)'
  return (
    <div className="card rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-dim)' }}>{label}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="font-display text-3xl font-semibold" style={{ color }}>{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No scans yet.</p>
      <Link to="/scans/new" className="mt-3 inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-accent-bright)' }}>
        <Plus size={14} /> Run your first scan
      </Link>
    </div>
  )
}
