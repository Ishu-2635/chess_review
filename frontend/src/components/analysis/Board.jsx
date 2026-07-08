import { useMemo } from 'react'
import { Chessboard } from 'react-chessboard'
import { useGameStore } from '../../store/useGameStore'
import { derivePositions, getFenForIndex } from '../../lib/chessHelpers'
import EvalBar from './EvalBar'

const BOARD_SIZE = 480

export default function Board() {
  const pgnText = useGameStore((s) => s.pgnText)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)
  const boardOrientation = useGameStore((s) => s.boardOrientation)
  const flipBoard = useGameStore((s) => s.flipBoard)

  const positions = useMemo(() => {
    if (!pgnText) return null
    return derivePositions(pgnText)
  }, [pgnText])

  const fen = getFenForIndex(positions, currentMoveIndex)

  // Highlight last move squares
  const customSquareStyles = useMemo(() => {
    if (!positions || currentMoveIndex < 0) return {}
    // chess.js verbose history gives us from/to per move
    // We can derive it from the FEN change — but for now highlight is omitted
    // until we store the verbose history in chessHelpers (added next)
    return {}
  }, [positions, currentMoveIndex])

  if (!pgnText) {
    return (
      <div style={{
        width: BOARD_SIZE, height: BOARD_SIZE,
        background: 'var(--surface)', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '14px', border: '1px solid var(--border)',
      }}>
        No game loaded
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        {/* Eval bar sits left of the board */}
        <EvalBar height={BOARD_SIZE} />

        {/* Board */}
        <div style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <Chessboard
            id="analysis-board"
            position={fen}
            boardOrientation={boardOrientation}
            arePiecesDraggable={false}
            boardWidth={BOARD_SIZE}
            customSquareStyles={customSquareStyles}
            customBoardStyle={{ borderRadius: '0' }}
            customDarkSquareStyle={{ backgroundColor: '#4a6741' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          />
        </div>
      </div>

      {/* Flip button */}
      <button
        onClick={flipBoard}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '6px',
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
          fontSize: '13px', cursor: 'pointer',
          transition: 'border-color var(--transition), color var(--transition)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <FlipIcon /> Flip board
      </button>
    </div>
  )
}

function FlipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 014-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
  )
}