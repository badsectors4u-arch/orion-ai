import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { SeverityBadge } from '../components/Badges.jsx'
import { useScanDetails } from '../hooks/useScans.js'
import { countBySeverity, formatDateTime } from '../lib/format.js'

export default function Reports() {
  const { scans, loading, error } = useScanDetails()

  const reports = useMemo(
    () => scans
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)),
    [scans],
  )

  return (
    <div className="pb-8">
      <PageHeader title="Reports" subtitle="One report per completed scan" />

      <div className="px-8 pt-6">
        {error && (
          <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
            Couldn&apos;t load reports: {error.message}
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--color-dim)' }}>Loading…</p>
        ) : reports.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--color-dim)' }}>No completed scans yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((s) => {
              const counts = countBySeverity(s.vulnerabilities || [])
              return (
                <Link key={s.id} to={`/reports/${s.id}`} className="card rounded-2xl p-5 transition-colors hover:border-[color:var(--color-accent)]">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={16} style={{ color: 'var(--color-accent-bright)' }} />
                    <span className="truncate text-sm font-medium">{s.target_url}</span>
                  </div>
                  <p className="mb-4 text-xs" style={{ color: 'var(--color-dim)' }}>{formatDateTime(s.completed_at)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {counts.critical > 0 && <SeverityBadge level="critical" />}
                    {counts.high > 0 && <SeverityBadge level="high" />}
                    <span className="self-center text-xs" style={{ color: 'var(--color-muted)' }}>
                      {(s.vulnerabilities || []).length} total findings
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
