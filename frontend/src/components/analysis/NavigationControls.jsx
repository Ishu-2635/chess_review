import { useGameStore } from '../../store/useGameStore'

export default function NavigationControls() {
  const nextMove = useGameStore((s) => s.nextMove)
  const prevMove = useGameStore((s) => s.prevMove)
  const goToStart = useGameStore((s) => s.goToStart)
  const goToEnd = useGameStore((s) => s.goToEnd)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)
  const totalMoves = useGameStore((s) => s.totalMoves())

  const atStart = currentMoveIndex === -1
  const atEnd = currentMoveIndex === totalMoves - 1

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 0',
      borderTop: '1px solid var(--border)',
    }}>
      <NavBtn onClick={goToStart} disabled={atStart} title="Start (Home)"><SkipBackIcon /></NavBtn>
      <NavBtn onClick={prevMove} disabled={atStart} title="Previous (←)"><PrevIcon /></NavBtn>

      {/* Move counter */}
      <div style={{
        minWidth: '72px', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        {currentMoveIndex < 0 ? '—' : `${currentMoveIndex + 1} / ${totalMoves}`}
      </div>

      <NavBtn onClick={nextMove} disabled={atEnd} title="Next (→)"><NextIcon /></NavBtn>
      <NavBtn onClick={goToEnd} disabled={atEnd} title="End (End)"><SkipFwdIcon /></NavBtn>
    </div>
  )
}

function NavBtn({ onClick, disabled, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: '34px', height: '34px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: disabled ? 'var(--text-faint)' : 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background var(--transition), color var(--transition), border-color var(--transition)',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = disabled ? 'var(--text-faint)' : 'var(--text-muted)' }}
    >
      {children}
    </button>
  )
}

const S = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const SkipBackIcon = () => <svg {...S}><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
const PrevIcon    = () => <svg {...S}><polyline points="15 18 9 12 15 6"/></svg>
const NextIcon    = () => <svg {...S}><polyline points="9 18 15 12 9 6"/></svg>
const SkipFwdIcon = () => <svg {...S}><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20"/></svg>