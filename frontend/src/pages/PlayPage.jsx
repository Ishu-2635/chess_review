import { useState, useEffect, useRef } from 'react'
import { useGameSessionStore, STATUS, LEVELS } from '../store/useGameSessionStore'
import { fetchHint } from '../api/gameApi'
import GameSetup from '../components/play/GameSetup'
import PlayBoard from '../components/play/PlayBoard'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function PlayPage({ onNavigateAnalysis }) {
  const status    = useGameSessionStore((s) => s.status)
  const elo       = useGameSessionStore((s) => s.elo)
  const userColor = useGameSessionStore((s) => s.userColor)
  const startGame = useGameSessionStore((s) => s.startGame)
  const resetGame = useGameSessionStore((s) => s.resetGame)
  const resign    = useGameSessionStore((s) => s.resign)
  const chess     = useGameSessionStore((s) => s.chess)

  const { isSmall } = useBreakpoint()
  const isIdle    = status === STATUS.IDLE
  const levelLabel = LEVELS.find(l => l.elo === elo)?.label ?? elo

  if (isIdle) return <GameSetup onStart={startGame} />

  return (
    <div style={{
      flex: 1, display: 'flex',
      flexDirection: isSmall ? 'column' : 'row',
      overflow: isSmall ? 'auto' : 'hidden',
      height: isSmall ? 'auto' : '100vh',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: isSmall ? '16px' : '24px',
        gap: '12px', flex: 1,
      }}>
        {/* Game info */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', maxWidth: '520px',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            vs <span style={{ color: 'var(--text)', fontWeight: 600 }}>{levelLabel}</span>
            <span style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginLeft: '6px' }}>({elo})</span>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            You play <span style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>{userColor}</span>
          </span>
        </div>

        {/* Clocks */}
        <GameClocks />

        {/* Board */}
        <PlayBoard />

        {/* Controls */}
        <GameControls onResign={resign} />

        {/* New game */}
        <button onClick={resetGame} style={{
          padding: '7px 20px', borderRadius: '8px',
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
          fontSize: '13px', cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          ← New game
        </button>
      </div>

      {/* Result overlay */}
      <GameResult
        onPlayAgain={resetGame}
        onAnalyze={() => onNavigateAnalysis?.(chess.pgn())}
      />
    </div>
  )
}

/* Clock  */
function GameClocks() {
  const whiteClock  = useGameSessionStore((s) => s.whiteClock)
  const blackClock  = useGameSessionStore((s) => s.blackClock)
  const activeColor = useGameSessionStore((s) => s.activeColor)
  const status      = useGameSessionStore((s) => s.status)
  const userColor   = useGameSessionStore((s) => s.userColor)
  const tickClock   = useGameSessionStore((s) => s.tickClock)
  const tickRef     = useRef(null)

  useEffect(() => {
    if (status === STATUS.PLAYING  || status === STATUS.ENGINE_THINKING) {
      tickRef.current = setInterval(tickClock, 1000)
    } else {
      clearInterval(tickRef.current)
    }
    return () => clearInterval(tickRef.current)
  }, [status, tickClock])

  const engineColor = userColor === 'white' ? 'black' : 'white'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '520px' }}>
      <ClockFace
        seconds={engineColor === 'white' ? whiteClock : blackClock}
        label={`Engine (${engineColor === 'white' ? 'White' : 'Black'})`}
        isActive={activeColor === engineColor && status === STATUS.PLAYING}
      />
      <ClockFace
        seconds={userColor === 'white' ? whiteClock : blackClock}
        label={`You (${userColor === 'white' ? 'White' : 'Black'})`}
        isActive={activeColor === userColor && status === STATUS.PLAYING}
      />
    </div>
  )
}

function ClockFace({ seconds, label, isActive }) {
  const mins   = Math.floor(seconds / 60)
  const secs   = seconds % 60
  const isLow  = seconds <= 10 && seconds > 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderRadius: '10px',
      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
      background: isActive ? 'var(--accent-dim)' : 'var(--surface)',
      transition: 'all 200ms ease',
    }}>
      <span style={{ fontSize: '13px', color: isActive ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isActive ? 600 : 400 }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700,
        color: isLow ? '#E74C3C' : isActive ? 'var(--accent)' : 'var(--text)',
        animation: isLow && isActive ? 'pulse 1s ease-in-out infinite' : 'none',
      }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  )
}

