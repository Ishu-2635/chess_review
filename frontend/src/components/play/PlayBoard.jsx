import { useEffect, useMemo } from 'react'
import { Chessboard } from 'react-chessboard'
import { useGameSessionStore, STATUS } from '../../store/useGameSessionStore'
import { fetchEngineMove } from '../../api/gameApi'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export default function PlayBoard() {
  const chess           = useGameSessionStore((s) => s.chess)
  const currentFen      = useGameSessionStore((s) => s.currentFen)
  const status          = useGameSessionStore((s) => s.status)
  const userColor       = useGameSessionStore((s) => s.userColor)
  const activeColor     = useGameSessionStore((s) => s.activeColor)
  const lastMove        = useGameSessionStore((s) => s.lastMove)
  const hintMove        = useGameSessionStore((s) => s.hintMove)
  const elo             = useGameSessionStore((s) => s.elo)
  const applyUserMove   = useGameSessionStore((s) => s.applyUserMove)
  const applyEngineMove = useGameSessionStore((s) => s.applyEngineMove)
  const checkGameOver   = useGameSessionStore((s) => s.checkGameOver)

  const { windowWidth, isMobile, isTablet } = useBreakpoint()
  const boardSize = isMobile
    ? Math.min(340, windowWidth - 48)
    : isTablet
    ? Math.min(440, windowWidth - 110)
    : 480

  const isUserTurn = status === STATUS.PLAYING && activeColor === userColor

  // Trigger engine move whenever it's the engine's turn
  useEffect(() => {
    if (status !== STATUS.ENGINE_THINKING) return

    let cancelled = false
    async function makeEngineMove() {
      try {
        const data = await fetchEngineMove(chess.fen(), elo)
        if (!cancelled) {
          applyEngineMove(data.from, data.to, data.promotion)
        }
      } catch (err) {
        console.error('Engine move failed:', err.message)
        // Don't crash the game — just switch back to user's turn
        if (!cancelled) {
          useGameSessionStore.setState({ status: STATUS.PLAYING })
        }
      }
    }

    // Small delay so the user can see their move before engine responds
    const timer = setTimeout(makeEngineMove, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [status])

  // If user plays Black, engine moves first as White
  useEffect(() => {
    if (
      status === STATUS.PLAYING &&
      userColor === 'black' &&
      activeColor === 'white' &&
      chess.history().length === 0
    ) {
      useGameSessionStore.setState({ status: STATUS.ENGINE_THINKING })
    }
  }, [status, userColor])

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (!isUserTurn) return false

    // Handle pawn promotion — always promote to queen for simplicity
    const isPromotion =
      piece[1]?.toLowerCase() === 'p' &&
      ((userColor === 'white' && targetSquare[1] === '8') ||
       (userColor === 'black' && targetSquare[1] === '1'))

    const success = applyUserMove(sourceSquare, targetSquare, isPromotion ? 'q' : undefined)

    if (success) {
      // Check if user's move ended the game (e.g. checkmate)
      checkGameOver()
    }

    return success
  }

  // Highlight last move squares
  const customSquareStyles = useMemo(() => {
    const styles = {}
    if (lastMove) {
      const highlight = { backgroundColor: 'rgba(240,165,0,0.25)' }
      styles[lastMove.from] = highlight
      styles[lastMove.to]   = highlight
    }
    return styles
  }, [lastMove])

  // Hint arrow
  const customArrows = useMemo(() => {
    if (!hintMove) return []
    return [[hintMove.from, hintMove.to, 'rgb(0, 200, 100)']]
  }, [hintMove])

  return (
    <div style={{ position: 'relative' }}>
      <Chessboard
        id="play-board"
        position={currentFen}
        boardOrientation={userColor}
        arePiecesDraggable={isUserTurn}
        onPieceDrop={onPieceDrop}
        boardWidth={boardSize}
        animationDuration={200}
        customSquareStyles={customSquareStyles}
        customArrows={customArrows}
        customDarkSquareStyle={{ backgroundColor: '#4a6741' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
        customBoardStyle={{ borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      />

      {/* Engine thinking overlay */}
      {status === STATUS.ENGINE_THINKING && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)',
          border: '1px solid var(--border)', borderRadius: '20px',
          padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px',
          pointerEvents: 'none',
        }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Engine thinking…</span>
        </div>
      )}
    </div>
  )
}
