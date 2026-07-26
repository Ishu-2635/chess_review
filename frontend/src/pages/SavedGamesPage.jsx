import { useState, useEffect } from 'react'
import { fetchSavedGames, fetchSavedGame, deleteSavedGame } from '../api/savedGames'
import { useGameStore } from '../store/useGameStore'

export default function SavedGamesPage({ onOpenGame }) {
  const [games, setGames]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSavedGames()
      setGames(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleOpen(game) {
    try {
      const full = await fetchSavedGame(game.id)
      const players = {
        white: { name: full.white ?? 'White', elo: null },
        black: { name: full.black ?? 'Black', elo: null },
      }
      useGameStore.getState().loadAnalysis(full.analysis, full.pgn_text, players)
      onOpenGame()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    setDeleting(id)
    try {
      await deleteSavedGame(id)
      setGames(gs => gs.filter(g => g.id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)',
          marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Saved Games
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Click any game to reload its analysis instantly.
        </p>

        {error && (
          <div style={{
            padding: '10px 14px', background: '#E74C3C18',
            border: '1px solid #E74C3C44', borderRadius: '8px',
            color: '#E74C3C', fontSize: '13px', marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {!loading && games.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--surface)', borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>♟</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              No saved games yet. Analyze a game and save it!
            </p>
          </div>
        )}

        {!loading && games.length > 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            {games.map((game, i) => {
              const whiteAcc = game['analysis->white->accuracy'] ?? game.analysis?.white?.accuracy ?? 0
              const blackAcc = game['analysis->black->accuracy'] ?? game.analysis?.black?.accuracy ?? 0
              const moves    = game['analysis->total_moves']     ?? game.analysis?.total_moves ?? '?'

              return (
                <div key={game.id} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '14px 16px', gap: '16px',
                  borderBottom: i < games.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background var(--transition)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Knight icon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--surface-3)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0,
                  }}>♞</div>

                  {/* Game info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {game.white} vs {game.black}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDate(game.created_at)} · {moves} moves
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                    <AccChip label="W" value={Number(whiteAcc)} />
                    <AccChip label="B" value={Number(blackAcc)} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleOpen(game)}
                      style={{
                        padding: '6px 14px', borderRadius: '6px',
                        border: '1px solid var(--accent)',
                        background: 'var(--accent-dim)', color: 'var(--accent)',
                        fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--font-ui)',
                      }}
                    >
                      Open →
                    </button>
                    <button
                      onClick={() => handleDelete(game.id)}
                      disabled={deleting === game.id}
                      style={{
                        padding: '6px 10px', borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--text-faint)',
                        fontSize: '13px', cursor: 'pointer',
                        fontFamily: 'var(--font-ui)',
                        opacity: deleting === game.id ? 0.5 : 1,
                      }}
                      title="Delete saved game"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function AccChip({ label, value }) {
  const color = value >= 90 ? '#27AE60' : value >= 75 ? 'var(--accent)' : '#E74C3C'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color }}>
        {value ? value.toFixed(1) : '—'}%
      </span>
    </div>
  )
}