import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { PlanBadge } from '../components/Badges.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import * as api from '../lib/api.js'
import { formatDate } from '../lib/format.js'

const AI_PROVIDERS = [
  { id: '', label: 'System default' },
  { id: 'cloud', label: 'Cloud (hosted)' },
  { id: 'custom', label: 'Custom (OpenAI-compatible / OpenRouter)' },
  { id: 'local_ollama', label: 'Local Ollama' },
]

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [quota, setQuota] = useState(null)
  const [form, setForm] = useState({ ai_provider: '', ai_base_url: '', ai_api_key: '', ai_model: '' })
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.getQuota().then(setQuota).catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, ai_provider: user.ai_provider || '', ai_model: user.ai_model || '' }))
    }
  }, [user])

  async function handleSaveAi(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await api.updateSettings({
        ai_provider: form.ai_provider || null,
        ai_base_url: form.ai_base_url || null,
        ai_api_key: form.ai_api_key || null,
        ai_model: form.ai_model || null,
      })
      await refreshUser()
      setForm((f) => ({ ...f, ai_api_key: '' }))
      setMessage('AI provider settings saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpgrade(plan) {
    setUpgrading(plan)
    setError('')
    try {
      await api.upgradePlan(plan)
      await refreshUser()
      setQuota(await api.getQuota())
      setMessage(`Upgraded to ${plan}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpgrading('')
    }
  }

  return (
    <div className="pb-8">
      <PageHeader title="Settings" subtitle="Your account, plan, and AI provider" />

      <div className="px-8 pt-6 max-w-2xl space-y-6">
        {message && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-ok)', background: 'var(--color-ok-soft)' }}>{message}</p>
        )}
        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>{error}</p>
        )}

        <section className="card rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold">Account</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={user?.email} />
            <Row label="Username" value={user?.username || '—'} />
            <Row label="Member since" value={formatDate(user?.created_at)} />
          </dl>
        </section>

        <section className="card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Plan & usage</h2>
            <PlanBadge plan={user?.plan} />
          </div>
          {quota && (
            <p className="mb-4 text-sm" style={{ color: 'var(--color-muted)' }}>
              {quota.daily_limit === -1
                ? `${quota.scans_today} scans today · unlimited`
                : `${quota.scans_today} / ${quota.daily_limit} scans used today`}
            </p>
          )}
          {user?.plan === 'free' && (
            <div className="flex gap-2">
              <button onClick={() => handleUpgrade('pro')} disabled={!!upgrading} className="btn-primary rounded-lg px-4 py-2 text-sm">
                {upgrading === 'pro' ? 'Upgrading…' : 'Upgrade to Pro'}
              </button>
              <button onClick={() => handleUpgrade('enterprise')} disabled={!!upgrading} className="btn-ghost rounded-lg px-4 py-2 text-sm">
                {upgrading === 'enterprise' ? 'Upgrading…' : 'Upgrade to Enterprise'}
              </button>
            </div>
          )}
        </section>

        <form onSubmit={handleSaveAi} className="card rounded-2xl p-5">
          <h2 className="mb-1 text-sm font-semibold">AI provider</h2>
          <p className="mb-4 text-xs" style={{ color: 'var(--color-muted)' }}>
            Bring your own key to run scan analysis through a provider of your choice. Leave on system default to use Orion&apos;s built-in AI.
          </p>
          <div className="space-y-3">
            <Field label="Provider">
              <select
                value={form.ai_provider}
                onChange={(e) => setForm((f) => ({ ...f, ai_provider: e.target.value }))}
                className="input-field w-full rounded-lg px-3 py-2 text-sm"
              >
                {AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
            {form.ai_provider && form.ai_provider !== 'local_ollama' && (
              <Field label="API key">
                <input
                  type="password" value={form.ai_api_key}
                  onChange={(e) => setForm((f) => ({ ...f, ai_api_key: e.target.value }))}
                  placeholder={user?.ai_provider ? 'Leave blank to keep current key' : 'sk-…'}
                  className="input-field w-full rounded-lg px-3 py-2 text-sm"
                />
              </Field>
            )}
            {form.ai_provider && (
              <Field label="Base URL (optional)">
                <input
                  value={form.ai_base_url}
                  onChange={(e) => setForm((f) => ({ ...f, ai_base_url: e.target.value }))}
                  placeholder="https://openrouter.ai/api/v1"
                  className="input-field w-full rounded-lg px-3 py-2 text-sm"
                />
              </Field>
            )}
            {form.ai_provider && (
              <Field label="Model">
                <input
                  value={form.ai_model}
                  onChange={(e) => setForm((f) => ({ ...f, ai_model: e.target.value }))}
                  placeholder="llama3"
                  className="input-field w-full rounded-lg px-3 py-2 text-sm"
                />
              </Field>
            )}
          </div>
          <button type="submit" disabled={saving} className="btn-primary mt-4 rounded-lg px-4 py-2 text-sm">
            {saving ? 'Saving…' : 'Save AI settings'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt style={{ color: 'var(--color-muted)' }}>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{label}</span>
      {children}
    </label>
  )
}
