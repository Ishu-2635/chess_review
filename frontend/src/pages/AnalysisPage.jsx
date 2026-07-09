import { useGameStore } from '../store/useGameStore'
import Board from '../components/analysis/Board'
import MoveList from '../components/analysis/MoveList'
import NavigationControls from '../components/analysis/NavigationControls'
import StatsPanel from '../components/analysis/StatsPanel'
import { useKeyboardNav } from '../hooks/useKeyboardNav'
import { useMoveExplorer } from '../hooks/useMoveExplorer'

export default function AnalysisPage({ onGoHome }) {
  const analysis = useGameStore((s) => s.analysis)
  const status   = useGameStore((s) => s.status)
  const explorer = useMoveExplorer()

  useKeyboardNav()

  if (!analysis && status !== 'loading') return <EmptyState onGoHome={onGoHome} />
  if (status === 'loading') return <LoadingState />

  return (
    <div className="analysis-shell">
      <div className="analysis-layout">
        {/* Left — board */}
        <div className="analysis-left">
          <GameHeader />
          <Board explorer={explorer} />
          <NavigationControls />
          <KeyboardHint />
        </div>

        {/* Center — move list */}
        <div className="analysis-center">
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)',
            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
            Moves
          </div>
          <MoveList />
        </div>

        {/* Right — stats */}
        <div className="analysis-right">
          <StatsPanel explorer={explorer} />
        </div>
      </div>
    </div>
  )
}

function GameHeader() {
  const analysis = useGameStore((s) => s.analysis)
  if (!analysis) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', maxWidth: '560px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {analysis.total_moves} moves analyzed
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <AccBadge label="W" value={analysis.white.accuracy} />
        <AccBadge label="B" value={analysis.black.accuracy} />
      </div>
    </div>
  )
}

function AccBadge({ label, value }) {
  const pct   = value ?? 0
  const color = pct >= 90 ? '#27AE60' : pct >= 75 ? 'var(--accent)' : '#E74C3C'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '6px',
      background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function KeyboardHint() {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center',
      color: 'var(--text-faint)', fontSize: '11px' }}>
      <kbd style={kbdStyle}>←</kbd>
      <kbd style={kbdStyle}>→</kbd>
      <span>navigate · right-click board to explore</span>
    </div>
  )
}

const kbdStyle = {
  padding: '2px 6px', border: '1px solid var(--border)',
  borderRadius: '4px', background: 'var(--surface)',
  fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)',
}

function EmptyState({ onGoHome }) {
  const errorMessage = useGameStore((s) => s.errorMessage)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '16px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
        ♟
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
          No game loaded
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px',
          lineHeight: 1.6, marginBottom: '24px' }}>
          Go back to the home page to import a game from Chess.com, Lichess, or upload a PGN.
        </div>
        {errorMessage && (
          <div style={{ padding: '10px 16px', background: '#E74C3C18',
            border: '1px solid #E74C3C44', borderRadius: '8px',
            color: '#E74C3C', fontSize: '13px', marginBottom: '16px' }}>
            {errorMessage}
          </div>
        )}
        <button onClick={onGoHome} style={{ padding: '9px 24px', borderRadius: '8px',
          border: 'none', background: 'var(--accent)', color: '#000',
          fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          Go to Home
        </button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Analyzing game…</div>
    </div>
  )
}