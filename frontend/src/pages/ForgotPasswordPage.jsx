import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { AuthInput, AuthButton, AuthCard, AuthPageShell } from '../components/auth/AuthComponents'

export default function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  const resetPassword = useAuthStore((s) => s.resetPassword)

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return }
    setError(''); setLoading(true)
    await resetPassword(email.trim()) // always show success — don't reveal if email exists
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <AuthPageShell>
        <AuthCard>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔑</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
              Reset link sent
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
              If <strong style={{ color: 'var(--text)' }}>{email}</strong> is registered,
              you'll receive a password reset link shortly.
            </p>
            <button onClick={() => onNavigate('login')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 600, fontSize: '14px',
              fontFamily: 'var(--font-ui)',
            }}>
              ← Back to sign in
            </button>
          </div>
        </AuthCard>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell>
      <AuthCard>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)',
          marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Forgot password?
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={error}
          />
          <AuthButton type="submit" loading={loading}>
            Send reset link
          </AuthButton>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <button onClick={() => onNavigate('login')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', fontWeight: 600, fontSize: '14px',
            fontFamily: 'var(--font-ui)', padding: 0,
          }}>
            ← Back to sign in
          </button>
        </p>
      </AuthCard>
    </AuthPageShell>
  )
}