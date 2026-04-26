import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import * as api from '../api'

export default function Login() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const verified = params.get('verified') === '1'

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.login(form)
      nav(`/verify-login-otp?email=${encodeURIComponent(form.email)}`)
    } catch (err) {
      if (err.message.toLowerCase().includes('not verified')) {
        nav(`/verify-account?email=${encodeURIComponent(form.email)}`)
        return
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1v14M1 8h14M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">coldyy</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to continue.</p>

        {verified && (
          <div className="alert alert-success" style={{ marginBottom: 14 }}>
            Email verified — you can now sign in.
          </div>
        )}
        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Forgot password?
            </Link>
          </div>

          <button className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
