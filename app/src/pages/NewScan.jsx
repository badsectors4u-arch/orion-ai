import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Gauge, Globe, Loader2, Radar, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import * as api from '../lib/api.js'

const SCAN_TYPES = [
  { id: 'quick', label: 'Quick', icon: Radar, desc: 'Fast recon pass — ports and headers only. Good for a first look.' },
  { id: 'standard', label: 'Standard', icon: ShieldCheck, desc: 'Balanced depth: network + web checks with AI-ranked findings.' },
  { id: 'full', label: 'Full', icon: Gauge, desc: 'Every scanner plus an extended AI Deep Hunter pass. Most thorough.' },
  { id: 'web_only', label: 'Web only', icon: Globe, desc: 'Skips network/port scanning — web application checks only.' },
]

const DURATIONS = [
  { seconds: 120, label: '2 min' },
  { seconds: 300, label: '5 min' },
  { seconds: 600, label: '10 min' },
]

export default function NewScan() {
  const navigate = useNavigate()
  const location = useLocation()
  const [targetUrl, setTargetUrl] = useState(location.state?.targetUrl || '')
  const [recentTargets, setRecentTargets] = useState([])
  const [scanType, setScanType] = useState('standard')
  const [duration, setDuration] = useState(300)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listTargets().then((list) => setRecentTargets(list || [])).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!targetUrl.trim()) {
      setError('Enter a target URL first.')
      return
    }
    setSubmitting(true)
    try {
      const scan = await api.createScan({
        target_url: targetUrl.trim(),
        scan_type: scanType,
        ai_hunter_duration: duration,
      })
      navigate(`/scans/${scan.id}`)
    } catch (err) {
      setError(err.message || 'Could not start the scan.')
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="New scan"
        action={
          <button onClick={() => navigate('/scans')} className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <ArrowLeft size={15} /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="mx-8 mt-6 max-w-2xl space-y-6">
        <section className="card rounded-2xl p-5">
          <h2 className="mb-3 text-sm font-semibold">Target</h2>
          <input
            value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
          />
          {recentTargets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recentTargets.slice(0, 8).map((t) => (
                <button
                  key={t.id} type="button" onClick={() => setTargetUrl(t.url)}
                  className="rounded-full px-3 py-1 text-xs"
                  style={{ background: 'var(--color-panel-2)', border: '1px solid var(--color-line)', color: 'var(--color-muted)' }}
                >
                  {t.url}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card rounded-2xl p-5">
          <h2 className="mb-3 text-sm font-semibold">Scan type</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SCAN_TYPES.map((t) => (
              <button
                type="button" key={t.id} onClick={() => setScanType(t.id)}
                className="rounded-xl p-4 text-left transition-colors"
                style={{
                  border: `1px solid ${scanType === t.id ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  background: scanType === t.id ? 'var(--color-accent-soft)' : 'var(--color-panel-2)',
                }}
              >
                <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                  <t.icon size={16} style={{ color: 'var(--color-accent-bright)' }} /> {t.label}
                </div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="card rounded-2xl p-5">
          <h2 className="mb-3 text-sm font-semibold">AI Deep Hunter budget</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            How long the AI-guided analysis phase can spend correlating findings. Longer budgets can surface more, at the cost of a longer scan.
          </p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                type="button" key={d.seconds} onClick={() => setDuration(d.seconds)}
                className="rounded-lg px-4 py-2 text-sm"
                style={{
                  border: `1px solid ${duration === d.seconds ? 'var(--color-accent)' : 'var(--color-line)'}`,
                  background: duration === d.seconds ? 'var(--color-accent-soft)' : 'var(--color-panel-2)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm">
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? 'Starting scan…' : 'Launch scan'}
        </button>
      </form>
    </div>
  )
}
