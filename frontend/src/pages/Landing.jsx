import { useNavigate } from 'react-router-dom'
import * as api from '../api'

export default function Landing() {
  const nav = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      if (refreshToken) await api.logout(refreshToken)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      nav('/')
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-card">
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 32 }}>
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1v14M1 8h14M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">coldyy</span>
        </div>

        <p className="landing-greeting">Signed in as</p>
        <h1 className="landing-name">
          {user.firstname} {user.lastname}
        </h1>
        <p className="landing-email">{user.email}</p>

        <div className="landing-divider" />

        <button className="btn-logout" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )
}
