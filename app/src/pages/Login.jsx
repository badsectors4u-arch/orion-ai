import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import AuthShell from '../components/AuthShell.jsx'
import { useAuth } from '../state/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Orion workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email" required autoFocus value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full rounded-lg px-3 py-2.5 text-sm" placeholder="you@company.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full rounded-lg px-3 py-2.5 text-sm" placeholder="••••••••"
          />
        </Field>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ color: 'var(--color-crit)', background: 'var(--color-crit-soft)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm">
          <LogIn size={16} />
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        Don&apos;t have an account? <Link to="/register" className="font-medium" style={{ color: 'var(--color-accent)' }}>Create one</Link>
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
