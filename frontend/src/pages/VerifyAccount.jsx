import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import * as api from '../api'
import OtpInput from './OtpInput'

export default function VerifyAccount() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (otp.length < 6) return setError('Enter all 6 digits.')
    setError('')
    setLoading(true)
    try {
      await api.verifyAccount({ email, otp })
      nav('/login?verified=1')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setResending(true)
    setError('')
    setInfo('')
    try {
      await api.resendVerification(email)
      setInfo('A new OTP has been sent to your email.')
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
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

        <h1 className="auth-title">Check your email</h1>
        <p className="auth-sub">
          We sent a 6-digit code to{' '}
          <span style={{ color: 'var(--text-bright)' }}>{email}</span>
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
        {info  && <div className="alert alert-success" style={{ marginBottom: 14 }}>{info}</div>}

        <form className="auth-form" onSubmit={submit}>
          <OtpInput value={otp} onChange={setOtp} />

          <button className="btn-primary" disabled={loading || otp.length < 6}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Verifying…' : 'Verify email'}
          </button>
        </form>

        <p className="auth-footer">
          Didn&apos;t receive it?{' '}
          <button className="link-btn" onClick={resend} disabled={resending}>
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>
        <p className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
