import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import * as api from '../api'

export default function ResetPassword() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.resetPassword({ token, new_password: password })
      nav('/login')
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

        <h1 className="auth-title">New password</h1>
        <p className="auth-sub">Choose a strong password for your account.</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
