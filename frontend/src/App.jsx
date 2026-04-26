import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register        from './pages/Register'
import VerifyAccount   from './pages/VerifyAccount'
import Login           from './pages/Login'
import VerifyLoginOtp  from './pages/VerifyLoginOtp'
import ForgotPassword  from './pages/ForgotPassword'
import VerifyResetOtp  from './pages/VerifyResetOtp'
import ResetPassword   from './pages/ResetPassword'
import Landing         from './pages/Landing'
import LandingPublic   from './pages/LandingPublic'

function PrivateRoute({ children }) {
  return localStorage.getItem('access_token')
    ? children
    : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  return localStorage.getItem('access_token')
    ? <Navigate to="/dashboard" replace />
    : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing page */}
        <Route path="/" element={<LandingPublic />} />

        {/* Private user dashboard */}
        <Route path="/dashboard" element={
          <PrivateRoute><Landing /></PrivateRoute>
        } />

        {/* Auth flows (redirect to dashboard if already logged in) */}
        <Route path="/register" element={
          <GuestRoute><Register /></GuestRoute>
        } />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/login" element={
          <GuestRoute><Login /></GuestRoute>
        } />
        <Route path="/verify-login-otp" element={<VerifyLoginOtp />} />
        <Route path="/forgot-password" element={
          <GuestRoute><ForgotPassword /></GuestRoute>
        } />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password"   element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
