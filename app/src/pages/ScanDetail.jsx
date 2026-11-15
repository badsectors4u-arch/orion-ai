import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Link2, ShieldAlert } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { SeverityBadge, StatusPill } from '../components/Badges.jsx'
import * as api from '../lib/api.js'
import { formatDateTime, formatDuration } from '../lib/format.js'

export default function ScanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timer
    async function load() {
      try {
        const data = await api.getScan(id)
        if (cancelled) return
        setScan(data)
        setError(null)
        if (data.status === 'pending' || data.status === 'running') {
          timer = setTimeout(load, 3000)
        }
      } catch (e) {
        if (!cancelled) setError(e)
      }
    }
    load()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [id])

  const vulns = useMemo(
    () => [...(scan?.vulnerabilities || [])].sort(
      (a, b) => severityRank(a.severity) - severityRank(b.severity),
    ),
    [scan],
  )

  async function handleDownload() {
    setDownloading(true)
    try {
      const { blob, filename } = await api.getScanPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e)
    } finally {
      setDownloading(false)
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
          Couldn&apos;t load this scan: {error.message}
        </p>
      </div>
    )
  }

  if (!scan) {
    return <div className="p-8 text-sm" style={{ color: 'var(--color-dim)' }}>Loading…</div>
  }

  const ai = scan.ai_analysis || {}
  const isActive = scan.status === 'pending' || scan.status === 'running'

  return (
    <div className="pb-8">
      <PageHeader
        title={scan.target_url}
        subtitle={`${scan.scan_type} scan · started ${formatDateTime(scan.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/scans')} className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
              <ArrowLeft size={15} /> Back
            </button>
            {scan.status === 'completed' && (
              <button onClick={handleDownload} disabled={downloading} className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
                <Download size={15} /> {downloading ? 'Preparing…' : 'Export PDF'}
              </button>
            )}
          </div>
        }
      />

      <div className="px-8 pt-6">
        <div className="card mb-6 flex flex-wrap items-center gap-6 rounded-2xl p-5">
          <div><StatusPill status={scan.status} /></div>
          {isActive && (
            <div className="flex-1 min-w-[160px]">
              <div className="mb-1 flex justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
                <span>{scan.current_tool || 'Starting…'}</span>
                <span>{scan.progress ?? 0}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--color-panel-2)' }}>
                <div className="h-full rounded-full" style={{ width: `${scan.progress ?? 0}%`, background: 'var(--color-accent-bright)' }} />
              </div>
            </div>
          )}
          {!isActive && (
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Ran for {formatDuration(scan.created_at, scan.completed_at)}
            </span>
          )}
          {scan.risk_score != null && (
            <span className="text-sm font-medium">Risk score: <span style={{ color: 'var(--color-accent-bright)' }}>{Math.round(scan.risk_score)}</span>/100</span>
          )}
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{vulns.length} findings</span>
        </div>

        {ai.summary && (
          <div className="card mb-6 rounded-2xl p-5">
            <h2 className="mb-2 text-sm font-semibold">AI executive summary</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{ai.summary}</p>
            {Array.isArray(ai.top_recommendations) && ai.top_recommendations.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {ai.top_recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ShieldAlert size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent-bright)' }} />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {Array.isArray(scan.attack_chains) && scan.attack_chains.length > 0 && (
          <div className="card mb-6 rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-semibold">Attack chains</h2>
            <div className="space-y-3">
              {scan.attack_chains.map((chain, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'var(--color-panel-2)', border: '1px solid var(--color-line)' }}>
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                    <Link2 size={14} style={{ color: 'var(--color-high)' }} /> {chain.chain_name}
                  </div>
                  {chain.narrative && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{chain.narrative}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold">Findings</h2>
          {vulns.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: 'var(--color-dim)' }}>
              {isActive ? 'Scan in progress — findings will appear here as they are discovered.' : 'No findings.'}
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {vulns.map((v) => (
                <button
                  key={v.id} onClick={() => setSelected(selected?.id === v.id ? null : v)}
                  className="block w-full py-3 text-left first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{v.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-dim)' }}>
                        {v.service}{v.port ? `:${v.port}` : ''}{v.cve_id ? ` · ${v.cve_id}` : ''}
                      </p>
                    </div>
                    <SeverityBadge level={v.severity} />
                  </div>
                  {selected?.id === v.id && (
                    <div className="mt-3 rounded-lg p-3 text-sm" style={{ background: 'var(--color-panel-2)' }}>
                      <p className="whitespace-pre-wrap" style={{ color: 'var(--color-muted)' }}>{v.description}</p>
                      {v.remediation_steps?.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-dim)' }}>Remediation</p>
                          <ul className="mt-1.5 list-disc space-y-1 pl-4">
                            {v.remediation_steps.map((step, i) => <li key={i}>{step}</li>)}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function severityRank(s) {
  return ['critical', 'high', 'medium', 'low', 'info'].indexOf(s)
}
