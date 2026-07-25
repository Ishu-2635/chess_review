import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import {
  AuthInput, AuthButton, AuthCard, AuthPageShell,
} from '../components/auth/AuthComponents'

export default function LoginPage({ onNavigate }) {
  
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})
  const [globalError, setGlobalError] = useState('')

  const signIn = useAuthStore((s) => s.signIn)

  function validate() {
    const e = {}
    if (!email.trim())          e.email    = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                e.email    = 'Enter a valid email address'
    if (!password)              e.password = 'Password is required'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setGlobalError(''); setLoading(true)

    const { error } = await signIn(email.trim(), password)
    setLoading(false)

    if (error) {
      // Map Supabase error messages to friendlier ones
      if (error.message?.toLowerCase().includes('invalid login')) {
        setGlobalError('Incorrect email or password.')
      } else if (error.message?.toLowerCase().includes('email not confirmed')) {
        setGlobalError('Please verify your email before logging in. Check your inbox.')
      } else {
        setGlobalError(error.message)
      }
    }
    // On success, useAuthStore updates user — App.jsx will redirect
  }

  return (
    <AuthPageShell>
      <AuthCard>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)',
          marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Sign in to access your saved games
        </p>

        {globalError && (
          <div style={{
            padding: '10px 14px', background: '#E74C3C18',
            border: '1px solid #E74C3C44', borderRadius: '8px',
            color: '#E74C3C', fontSize: '13px', marginBottom: '20px',
          }}>
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
            
          <AuthInput
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            error={errors.email}
          />
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            error={errors.password}
          />

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontSize: '13px', padding: 0,
                fontFamily: 'var(--font-ui)',
              }}
            >
              Forgot password?
            </button>
          </div>

          <AuthButton type="submit" loading={loading}>
            Sign in
          </AuthButton>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 600, fontSize: '14px',
              fontFamily: 'var(--font-ui)', padding: 0,
            }}
          >
            Create account
          </button>
        </p>
      </AuthCard>
    </AuthPageShell>
  )
}