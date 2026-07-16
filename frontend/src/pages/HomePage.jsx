import { useState, useRef } from 'react'
import HeroBoard from '../components/home/HeroBoard'

export default function HomePage({ onSelectSource }) {
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef(null)

  function handlePgnFile(e) {
    const file = e.target.files?.[0]
    if (file) onSelectSource('pgn', { file })
  }

  return (
    <div className="home-grid">
      {/* ── Left: Hero board ── */}
      <div className="home-hero">
        {/* Subtle grid pattern in background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(240,165,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240,165,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Brand tag top-left */}
        <div style={{
          position: 'absolute', top: '28px', left: '32px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '22px' }}>♞</span>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Chess<span style={{ color: 'var(--accent)' }}>IQ</span>
          </span>
        </div>

        {/* Animated board */}
        <div style={{ width: '480px', height: '480px' }}>
          <HeroBoard />
        </div>

        {/* Bottom label */}
        <div style={{
          position: 'absolute', bottom: '28px',
          display: 'flex', alignItems: 'center', gap: '8px',
          color: 'var(--text-muted)', fontSize: '12px',
        }}>
          <span style={{
            display: 'inline-block', width: '6px', height: '6px',
            borderRadius: '50%', background: 'var(--accent)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          Replaying: The Immortal Game, 1851
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>

      {/* ── Mobile hero board (tablet/mobile only, hidden on desktop via CSS) ── */}
      <div className="home-hero-mobile">
        <HeroBoard />
      </div>

      {/* ── Right: Controls ── */}
      <div className="home-content">
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
          borderRadius: '20px', padding: '4px 12px', marginBottom: '24px',
          width: 'fit-content',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
            GAME ANALYSIS
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: '38px', fontWeight: 700, lineHeight: 1.1,
          letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: '14px',
        }}>
          Understand every<br />
          <span style={{ color: 'var(--accent)' }}>move you make.</span>
        </h1>
        <p style={{
          fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7,
          marginBottom: '40px', maxWidth: '380px',
        }}>
          Deep engine analysis on every game. Find your blunders,
          missed wins, and the exact moment a game turned.
        </p>

        {/* Source cards */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{
            fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px',
          }}>
            Choose a source
          </p>
          <div className="source-cards">
            <SourceCard
              icon={<ChesscomIcon />}
              title="Chess.com"
              description="Import from your account"
              badge="Popular"
              onClick={() => onSelectSource('chesscom')}
            />
            <SourceCard
              icon={<LichessIcon />}
              title="Lichess"
              description="Import from your account"
              onClick={() => onSelectSource('lichess')}
            />
            <SourceCard
              icon={<PgnIcon />}
              title="Upload PGN"
              description="Upload any PGN file"
              onClick={() => fileInputRef.current?.click()}
            />
          </div>
          <input ref={fileInputRef} type="file" accept=".pgn" style={{ display: 'none' }} onChange={handlePgnFile} />
        </div>

        {/* Feature list */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            'Move-by-move Stockfish evaluation',
            'Blunder, mistake & brilliant move detection',
            'Accuracy score per player',
            'Best move alternatives shown inline',
          ].map(text => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '14px', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Source card ── */
function SourceCard({ icon, title, description, badge, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '10px', padding: '16px 14px',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background var(--transition), border-color var(--transition)',
        display: 'flex', flexDirection: 'column', gap: '10px',
        position: 'relative',
      }}
    >
      {badge && (
        <span style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
          color: 'var(--accent)', fontSize: '9px', fontWeight: 700,
          padding: '2px 6px', borderRadius: '8px', letterSpacing: '0.05em',
        }}>
          {badge}
        </span>
      )}
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: 'var(--surface-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginBottom: '3px' }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</div>
      </div>
    </button>
  )
}

/* ── Icons ── */
function ChesscomIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.5"/>
      <path d="M9 8h6v2h-2v2l2 4H9l2-4V10H9V8z" fill="var(--accent)"/>
    </svg>
  )
}

function LichessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 3c-1 2-3 3-3 6s2 4 3 4 3-1 3-4-2-4-3-6z"/>
      <path d="M9 13v6M15 13v6M7 19h10"/>
    </svg>
  )
}

function PgnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  )
}