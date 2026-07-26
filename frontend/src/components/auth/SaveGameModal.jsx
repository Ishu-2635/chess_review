import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useGameStore } from '../../store/useGameStore'

export default function SaveGameModal({ onClose, onSave }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  const user     = useAuthStore((s) => s.user)
  const analysis = useGameStore((s) => s.analysis)
  const pgnText  = useGameStore((s) => s.pgnText)
  const players  = useGameStore((s) => s.players)

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await onSave({ analysis, pgnText, players })
      setSaved(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 101,
        width: '100%', maxWidth: '420px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        margin: '0 16px',
      }}>
        {saved ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '16px' }}>
              Game saved!
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)',
              marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Save this game?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Save this analysis to your account so you can revisit it anytime without re-analyzing.
            </p>

            {/* Game summary */}
            {analysis && (
              <div style={{
                padding: '12px', background: 'var(--surface-2)',
                borderRadius: '8px', border: '1px solid var(--border)',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
                    {players?.white?.name ?? 'White'} vs {players?.black?.name ?? 'Black'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <AccChip label="W" value={analysis.white?.accuracy} />
                  <AccChip label="B" value={analysis.black?.accuracy} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {analysis.total_moves} moves
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p style={{ fontSize: '13px', color: '#E74C3C', marginBottom: '16px' }}>{error}</p>
            )}

            {!user && (
              <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '16px' }}>
                You need to be signed in to save games.
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                Not now
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !user}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: 'none', background: 'var(--accent)',
                  color: '#000', fontFamily: 'var(--font-ui)',
                  fontSize: '14px', fontWeight: 600,
                  cursor: saving || !user ? 'not-allowed' : 'pointer',
                  opacity: saving || !user ? 0.7 : 1,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                }}
              >
                {saving && (
                  <span style={{
                    width: '13px', height: '13px', borderRadius: '50%',
                    border: '2px solid #00000044', borderTopColor: '#000',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                )}
                {saving ? 'Saving…' : 'Save game'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function AccChip({ label, value }) {
  const pct   = value ?? 0
  const color = pct >= 90 ? '#27AE60' : pct >= 75 ? 'var(--accent)' : '#E74C3C'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}