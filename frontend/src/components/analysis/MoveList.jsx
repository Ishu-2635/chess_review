import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { derivePositions } from '../../lib/chessHelpers'
import { useMemo } from 'react'

export default function MoveList() {
  const analysis = useGameStore((s) => s.analysis)
  const pgnText = useGameStore((s) => s.pgnText)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)
  const setMove = useGameStore((s) => s.setMove)
  const activeRef = useRef(null)

  // Derive SAN for each move
  const sans = useMemo(() => {
    if (!pgnText) return []
    try {
      return derivePositions(pgnText).sans
    } catch {
      return []
    }
  }, [pgnText])

  // Auto-scroll active move into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentMoveIndex])

  if (!analysis) return null

  const moves = analysis.moves

  // Group into pairs: [white_move, black_move?]
  const pairs = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ moveNumber: moves[i].move_number, white: moves[i], whiteIndex: i, black: moves[i + 1] || null, blackIndex: i + 1 })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 1fr',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        <span>#</span>
        <span>White</span>
        <span>Black</span>
      </div>

      {/* Scrollable move rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {pairs.map(({ moveNumber, white, whiteIndex, black, blackIndex }) => (
          <div key={moveNumber} style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 1fr',
            padding: '0 8px',
          }}>
            {/* Move number */}
            <div style={{
              display: 'flex', alignItems: 'center',
              fontSize: '12px', color: 'var(--text-faint)',
              fontFamily: 'var(--font-mono)', paddingLeft: '4px',
            }}>
              {moveNumber}
            </div>

            {/* White move */}
            <MoveCell
              move={white}
              index={whiteIndex}
              san={sans[whiteIndex]}
              isActive={currentMoveIndex === whiteIndex}
              onClick={() => setMove(whiteIndex)}
              ref={currentMoveIndex === whiteIndex ? activeRef : null}
            />

            {/* Black move */}
            {black ? (
              <MoveCell
                move={black}
                index={blackIndex}
                san={sans[blackIndex]}
                isActive={currentMoveIndex === blackIndex}
                onClick={() => setMove(blackIndex)}
                ref={currentMoveIndex === blackIndex ? activeRef : null}
              />
            ) : <div />}
          </div>
        ))}
      </div>
    </div>
  )
}

import { forwardRef } from 'react'

const MoveCell = forwardRef(function MoveCell({ move, san, isActive, onClick }, ref) {
  if (!move) return <div />

  const displayMove = san || move.played_move

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 8px',
        margin: '1px 2px',
        borderRadius: '6px',
        border: isActive ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent',
        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
        background: isActive ? 'var(--accent-dim)' : 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: isActive ? 'var(--text)' : 'var(--text-muted)',
        fontWeight: isActive ? 600 : 400,
        textAlign: 'left',
        width: '100%',
        transition: 'background var(--transition), color var(--transition), border-color var(--transition)',
        gap: '4px',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)' } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayMove}
      </span>
      {move.symbol && (
        <span style={{
          fontSize: '12px',
          color: move.color,
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
          fontWeight: 700,
        }}>
          {move.symbol}
        </span>
      )}
    </button>
  )
})