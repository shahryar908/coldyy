import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ── Animated OTP demo card ──────────────────────────────────────────────────
function HeroDemo() {
  const [filled, setFilled] = useState(0)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (filled < 6) {
      const t = setTimeout(() => setFilled(f => f + 1), 480)
      return () => clearTimeout(t)
    } else if (!verified) {
      const t = setTimeout(() => setVerified(true), 700)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => { setFilled(0); setVerified(false) }, 2800)
      return () => clearTimeout(t)
    }
  }, [filled, verified])

  return (
    <div className="lp-demo-wrap">
      <div className="lp-demo-glow" />

      {/* Floating badges */}
      <div className="lp-demo-badge lp-demo-badge-tl">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        End-to-end encrypted
      </div>
      <div className="lp-demo-badge lp-demo-badge-br">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        Token expires in 15m
      </div>

      {/* Mock auth card */}
      <div className="lp-demo-card">
        {/* Browser chrome */}
        <div className="lp-demo-chrome">
          <div className="lp-demo-dots">
            <span className="dot-red" />
            <span className="dot-yellow" />
            <span className="dot-green" />
          </div>
          <span className="lp-demo-url">coldyy.app/verify-login</span>
        </div>

        {/* Card body */}
        <div className="lp-demo-body">
          {/* Brand mark */}
          <div className="lp-demo-brandwrap">
            <div className="brand-mark">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1v14M1 8h14M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <p className="lp-demo-title">Two-factor authentication</p>
          <p className="lp-demo-hint">Enter the 6-digit code sent to your inbox</p>

          {/* OTP cells */}
          <div className="otp-wrapper lp-demo-otp">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`otp-cell lp-demo-cell ${filled > i ? 'filled' : ''}`}
              >
                {filled > i ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Status line */}
          <div className={`lp-demo-status ${verified ? 'lp-demo-status-ok' : ''}`}>
            {verified ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Identity verified — redirecting
              </>
            ) : filled === 6 ? (
              <>
                <span className="lp-demo-spinner" />
                Verifying code…
              </>
            ) : (
              `${filled} of 6 digits entered`
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feature cards data ──────────────────────────────────────────────────────
const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'OTP Two-Factor Login',
    desc: 'Every sign-in triggers a one-time code sent to the user\'s inbox — no static passwords leaving the door open.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    title: 'Email Verification',
    desc: 'New accounts stay locked until users confirm ownership via a 6-digit code delivered to their email.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
    title: 'Silent Token Refresh',
    desc: 'Access tokens rotate silently in the background — sessions stay alive without forcing users to re-login.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Private Route Guards',
    desc: 'React Router wrappers protect every authenticated page — unauthenticated requests silently redirect to login.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2H3v16h5l3 3 3-3h7V2z"/><path d="M12 6v6"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
    title: 'OTP Password Reset',
    desc: 'Forgotten password? A complete OTP-gated reset flow gets users back in — no security shortcuts taken.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    title: 'Docker Ready',
    desc: 'Ships with a production Dockerfile and nginx config — containerize and deploy to any platform in minutes.',
  },
]

// ── How it works steps ──────────────────────────────────────────────────────
const steps = [
  {
    num: '01',
    title: 'Create your account',
    desc: 'Sign up with your name and email. No credit card, no friction — just what\'s needed to get you started.',
  },
  {
    num: '02',
    title: 'Confirm your email',
    desc: 'A 6-digit code lands in your inbox. Enter it to verify ownership and activate your account instantly.',
  },
  {
    num: '03',
    title: 'Log in with 2FA',
    desc: 'Each sign-in sends a fresh OTP. Your sessions are JWT-backed with automatic silent refresh. Stay secure.',
  },
]

// ── Security checklist ──────────────────────────────────────────────────────
const securityItems = [
  { icon: '⚡', label: 'Zero-trust architecture' },
  { icon: '🔄', label: 'Automatic token rotation' },
  { icon: '📧', label: 'Email OTP verification' },
  { icon: '🔐', label: 'Bcrypt password hashing' },
  { icon: '⏱', label: 'Short-lived access tokens' },
  { icon: '🚫', label: 'Refresh token invalidation' },
]