/* Controls  */
function GameControls({ onResign }) {
  const [hinting, setHinting] = useState(false)
  const status      = useGameSessionStore((s) => s.status)
  const userColor   = useGameSessionStore((s) => s.userColor)
  const activeColor = useGameSessionStore((s) => s.activeColor)
  const chess       = useGameSessionStore((s) => s.chess)
  const undoMove    = useGameSessionStore((s) => s.undoMove)
  const setHint     = useGameSessionStore((s) => s.setHint)

  const isUserTurn = status === STATUS.PLAYING && activeColor === userColor
  const canUndo = chess.history().length >= 2 && status === STATUS.PLAYING
  const isGameOver = ![STATUS.PLAYING, STATUS.ENGINE_THINKING, STATUS.IDLE].includes(status)

  async function handleHint() {
    if (!isUserTurn || hinting) return
    setHinting(true)
    try {
      const data = await fetchHint(chess.fen(), elo)
      setHint({ from: data.from, to: data.to })
    } catch (err) {
      console.error('Hint failed:', err.message)
    } finally {
      setHinting(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '520px', flexWrap: 'wrap' }}>
      <ControlBtn onClick={handleHint} disabled={!isUserTurn || hinting || isGameOver} loading={hinting} icon="💡" label="Hint" />
      <ControlBtn onClick={undoMove}   disabled={!canUndo}                              icon="↩"  label="Undo" />
      <ControlBtn onClick={onResign}   disabled={isGameOver || status === STATUS.IDLE}  icon="🏳" label="Resign" danger />
    </div>
  )
}

function ControlBtn({ onClick, disabled, loading, icon, label, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, minWidth: '80px', padding: '9px 12px', borderRadius: '8px',
      border: `1px solid ${danger ? '#E74C3C44' : 'var(--border)'}`,
      background: danger ? '#E74C3C18' : 'var(--surface)',
      color: disabled ? 'var(--text-faint)' : danger ? '#E74C3C' : 'var(--text-muted)',
      fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      transition: 'all var(--transition)',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = danger ? '#E74C3C' : 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = danger ? '#E74C3C44' : 'var(--border)' }}
    >
      {loading
        ? <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
        : <span>{icon}</span>
      }
      {label}
    </button>
  )
}

/*  Result overlay  */
function GameResult({ onPlayAgain, onAnalyze }) {
  const status       = useGameSessionStore((s) => s.status)
  const gameResult   = useGameSessionStore((s) => s.gameResult)
  const resultReason = useGameSessionStore((s) => s.resultReason)
  const elo          = useGameSessionStore((s) => s.elo)

  const isOver = ![STATUS.IDLE, STATUS.PLAYING, STATUS.ENGINE_THINKING].includes(status)
  if (!isOver) return null

  const levelLabel = LEVELS.find(l => l.elo === elo)?.label ?? elo
  const emoji  = gameResult === 'win' ? '🏆' : gameResult === 'loss' ? '💀' : '🤝'
  const title  = gameResult === 'win' ? 'You won!' : gameResult === 'loss' ? 'You lost.' : 'Draw!'
  const color  = gameResult === 'win' ? '#27AE60' : gameResult === 'loss' ? '#E74C3C' : 'var(--text-muted)'
  const reason = resultReason ? resultReason.charAt(0).toUpperCase() + resultReason.slice(1) : ''

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 51, width: '100%', maxWidth: '380px', margin: '0 16px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '36px 32px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{emoji}</div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color, marginBottom: '6px', letterSpacing: '-0.02em' }}>{title}</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>{reason}</p>
        <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '28px' }}>vs {levelLabel} ({elo})</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={onPlayAgain} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-ui)', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
            Play again
          </button>
          <button onClick={onAnalyze} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: '14px', cursor: 'pointer' }}>
            Analyze this game
          </button>
        </div>
      </div>
    </>
  )
}
