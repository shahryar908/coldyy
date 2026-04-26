import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as api from '../api'

export default function ForgotPassword() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.forgotPassword(email)
      nav(`/verify-reset-otp?email=${encodeURIComponent(email)}`)
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

        <h1 className="auth-title">Reset password</h1>
        <p className="auth-sub">We&apos;ll email you a reset code.</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Sending…' : 'Send reset code'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
