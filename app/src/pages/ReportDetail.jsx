import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { SeverityBadge } from '../components/Badges.jsx'
import * as api from '../lib/api.js'
import { countBySeverity, formatDateTime, SEVERITY_ORDER } from '../lib/format.js'

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.getScan(id).then(setScan).catch(setError)
  }, [id])

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
    return <div className="p-8 text-sm" style={{ color: 'var(--color-crit)' }}>Couldn&apos;t load this report: {error.message}</div>
  }
  if (!scan) {
    return <div className="p-8 text-sm" style={{ color: 'var(--color-dim)' }}>Loading…</div>
  }

  const vulns = scan.vulnerabilities || []
  const counts = countBySeverity(vulns)
  const ai = scan.ai_analysis || {}

  return (
    <div className="pb-8">
      <PageHeader
        title={`Report — ${scan.target_url}`}
        subtitle={`Completed ${formatDateTime(scan.completed_at)}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/reports')} className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
              <ArrowLeft size={15} /> Back
            </button>
            <button onClick={handleDownload} disabled={downloading} className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
              <Download size={15} /> {downloading ? 'Preparing…' : 'Export PDF'}
            </button>
          </div>
        }
      />

      <div className="px-8 pt-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SEVERITY_ORDER.map((s) => (
            <div key={s} className="card rounded-xl p-4 text-center">
              <p className="font-display text-2xl font-semibold">{counts[s]}</p>
              <p className="mt-1 text-xs capitalize" style={{ color: 'var(--color-muted)' }}>{s}</p>
            </div>
          ))}
        </div>

        {ai.summary && (
          <div className="card mb-6 rounded-2xl p-5">
            <h2 className="mb-2 text-sm font-semibold">Executive summary</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{ai.summary}</p>
          </div>
        )}

        <div className="card rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold">All findings</h2>
          <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
            {vulns.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-dim)' }}>
                    {v.service}{v.port ? `:${v.port}` : ''}{v.cve_id ? ` · ${v.cve_id}` : ''}
                  </p>
                </div>
                <SeverityBadge level={v.severity} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
