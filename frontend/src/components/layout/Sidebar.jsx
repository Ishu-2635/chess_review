import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useAuthStore } from '../../store/useAuthStore'

const NAV = [
  { id: 'home',        label: 'Home',        icon: HomeIcon },
  { id: 'analysis',    label: 'Analysis',    icon: AnalysisIcon },
  { id: 'saved-games', label: 'Saved Games', icon: SavedIcon },
]

export default function Sidebar({ activePage, onNavigate, drawerOpen, onCloseDrawer, isDrawerMode }) {
  const [collapsed, setCollapsed] = useState(false)
  const isGameLoaded = useGameStore((s) => s.isGameLoaded())
  const reset        = useGameStore((s) => s.reset)
  const user         = useAuthStore((s) => s.user)
  const signOut      = useAuthStore((s) => s.signOut)

  const effectiveCollapsed = isDrawerMode ? false : collapsed
  const w = effectiveCollapsed ? '60px' : '220px'

  function handleNav(id) {
    if (id === 'home') reset()
    onNavigate(id)
    if (isDrawerMode) onCloseDrawer?.()
  }

  async function handleSignOut() {
    await signOut()
    reset()
    onNavigate('home')
    if (isDrawerMode) onCloseDrawer?.()
  }

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {isDrawerMode && drawerOpen && (
        <div className="sidebar-overlay" onClick={onCloseDrawer} style={{ display: 'block' }} />
      )}
      <aside
        className={isDrawerMode ? `sidebar-drawer${drawerOpen ? ' open' : ''}` : ''}
        style={{
          width: w, minWidth: w, height: '100vh',
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          ...(isDrawerMode ? {} : { position: 'sticky', top: 0, transition: 'width 200ms ease, min-width 200ms ease' }),
        }}
      >
        {/* Logo */}
        <div style={{
          padding: effectiveCollapsed ? '20px 0' : '20px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderBottom: '1px solid var(--border)',
          justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
          minHeight: '64px',
        }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
            <rect width="32" height="32" rx="8" fill="var(--accent)" opacity="0.15"/>
            <text x="16" y="22" textAnchor="middle" fontSize="18" fill="var(--accent)">♞</text>
          </svg>
          {!effectiveCollapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Chess<span style={{ color: 'var(--accent)' }}>IQ</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Game Analysis</div>
            </div>
          )}
          {isDrawerMode && (
            <button onClick={onCloseDrawer} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active   = activePage === id
            const disabled = (id === 'analysis' && !isGameLoaded) || (id === 'saved-games' && !user)
            return (
              <button key={id} onClick={() => !disabled && handleNav(id)}
                title={effectiveCollapsed ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: effectiveCollapsed ? '10px 0' : '10px 12px',
                  justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                  borderRadius: '8px', border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : disabled ? 'var(--text-faint)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: active ? 600 : 400,
                  transition: 'background var(--transition), color var(--transition)',
                  width: '100%', whiteSpace: 'nowrap', position: 'relative',
                }}
                onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {active && <span style={{ position: 'absolute', left: 0, top: '25%', height: '50%', width: '3px', borderRadius: '0 2px 2px 0', background: 'var(--accent)' }} />}
                <Icon />
                {!effectiveCollapsed && <span>{label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          {user ? (
            <>
              {!effectiveCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginBottom: '4px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                    {userInitial}
                  </div>
                  <div style={{ minWidth: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>
              )}
              <SidebarBtn icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} label="Sign out" collapsed={effectiveCollapsed} onClick={handleSignOut} danger />
            </>
          ) : (
            <SidebarBtn icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>} label="Sign in" collapsed={effectiveCollapsed} onClick={() => handleNav('login')} accent />
          )}
          {!isDrawerMode && (
            <button onClick={() => setCollapsed(c => !c)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: effectiveCollapsed ? '10px 0' : '10px 12px', justifyContent: effectiveCollapsed ? 'center' : 'flex-start', marginTop: '4px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-faint)', fontFamily: 'var(--font-ui)', fontSize: '13px', width: '100%' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: effectiveCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}><polyline points="15 18 9 12 15 6"/></svg>
              {!effectiveCollapsed && <span>Collapse</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

function SidebarBtn({ icon, label, collapsed, onClick, danger, accent }) {
  const color = danger ? '#E74C3C' : accent ? 'var(--accent)' : 'var(--text-muted)'
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: '8px', border: 'none', cursor: 'pointer', background: accent ? 'var(--accent-dim)' : 'transparent', color, fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: accent ? 600 : 400, width: '100%', transition: 'background var(--transition)' }}
      title={collapsed ? label : undefined}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = accent ? 'var(--accent-dim)' : 'transparent'}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

function HomeIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function AnalysisIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function SavedIcon()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> }