import { useGameStore } from '../../store/useGameStore'

const MAX_CP = 1000 // clamp at ±10 pawns for visual scale

function cpToPercent(cp) {
  // Sigmoid-like mapping: 50% = equal, 100% = white winning, 0% = black winning
  const clamped = Math.max(-MAX_CP, Math.min(MAX_CP, cp))
  return 50 + (clamped / MAX_CP) * 45 // 5–95% range so it never fully empties
}

function formatEval(cp) {
  if (Math.abs(cp) >= MAX_CP) return cp > 0 ? '+M' : '-M'
  const pawns = cp / 100
  return (pawns > 0 ? '+' : '') + pawns.toFixed(1)
}

export default function EvalBar({ height = 480 }) {
  const analysis = useGameStore((s) => s.analysis)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)

  // Derive eval from white's perspective per the backend convention
  let evalCp = 0
  if (analysis && currentMoveIndex >= 0) {
    const move = analysis.moves[currentMoveIndex]
    if (move) {
      evalCp = move.side === 'white'
        ? move.eval_before
        : -move.eval_before
    }
  }

  const whitePct = cpToPercent(evalCp)
  const blackPct = 100 - whitePct
  const evalStr = formatEval(evalCp)
  const whiteLeading = evalCp >= 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '28px',
      height: `${height}px`,
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Black's section (top) */}
      <div style={{
        width: '100%',
        height: `${blackPct}%`,
        background: '#1a1a1a',
        transition: 'height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '4px',
      }}>
        {!whiteLeading && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: '#888',
            fontWeight: 500,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
          }}>
            {evalStr.replace('+', '')}
          </span>
        )}
      </div>

      {/* White's section (bottom) */}
      <div style={{
        width: '100%',
        height: `${whitePct}%`,
        background: '#d4c5a0',
        transition: 'height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '4px',
      }}>
        {whiteLeading && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: '#666',
            fontWeight: 500,
          }}>
            {evalStr}
          </span>
        )}
      </div>
    </div>
  )
}