import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { StatusPill } from '../components/Badges.jsx'
import { useScanDetails } from '../hooks/useScans.js'
import { formatDateTime, formatDuration } from '../lib/format.js'

export default function Scans() {
  const { scans, loading, error, refresh } = useScanDetails({ pollMs: 10000 })
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const sorted = [...scans].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (!query.trim()) return sorted
    const q = query.toLowerCase()
    return sorted.filter((s) => s.target_url.toLowerCase().includes(q) || s.scan_type.toLowerCase().includes(q))
  }, [scans, query])

  return (
    <div className="pb-8">
      <PageHeader
        title="Scans"
        subtitle={`${scans.length} scan${scans.length === 1 ? '' : 's'} total`}
        action={
          <Link to="/scans/new" className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
            <Plus size={16} /> New scan
          </Link>
        }
      />

      <div className="px-8 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-dim)' }} />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by target or type…"
              className="input-field w-full rounded-lg py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <button onClick={refresh} className="btn-ghost rounded-lg px-3 py-2 text-sm">Refresh</button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
            Couldn&apos;t load scans: {error.message}
          </p>
        )}

        <div className="card overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: 'var(--color-line)', color: 'var(--color-dim)' }}>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Findings</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center" style={{ color: 'var(--color-dim)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center" style={{ color: 'var(--color-dim)' }}>No scans found.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-[color:var(--color-panel-2)]" style={{ borderColor: 'var(--color-line-soft)' }}>
                    <td className="px-5 py-3">
                      <Link to={`/scans/${s.id}`} className="font-medium hover:underline">{s.target_url}</Link>
                    </td>
                    <td className="px-5 py-3 capitalize" style={{ color: 'var(--color-muted)' }}>{s.scan_type}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-muted)' }}>{formatDateTime(s.created_at)}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-muted)' }}>{formatDuration(s.created_at, s.completed_at)}</td>
                    <td className="px-5 py-3">{(s.vulnerabilities || []).length}</td>
                    <td className="px-5 py-3"><StatusPill status={s.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
