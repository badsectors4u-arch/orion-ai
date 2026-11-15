import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { SeverityBadge } from '../components/Badges.jsx'
import { useScanDetails, flattenFindings } from '../hooks/useScans.js'
import { SEVERITY_ORDER, formatDateTime } from '../lib/format.js'

export default function Findings() {
  const { scans, loading, error } = useScanDetails({ pollMs: 15000 })
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('all')
  const [selected, setSelected] = useState(null)

  const findings = useMemo(() => flattenFindings(scans), [scans])

  const filtered = useMemo(() => {
    let list = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
    if (severity !== 'all') list = list.filter((f) => f.severity === severity)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((f) =>
        f.title.toLowerCase().includes(q) ||
        f.service?.toLowerCase().includes(q) ||
        f.targetUrl?.toLowerCase().includes(q) ||
        f.cve_id?.toLowerCase().includes(q),
      )
    }
    return list
  }, [findings, severity, query])

  return (
    <div className="pb-8">
      <PageHeader title="Findings" subtitle={`${findings.length} finding${findings.length === 1 ? '' : 's'} across all scans`} />

      <div className="px-8 pt-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-dim)' }} />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search findings…"
              className="input-field w-full rounded-lg py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', ...SEVERITY_ORDER].map((s) => (
              <button
                key={s} onClick={() => setSeverity(s)}
                className="rounded-full px-3 py-1.5 text-xs font-medium capitalize"
                style={{
                  border: `1px solid ${severity === s ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  background: severity === s ? 'var(--color-accent-soft)' : 'transparent',
                  color: severity === s ? 'var(--color-text)' : 'var(--color-muted)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
            Couldn&apos;t load findings: {error.message}
          </p>
        )}

        <div className="card rounded-2xl p-2">
          {loading ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--color-dim)' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--color-dim)' }}>No findings match.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {filtered.map((f) => (
                <div key={`${f.scanId}-${f.id}`}>
                  <button
                    onClick={() => setSelected(selected?.id === f.id ? null : f)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-dim)' }}>
                        <Link to={`/scans/${f.scanId}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{f.targetUrl}</Link>
                        {' · '}{f.service}{f.port ? `:${f.port}` : ''}{f.cve_id ? ` · ${f.cve_id}` : ''}
                        {' · '}{formatDateTime(f.discoveredAt)}
                      </p>
                    </div>
                    <SeverityBadge level={f.severity} />
                  </button>
                  {selected?.id === f.id && (
                    <div className="mx-3 mb-3 rounded-lg p-3 text-sm" style={{ background: 'var(--color-panel-2)' }}>
                      <p className="whitespace-pre-wrap" style={{ color: 'var(--color-muted)' }}>{f.description}</p>
                      {f.cvss_score != null && (
                        <p className="mt-2 text-xs" style={{ color: 'var(--color-dim)' }}>CVSS {f.cvss_score.toFixed(1)}</p>
                      )}
                      {f.remediation_steps?.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-dim)' }}>Remediation</p>
                          <ul className="mt-1.5 list-disc space-y-1 pl-4">
                            {f.remediation_steps.map((step, i) => <li key={i}>{step}</li>)}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
