import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import * as api from '../api'
import OtpInput from './OtpInput'

export default function VerifyLoginOtp() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (otp.length < 6) return setError('Enter all 6 digits.')
    setError('')
    setLoading(true)
    try {
      const data = await api.verifyLoginOtp({ email, otp })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      nav('/')
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

        <h1 className="auth-title">Two-factor check</h1>
        <p className="auth-sub">
          Enter the 6-digit code sent to{' '}
          <span style={{ color: 'var(--text-bright)' }}>{email}</span>
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <OtpInput value={otp} onChange={setOtp} />

          <button className="btn-primary" disabled={loading || otp.length < 6}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
