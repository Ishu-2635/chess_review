import { useState, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

// A curated sequence of moves from a famous game (Immortal Game, Anderssen vs Kieseritzky 1851)
// Loops back to start when finished
const FAMOUS_MOVES = [
  'e4', 'e5', 'f4', 'exf4', 'Bc4', 'Qh4+', 'Kf1', 'b5', 'Bxb5', 'Nf6',
  'Nf3', 'Qh6', 'd3', 'Nh5', 'Nh4', 'Qg5', 'Nf5', 'c6', 'g4', 'Nf6',
  'Rg1', 'cxb5', 'h4', 'Qg6', 'h5', 'Qg5', 'Qf3', 'Ng8', 'Bxf4', 'Qf6',
  'Nc3', 'Bc5', 'Nd5', 'Qxb2', 'Bd6', 'Bxg1', 'e5', 'Qxa1+', 'Ke2', 'Na6',
  'Nxg7+', 'Kd8', 'Qf6+', 'Nxf6', 'Be7#',
]

const MOVE_INTERVAL_MS = 1800  // time between moves
const PAUSE_AFTER_END_MS = 3000 // pause at end before resetting

export default function HeroBoard() {
  const [fen, setFen] = useState(new Chess().fen())
  const chessRef = useRef(new Chess())
  const moveIndexRef = useRef(0)
  const timeoutRef = useRef(null)

  useEffect(() => {
    function playNextMove() {
      const chess = chessRef.current
      const idx = moveIndexRef.current

      if (idx >= FAMOUS_MOVES.length) {
        // Pause then reset
        timeoutRef.current = setTimeout(() => {
          chessRef.current = new Chess()
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
        // illegal move (shouldn't happen) — reset
        chessRef.current = new Chess()
        moveIndexRef.current = 0
        setFen(new Chess().fen())
      }

      timeoutRef.current = setTimeout(playNextMove, MOVE_INTERVAL_MS)
    }

    // Start after a short initial delay
    timeoutRef.current = setTimeout(playNextMove, 1200)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    }}>
      {/* Ambient glow behind the board */}
      <div style={{
        position: 'absolute',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(240,165,0,0.18) 0%, rgba(240,165,0,0.06) 50%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Secondary blue glow for depth */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
        transform: 'translate(60px, 40px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* 3D perspective wrapper */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        transform: 'perspective(900px) rotateX(28deg) rotateZ(-4deg)',
        transformStyle: 'preserve-3d',
        borderRadius: '4px',
        boxShadow: `
          0 60px 120px rgba(0,0,0,0.7),
          0 20px 40px rgba(0,0,0,0.5),
          0 0 0 1px rgba(240,165,0,0.15)
        `,
        transition: 'transform 0.3s ease',
      }}>
        <Chessboard
          id="hero-board"
          position={fen}
          arePiecesDraggable={false}
          boardWidth={400}
          animationDuration={600}
          customDarkSquareStyle={{ backgroundColor: '#4a6741' }}
          customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          customBoardStyle={{
            borderRadius: '4px',
          }}
        />

        {/* Subtle top edge highlight to sell the 3D effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          borderRadius: '4px 4px 0 0',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Reflection / shadow underneath */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        width: '380px',
        height: '40px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
        filter: 'blur(12px)',
        transform: 'perspective(900px) rotateX(28deg)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
    </div>
  )
}