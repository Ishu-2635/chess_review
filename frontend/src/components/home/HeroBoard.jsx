import { useState, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const FAMOUS_MOVES = [
  'e4', 'e5', 'f4', 'exf4', 'Bc4', 'Qh4+', 'Kf1', 'b5', 'Bxb5', 'Nf6',
  'Nf3', 'Qh6', 'd3', 'Nh5', 'Nh4', 'Qg5', 'Nf5', 'c6', 'g4', 'Nf6',
  'Rg1', 'cxb5', 'h4', 'Qg6', 'h5', 'Qg5', 'Qf3', 'Ng8', 'Bxf4', 'Qf6',
  'Nc3', 'Bc5', 'Nd5', 'Qxb2', 'Bd6', 'Bxg1', 'e5', 'Qxa1+', 'Ke2', 'Na6',
  'Nxg7+', 'Kd8', 'Qf6+', 'Nxf6', 'Be7#',
]

const MOVE_INTERVAL_MS  = 1800
const PAUSE_AFTER_END_MS = 3000

export default function HeroBoard() {
  const [fen, setFen] = useState(new Chess().fen())
  const chessRef     = useRef(new Chess())
  const moveIndexRef = useRef(0)
  const timeoutRef   = useRef(null)
  const { windowWidth, isMobile, isTablet } = useBreakpoint()

  // On desktop this sits inside a flex-1 panel, so use fixed size.
  // On mobile/tablet it must fit inside the screen width exactly.
  const isSmall  = isMobile || isTablet
  const boardSize = isSmall ? Math.floor(windowWidth - 32) : 400

  useEffect(() => {
    function playNextMove() {
      const chess = chessRef.current
      const idx   = moveIndexRef.current

      if (idx >= FAMOUS_MOVES.length) {
        timeoutRef.current = setTimeout(() => {
          chessRef.current   = new Chess()
          moveIndexRef.current = 0
          setFen(new Chess().fen())
          timeoutRef.current = setTimeout(playNextMove, MOVE_INTERVAL_MS)
        }, PAUSE_AFTER_END_MS)
        return
      }

      try {
        chess.move(FAMOUS_MOVES[idx])
        setFen(chess.fen())
        moveIndexRef.current = idx + 1
      } catch {
        chessRef.current   = new Chess()
        moveIndexRef.current = 0
        setFen(new Chess().fen())
      }
      timeoutRef.current = setTimeout(playNextMove, MOVE_INTERVAL_MS)
    }

    timeoutRef.current = setTimeout(playNextMove, 1200)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  // ── Mobile / tablet: flat board, no transforms, no absolute children ──
  if (isSmall) {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '16px 16px 0',
        background: '#0D1117',
      }}>
        <div style={{ borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <Chessboard
            id="hero-board-mobile"
            position={fen}
            arePiecesDraggable={false}
            boardWidth={boardSize}
            animationDuration={600}
            customDarkSquareStyle={{ backgroundColor: '#4a6741' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            customBoardStyle={{ borderRadius: '6px' }}
          />
        </div>
      </div>
    )
  }

  // ── Desktop: 3D perspective tilt with glows ──
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: '380px', height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(240,165,0,0.18) 0%, rgba(240,165,0,0.06) 50%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Secondary glow */}
      <div style={{
        position: 'absolute',
        width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
        transform: 'translate(60px, 40px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* 3D board */}
      <div style={{
        position: 'relative', zIndex: 1,
        transform: 'perspective(900px) rotateX(28deg) rotateZ(-4deg)',
        transformStyle: 'preserve-3d',
        borderRadius: '4px',
        boxShadow: '0 60px 120px rgba(0,0,0,0.7), 0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,165,0,0.15)',
      }}>
        <Chessboard
          id="hero-board"
          position={fen}
          arePiecesDraggable={false}
          boardWidth={boardSize}
          animationDuration={600}
          customDarkSquareStyle={{ backgroundColor: '#4a6741' }}
          customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          customBoardStyle={{ borderRadius: '4px' }}
        />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          borderRadius: '4px 4px 0 0', pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}