import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'

const NAV = [
  { id: 'home',     label: 'Home',     icon: HomeIcon },
  { id: 'analysis', label: 'Analysis', icon: AnalysisIcon },
]

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function AnalysisIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

function ChevronIcon({ collapsed }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}>
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

export default function Sidebar({ activePage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const isGameLoaded = useGameStore((s) => s.isGameLoaded())
  const reset = useGameStore((s) => s.reset)

  const w = collapsed ? '60px' : '220px'

  function handleNav(id) {
    if (id === 'home') {
      // going back home resets the game
      reset()
    }
    onNavigate(id)
  }

  return (
    <aside style={{
      width: w,
      minWidth: w,
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 200ms ease, min-width 200ms ease',
      overflow: 'hidden',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--border)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: '64px',
      }}>
        <KnightLogo />
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Chess<span style={{ color: 'var(--accent)' }}>IQ</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Game Analysis</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activePage === id
          // disable analysis tab if no game loaded and we're on home
          const disabled = id === 'analysis' && !isGameLoaded
          return (
            <button
              key={id}
              onClick={() => !disabled && handleNav(id)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '8px',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : disabled ? 'var(--text-faint)' : 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                transition: 'background var(--transition), color var(--transition)',
                width: '100%',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Active indicator bar */}
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  height: '50%',
                  width: '3px',
                  borderRadius: '0 2px 2px 0',
                  background: 'var(--accent)',
                }} />
              )}
              <Icon />
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '14px',
            width: '100%',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ChevronIcon collapsed={collapsed} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

function KnightLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="var(--accent)" opacity="0.15"/>
      <text x="16" y="22" textAnchor="middle" fontSize="18" fill="var(--accent)">♞</text>
    </svg>
  )
}