// ── Main component ──────────────────────────────────────────────────────────
export default function LandingPublic() {
  return (
    <div className="lp">
      {/* Ambient background glows */}
      <div className="lp-ambient lp-ambient-1" />
      <div className="lp-ambient lp-ambient-2" />

      {/* ── Header / Nav ─────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="brand lp-brand">
            <div className="brand-mark">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1v14M1 8h14M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="brand-name">coldyy</span>
          </div>

          <nav className="lp-nav">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#how" className="lp-nav-link">How it works</a>
            <a href="#security" className="lp-nav-link">Security</a>
          </nav>

          <div className="lp-header-actions">
            <Link to="/login" className="btn-ghost lp-header-ghost">Sign in</Link>
            <Link to="/register" className="lp-header-cta">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          {/* Left: Copy */}
          <div className="lp-hero-left">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              Open-source · React 19 · Production-ready
            </div>

            <h1 className="lp-h1">
              Secure access,<br />
              <span className="lp-h1-gradient">zero</span> compromise.
            </h1>

            <p className="lp-hero-desc">
              A complete, production-grade authentication system.
              OTP two-factor login, email verification, JWT token refresh,
              and password reset — all in one seamless, secure flow.
            </p>

            <div className="lp-hero-btns">
              <Link to="/register" className="lp-btn-primary">
                Start for free
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/login" className="lp-btn-outline">Sign in →</Link>
            </div>

            <div className="lp-tags">
              {['OTP 2FA', 'JWT Tokens', 'Email Confirm', 'Private Routes', 'Docker'].map(t => (
                <span key={t} className="lp-tag">{t}</span>
              ))}
            </div>
          </div>

          {/* Right: Animated demo */}
          <div className="lp-hero-right">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────── */}
      <div className="lp-statsbar">
        <div className="lp-statsbar-inner">
          {[
            { val: '9', label: 'Auth endpoints' },
            { val: '6-digit', label: 'OTP codes' },
            { val: '100%', label: 'Token-based' },
            { val: '2FA', label: 'Every login' },
          ].map(s => (
            <div key={s.label} className="lp-stat">
              <span className="lp-stat-val">{s.val}</span>
              <span className="lp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="lp-features" id="features">
        <div className="lp-section">
          <div className="lp-section-head">
            <p className="lp-section-eyebrow">What's included</p>
            <h2 className="lp-h2">Everything you need,<br />nothing you don't.</h2>
            <p className="lp-section-sub">
              Six battle-tested auth features built in from day one.
            </p>
          </div>

          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="lp-feature-card"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="lp-how" id="how">
        <div className="lp-section">
          <div className="lp-section-head">
            <p className="lp-section-eyebrow">The flow</p>
            <h2 className="lp-h2">From signup to secure<br />in three steps.</h2>
          </div>

          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={s.num} className="lp-step">
                {i < steps.length - 1 && <div className="lp-step-connector" />}
                <div className="lp-step-num">{s.num}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────── */}
      <section className="lp-security" id="security">
        <div className="lp-section">
          <div className="lp-security-inner">
            <div className="lp-security-left">
              <p className="lp-section-eyebrow">Security first</p>
              <h2 className="lp-h2">Built for the<br />paranoid.</h2>
              <p className="lp-security-desc">
                No shortcuts. Every session is JWT-backed with refresh rotation.
                Every login is OTP-gated. Every account is email-verified before access is granted.
              </p>
              <Link to="/register" className="lp-btn-primary" style={{ marginTop: 32 }}>
                Get started free
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            <div className="lp-security-grid">
              {securityItems.map(item => (
                <div key={item.label} className="lp-security-item">
                  <span className="lp-security-emoji">{item.icon}</span>
                  <span className="lp-security-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-section">
          <div className="lp-cta-box">
            <div className="lp-cta-glow" />
            <p className="lp-section-eyebrow" style={{ color: 'var(--accent)' }}>Ready when you are</p>
            <h2 className="lp-h2" style={{ color: 'var(--text-head)', marginBottom: 12 }}>
              Start building secure<br />experiences today.
            </h2>
            <p className="lp-cta-sub">
              No configuration required. Clone, run, and ship.
            </p>
            <div className="lp-cta-btns">
              <Link to="/register" className="lp-btn-primary">
                Create account
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/login" className="lp-btn-outline">Sign in instead</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="brand">
            <div className="brand-mark">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1v14M1 8h14M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="brand-name">coldyy</span>
          </div>
          <p className="lp-footer-copy">© 2025 Coldyy. Built with React 19 + Vite.</p>
          <div className="lp-footer-links">
            <Link to="/login" className="lp-footer-link">Sign in</Link>
            <Link to="/register" className="lp-footer-link">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
