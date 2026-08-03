import { useState } from 'react'
import { LEVELS, TIME_CONTROLS, useGameSessionStore } from '../../store/useGameSessionStore'

export default function GameSetup({ onStart }) {
  const elo         = useGameSessionStore((s) => s.elo)
  const timeControl = useGameSessionStore((s) => s.timeControl)
  const customTime  = useGameSessionStore((s) => s.customTime)
  const customIncrement = useGameSessionStore((s) => s.customIncrement)
  const setConfig   = useGameSessionStore((s) => s.setConfig)

  const [colorChoice, setColorChoice] = useState('white')

  const isCustom = timeControl.label === 'Custom'

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px' }}>♟</span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Play vs Engine
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Configure your game and challenge Stockfish.
          </p>
        </div>

        {/* Difficulty */}
        <Section label="Difficulty">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {LEVELS.map((level) => (
              <button
                key={level.elo}
                onClick={() => setConfig('elo', level.elo)}
                style={{
                  padding: '12px 8px', borderRadius: '10px', border: '1px solid',
                  borderColor: elo === level.elo ? 'var(--accent)' : 'var(--border)',
                  background: elo === level.elo ? 'var(--accent-dim)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                }}
              >
                <span style={{ fontSize: '18px' }}>{levelIcon(level.elo)}</span>
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: elo === level.elo ? 'var(--accent)' : 'var(--text)',
                }}>
                  {level.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                  {level.elo}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* Color */}
        <Section label="Play as">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { value: 'white',  label: 'White', icon: '♔' },
              { value: 'black',  label: 'Black', icon: '♚' },
              { value: 'random', label: 'Random', icon: '🎲' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setColorChoice(opt.value)}
                style={{
                  padding: '14px 8px', borderRadius: '10px', border: '1px solid',
                  borderColor: colorChoice === opt.value ? 'var(--accent)' : 'var(--border)',
                  background: colorChoice === opt.value ? 'var(--accent-dim)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: 1 }}>{opt.icon}</span>
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: colorChoice === opt.value ? 'var(--accent)' : 'var(--text)',
                }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* Time control */}
        <Section label="Time Control">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc.label}
                onClick={() => setConfig('timeControl', tc)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                  borderColor: timeControl.label === tc.label ? 'var(--accent)' : 'var(--border)',
                  background: timeControl.label === tc.label ? 'var(--accent-dim)' : 'transparent',
                  color: timeControl.label === tc.label ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all var(--transition)',
                }}
              >
                {tc.label}
              </button>
            ))}
          </div>

          {/* Custom time inputs */}
          {isCustom && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Minutes
                </label>
                <input
                  type="number" min="1" max="60"
                  value={Math.floor(customTime / 60)}
                  onChange={e => setConfig('customTime', Number(e.target.value) * 60)}
                  style={inputStyle}
                />
              </div>
              <span style={{ color: 'var(--text-faint)', marginTop: '20px' }}>+</span>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Increment (sec)
                </label>
                <input
                  type="number" min="0" max="60"
                  value={customIncrement}
                  onChange={e => setConfig('customIncrement', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </Section>

        {/* Start button */}
        <button
          onClick={() => onStart(colorChoice)}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            border: 'none', background: 'var(--accent)', color: '#000',
            fontFamily: 'var(--font-ui)', fontSize: '16px', fontWeight: 700,
            cursor: 'pointer', marginTop: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'opacity var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          ♟ Start Game
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {label}
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>
      {children}
    </div>
  )
}

function levelIcon(elo) {
  if (elo <= 800)  return '🌱'
  if (elo <= 1200) return '⚔️'
  if (elo <= 1600) return '🏰'
  if (elo <= 2000) return '👑'
  if (elo <= 2400) return '🔥'
  return '💎'
}

const inputStyle = {
  width: '80px', padding: '8px 10px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: '8px', color: 'var(--text)',
  fontFamily: 'var(--font-mono)', fontSize: '14px', outline: 'none',
}
