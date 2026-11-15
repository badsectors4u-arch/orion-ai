import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ScanLine, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import * as api from '../lib/api.js'
import { formatDate } from '../lib/format.js'

export default function Targets() {
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    try {
      setTargets(await api.listTargets())
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newUrl.trim()) return
    setAdding(true)
    try {
      await api.createTarget(newUrl.trim())
      setNewUrl('')
      await load()
    } catch (e) {
      setError(e)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this target? This does not delete any past scans.')) return
    try {
      await api.deleteTarget(id)
      setTargets((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      setError(e)
    }
  }

  return (
    <div className="pb-8">
      <PageHeader title="Targets" subtitle="Domains, hosts, and URLs you scan regularly" />

      <div className="px-8 pt-6">
        <form onSubmit={handleAdd} className="card mb-6 flex items-center gap-2 rounded-2xl p-4">
          <input
            value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com"
            className="input-field flex-1 rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" disabled={adding} className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
            <Plus size={15} /> {adding ? 'Adding…' : 'Add target'}
          </button>
        </form>

        {error && (
          <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
            {error.message}
          </p>
        )}

        <div className="card overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: 'var(--color-line)', color: 'var(--color-dim)' }}>
                <th className="px-5 py-3 font-medium">URL</th>
                <th className="px-5 py-3 font-medium">Domain</th>
                <th className="px-5 py-3 font-medium">Resolved IP</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center" style={{ color: 'var(--color-dim)' }}>Loading…</td></tr>
              ) : targets.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center" style={{ color: 'var(--color-dim)' }}>No targets yet — add one above or launch a scan.</td></tr>
              ) : (
                targets.map((t) => (
                  <tr key={t.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-line-soft)' }}>
                    <td className="px-5 py-3 font-medium">{t.url}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-muted)' }}>{t.domain || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{t.ip || '—'}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-muted)' }}>{formatDate(t.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/scans/new" state={{ targetUrl: t.url }}
                          className="rounded-lg p-1.5 hover:bg-[color:var(--color-panel-2)]" title="Scan this target"
                        >
                          <ScanLine size={15} style={{ color: 'var(--color-accent-bright)' }} />
                        </Link>
                        <button onClick={() => handleDelete(t.id)} className="rounded-lg p-1.5 hover:bg-[color:var(--color-crit-soft)]" title="Remove">
                          <Trash2 size={15} style={{ color: 'var(--color-dim)' }} />
                        </button>
                      </div>
                    </td>
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
