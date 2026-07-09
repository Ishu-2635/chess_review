import { useMemo } from 'react'
import { Chessboard } from 'react-chessboard'
import { useGameStore } from '../../store/useGameStore'
import { derivePositions, getFenForIndex, parsePlayers } from '../../lib/chessHelpers'
import { useClassificationBadge } from '../../hooks/useClassificationBadge'
import { useMoveExplorer } from '../../hooks/useMoveExplorer'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import EvalBar from './EvalBar'

// Map UCI square name to pixel offset on the board
// squares go a1(bottom-left) to h8(top-left) from white's perspective
function squareToOffset(square, boardSize, orientation) {
  const file = square.charCodeAt(0) - 97  // a=0 … h=7
  const rank = parseInt(square[1]) - 1    // 1=0 … 8=7
  const sqSize = boardSize / 8
  let col, row
  if (orientation === 'white') {
    col = file
    row = 7 - rank
  } else {
    col = 7 - file
    row = rank
  }
  return {
    left: col * sqSize + sqSize * 0.6,
    top:  row * sqSize + sqSize * 0.05,
  }
}

export default function Board({ explorer }) {
  const pgnText          = useGameStore((s) => s.pgnText)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)
  const boardOrientation = useGameStore((s) => s.boardOrientation)
  const flipBoard        = useGameStore((s) => s.flipBoard)
  const analysis         = useGameStore((s) => s.analysis)
  const { isMobile, isTablet, windowWidth } = useBreakpoint()

  // Board size is derived from actual reactive window width.
  // Subtract sidebar (~60px collapsed) + eval bar (38px) + padding (48px) for breathing room.
  const boardSize = (() => {
    if (isMobile)  return Math.min(340, windowWidth - 48)
    if (isTablet)  return Math.min(440, windowWidth - 110)
    return 480
  })()

  const positions = useMemo(() => {
    if (!pgnText) return null
    try { return derivePositions(pgnText) } catch { return null }
  }, [pgnText])

  const players = useMemo(() => parsePlayers(pgnText), [pgnText])
  const topPlayer    = boardOrientation === 'white' ? players.black : players.white
  const bottomPlayer = boardOrientation === 'white' ? players.white : players.black
  const topSide      = boardOrientation === 'white' ? 'black' : 'white'
  const bottomSide   = boardOrientation === 'white' ? 'white' : 'black'

  const gameFen = getFenForIndex(positions, currentMoveIndex)
  const displayFen = explorer.isActive ? explorer.fen : gameFen

  const currentMove = analysis?.moves[currentMoveIndex] ?? null
  const badge = useClassificationBadge(explorer.isActive ? null : currentMove)

  // Last move highlight squares
  const customSquareStyles = useMemo(() => {
    const styles = {}
    if (!currentMove || explorer.isActive) return styles
    const from = currentMove.played_move?.slice(0, 2)
    const to   = currentMove.played_move?.slice(2, 4)
    const highlight = { backgroundColor: 'rgba(240,165,0,0.25)' }
    if (from) styles[from] = highlight
    if (to)   styles[to]   = highlight
    return styles
  }, [currentMove, explorer.isActive])

  // Explorer: allow dragging when active
  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (!explorer.isActive) return false
    const promotion = piece[1]?.toLowerCase() === 'p' &&
      (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined
    explorer.playMove(sourceSquare, targetSquare, promotion)
    return true
  }

  // Enter explorer on right-click or from StatsPanel top move click
  function onSquareRightClick() {
    if (!explorer.isActive) {
      explorer.startFrom(gameFen)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
      {/* Opponent (top) */}
      <PlayerBar name={topPlayer.name} elo={topPlayer.elo} side={topSide} boardSize={boardSize} />

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        {/* Eval bar */}
        <EvalBar height={boardSize} />

        {/* Board wrapper — position:relative for badge overlay */}
        <div
          style={{ position: 'relative', borderRadius: '4px', overflow: 'visible',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          onContextMenu={e => { e.preventDefault(); onSquareRightClick() }}
        >
          <Chessboard
            id="analysis-board"
            position={displayFen}
            boardOrientation={boardOrientation}
            arePiecesDraggable={explorer.isActive}
            onPieceDrop={onPieceDrop}
            boardWidth={boardSize}
            animationDuration={explorer.isActive ? 150 : 300}
            customSquareStyles={customSquareStyles}
            customDarkSquareStyle={{ backgroundColor: '#4a6741' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            customBoardStyle={{ borderRadius: '4px' }}
          />

          {/* Classification badge overlay */}
          {badge && (
            <div
              className={`classification-badge${badge.fading ? ' fading' : ''}`}
              style={{
                background: badge.color,
                ...squareToOffset(badge.square, boardSize, boardOrientation),
              }}
            >
              {badge.symbol}
            </div>
          )}

          {/* Explorer mode indicator */}
          {explorer.isActive && (
            <div style={{
              position: 'absolute', top: '6px', left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(240,165,0,0.9)', color: '#000',
              fontSize: '11px', fontWeight: 700, padding: '3px 10px',
              borderRadius: '10px', whiteSpace: 'nowrap', pointerEvents: 'none',
              zIndex: 5,
            }}>
              EXPLORE MODE
            </div>
          )}
        </div>
      </div>

      {/* You (bottom) */}
      <PlayerBar name={bottomPlayer.name} elo={bottomPlayer.elo} side={bottomSide} boardSize={boardSize} />

      {/* Explorer history breadcrumb */}
      {explorer.isActive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          flexWrap: 'wrap', maxWidth: `${boardSize + 38}px`,
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Exploring:
          </span>
          {explorer.history.length === 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              Drag pieces to explore
            </span>
          )}
          {explorer.history.map((h, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: '12px',
              color: 'var(--accent)', fontWeight: 600,
            }}>
              {h.san}
            </span>
          ))}
          {explorer.history.length > 0 && (
            <button onClick={explorer.stepBack} style={{
              padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-muted)',
              fontFamily: 'var(--font-ui)', fontSize: '11px', cursor: 'pointer',
              marginLeft: '4px',
            }}>
              ← Undo
            </button>
          )}
          <button onClick={explorer.exitExplorer} style={{
            padding: '2px 8px', borderRadius: '4px', border: '1px solid #E74C3C44',
            background: '#E74C3C18', color: '#E74C3C',
            fontFamily: 'var(--font-ui)', fontSize: '11px', cursor: 'pointer',
            marginLeft: 'auto',
          }}>
            ✕ Exit
          </button>
        </div>
      )}

      {/* Flip board button */}
      <div style={{
        display: 'flex', gap: '8px', alignItems: 'center',
        width: '100%', maxWidth: `${boardSize + 38}px`,
        justifyContent: 'space-between',
      }}>
        <button
          onClick={flipBoard}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '6px',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
            fontSize: '12px', cursor: 'pointer',
            transition: 'border-color var(--transition), color var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          ⇅ Flip board
        </button>
        {!explorer.isActive && (
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
            Right-click board to explore
          </span>
        )}
      </div>
    </div>
  )
}

function PlayerBar({ name, elo, side, boardSize }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: `${boardSize + 38}px`, padding: '4px 0',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: side === 'white' ? '#d4c5a0' : '#2a2a2a',
        border: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', flexShrink: 0,
        color: side === 'white' ? '#444' : '#ccc',
      }}>
        {side === 'white' ? '♔' : '♚'}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', lineHeight: 1.2 }}>
          {name}
        </div>
        {elo && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{elo} Elo</div>
        )}
      </div>
    </div>
  )
}