import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import {
  AuthInput, AuthButton, AuthCard, AuthPageShell,
} from '../components/auth/AuthComponents'

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'One number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
]

function PasswordStrength({ password }) {
  if (!password) return null
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  const color = passed <= 2 ? '#E74C3C' : passed <= 3 ? 'var(--accent)' : '#27AE60'
  const label = passed <= 2 ? 'Weak' : passed <= 3 ? 'Fair' : passed <= 4 ? 'Good' : 'Strong'

  return (
    <div style={{ marginTop: '-8px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i <= passed ? color : 'var(--border)',
            transition: 'background 200ms',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {PASSWORD_RULES.map(rule => (
          <span key={rule.label} style={{
            fontSize: '11px',
            color: rule.test(password) ? '#27AE60' : 'var(--text-faint)',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            {rule.test(password) ? '✓' : '○'} {rule.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage({ onNavigate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState(false)

  const signUp = useAuthStore((s) => s.signUp)

  function validate() {
    const e = {}
    if (!email.trim())
      e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Enter a valid email address'

    const failedRules = PASSWORD_RULES.filter(r => !r.test(password))
    if (!password)
      e.password = 'Password is required'
    else if (failedRules.length > 0)
      e.password = `Password needs: ${failedRules.map(r => r.label.toLowerCase()).join(', ')}`

    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setGlobalError(''); setLoading(true)

    const { error } = await signUp(email.trim(), password)
    setLoading(false)

    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        setGlobalError('An account with this email already exists. Try logging in.')
      } else if (error.message?.toLowerCase().includes('disposable')) {
        setGlobalError('Temporary email addresses are not allowed. Please use a real email.')
      } else {
        setGlobalError(error.message)
      }
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <AuthPageShell>
        <AuthCard>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
              We sent a verification link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
              Click the link to activate your account.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
              Already verified?{' '}
              <button onClick={() => onNavigate('login')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-ui)',
              }}>
                Sign in
              </button>
            </p>
          </div>
        </AuthCard>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell>
      <AuthCard>
        <h1 style={{
          fontSize: '22px', fontWeight: 700, color: 'var(--text)',
          marginBottom: '6px', letterSpacing: '-0.02em'
        }}>
          Create account
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Save and revisit your game analyses
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
            label="Full Name"
            type="name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
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
            autoComplete="new-password"
            error={errors.password}
          />
          <PasswordStrength password={password} />
        
          <AuthButton type="submit" loading={loading}>
            Create account
          </AuthButton>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 600, fontSize: '14px',
              fontFamily: 'var(--font-ui)', padding: 0,
            }}
          >
            Sign in
          </button>
        </p>
      </AuthCard>
    </AuthPageShell>
  )
}