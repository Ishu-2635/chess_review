import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
export function AuthInput({ label, type = 'text', value, onChange, placeholder, autoComplete, error }) {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === 'password'
  const inputType  = isPassword && showPassword ? 'text' : type

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', fontSize: '13px', fontWeight: 500,
        color: 'var(--text-muted)', marginBottom: '6px',
      }}>
        {label}
      </label>

      {/* Wrapper with relative positioning for the eye button */}
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: isPassword ? '10px 40px 10px 14px' : '10px 14px',
            background: 'var(--surface-2)',
            border: `1px solid ${error ? '#E74C3C' : focused ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '8px', color: 'var(--text)',
            fontFamily: 'var(--font-ui)', fontSize: '14px', outline: 'none',
            transition: 'border-color var(--transition)',
          }}
        />

        {/* Eye toggle — only shown for password fields */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            style={{
              position: 'absolute', right: '10px',
              top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '4px',
              color: 'var(--text-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && (
        <p style={{ marginTop: '5px', fontSize: '12px', color: '#E74C3C' }}>{error}</p>
      )}
    </div>
  )
}

export function AuthButton({ children, loading, disabled, onClick, type = 'button', variant = 'primary' }) {
  const isPrimary = variant === 'primary'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', padding: '11px',
        borderRadius: '8px', border: isPrimary ? 'none' : '1px solid var(--border)',
        background: isPrimary ? 'var(--accent)' : 'transparent',
        color: isPrimary ? '#000' : 'var(--text-muted)',
        fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 600,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.7 : 1,
        transition: 'opacity var(--transition)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}
    >
      {loading && (
        <span style={{
          width: '14px', height: '14px', borderRadius: '50%',
          border: '2px solid',
          borderColor: isPrimary ? '#00000044' : 'var(--border)',
          borderTopColor: isPrimary ? '#000' : 'var(--accent)',
          animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  )
}

export function AuthDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>or</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

export function AuthCard({ children }) {
  return (
    <div style={{
      width: '100%', maxWidth: '420px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '36px 32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      {children}
    </div>
  )
}

export function AuthPageShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      justifyContent: 'between', padding: '24px 16px',
      background: 'var(--bg)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '32px',
      }}>
        <span style={{ fontSize: '28px' }}>♞</span>
        <span style={{ fontWeight: 700, fontSize: '22px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Wood<span style={{ color: 'var(--accent)' }}>Knight</span>
        </span>
      </div>
      {children}
    </div>
  )
}

