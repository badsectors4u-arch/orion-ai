import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import AuthShell from '../components/AuthShell.jsx'
import { useAuth } from '../state/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await register(email.trim(), password, username.trim() || undefined)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create your workspace" subtitle="Start running security scans in minutes">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email" required autoFocus value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full rounded-lg px-3 py-2.5 text-sm" placeholder="you@company.com"
          />
        </Field>
        <Field label="Username (optional)">
          <input
            type="text" value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field w-full rounded-lg px-3 py-2.5 text-sm" placeholder="How you'll appear in the app"
          />
        </Field>
        <Field label="Password">
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full rounded-lg px-3 py-2.5 text-sm" placeholder="At least 8 characters"
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password" required value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-field w-full rounded-lg px-3 py-2.5 text-sm" placeholder="••••••••"
          />
        </Field>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm">
          <UserPlus size={16} />
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--color-accent)' }}>Sign in</Link>
      </p>
    </AuthShell>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-muted)' }}>{label}</span>
      {children}
    </label>
  )
}
