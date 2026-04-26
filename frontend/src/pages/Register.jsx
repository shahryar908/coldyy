import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as api from '../api'

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', password: '' })
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
      await api.register(form)
      nav(`/verify-account?email=${encodeURIComponent(form.email)}`)
    } catch (err) {
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

        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join coldyy — takes less than a minute.</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label>First name</label>
              <input
                type="text"
                placeholder="Alex"
                value={form.firstname}
                onChange={set('firstname')}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Last name</label>
              <input
                type="text"
                placeholder="Kim"
                value={form.lastname}
                onChange={set('lastname')}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
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

          <button className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
