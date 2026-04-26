const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Something went wrong')
  return data
}

export const register = (body) =>
  req('/register', { method: 'POST', body: JSON.stringify(body) })

export const verifyAccount = (body) =>
  req('/verify-account', { method: 'POST', body: JSON.stringify(body) })

export const resendVerification = (email) =>
  req('/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })

export const login = (body) =>
  req('/login', { method: 'POST', body: JSON.stringify(body) })

export const verifyLoginOtp = (body) =>
  req('/verify-login-otp', { method: 'POST', body: JSON.stringify(body) })

export const forgotPassword = (email) =>
  req('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })

export const verifyResetOtp = (body) =>
  req('/verify-reset-otp', { method: 'POST', body: JSON.stringify(body) })

export const resetPassword = (body) =>
  req('/reset-password', { method: 'POST', body: JSON.stringify(body) })

export const logout = (refresh_token) =>
  req('/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) })

export const refreshToken = (refresh_token) =>
  req('/refresh-token', { method: 'POST', body: JSON.stringify({ refresh_token }) })
