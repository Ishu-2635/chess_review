import { useState, useCallback } from 'react'
import { fetchChesscomGames, fetchLichessGames } from '../api/analyzeGame'
import { useBreakpoint } from '../hooks/useBreakpoint'

const RESULT_COLOR = { Win: '#27AE60', Loss: '#E74C3C', Draw: '#7D8590' }
const SPEED_ICON   = { bullet: '⚡', blitz: '⚡', rapid: '⏱', classical: '♟', daily: '📅', correspondence: '✉' }

export default function GameBrowserPage({ platform, onAnalyze, onBack }) {
  const [username, setUsername]   = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [games, setGames]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [filter, setFilter]       = useState('all')
  const [page, setPage]           = useState(1)
  const [hasMore, setHasMore]     = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)

  const platformLabel = platform === 'chesscom' ? 'Chess.com' : 'Lichess'
  const fetcher = platform === 'chesscom' ? fetchChesscomGames : fetchLichessGames
  const { isMobile, isTablet } = useBreakpoint()
  const isSmall = isMobile || isTablet

  const loadGames = useCallback(async (user, pageNum, resultFilter) => {
    setLoading(true)
    setError(null)
    try {
      const filters = { page: pageNum }
      if (resultFilter && resultFilter !== 'all') filters.result = resultFilter
      const data = await fetcher(user, filters)
      const incoming = data.games ?? []
      setGames(prev => pageNum === 1 ? incoming : [...prev, ...incoming])
      setHasMore(incoming.length >= 10) // backend returns up to 10 per page
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  async function handleSearch(e) {
    e.preventDefault()
    const user = username.trim()
    if (!user) return
    setSubmitted(true)
    setPage(1)
    setGames([])
    await loadGames(user, 1, filter)
  }

  async function handleFilterChange(f) {
    setFilter(f)
    setPage(1)
    setGames([])
    if (submitted) await loadGames(username.trim(), 1, f)
  }

  async function handleLoadMore() {
    const next = page + 1
    setPage(next)
    await loadGames(username.trim(), next, filter)
  }

  async function handleAnalyze(game) {
    setAnalyzingId(game.game_id)
    try {
      await onAnalyze(game, platform)
    } finally {
      setAnalyzingId(null)
    }
  }

  const displayed = filter === 'all'
    ? games
    : games.filter(g => g.result?.toLowerCase() === filter)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '14px', padding: '6px 0',
        }}>
          ← Back
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>
          {platformLabel} Games
        </h1>
      </div>

      {/* Username search */}
      {!submitted ? (
        <div style={{ maxWidth: '480px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '15px' }}>
            Enter your {platformLabel} username to load your recent games.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={`${platformLabel} username…`}
              autoFocus
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text)',
                fontFamily: 'var(--font-ui)', fontSize: '14px', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
            />
            <button type="submit" disabled={loading} style={{
              padding: '10px 20px', background: 'var(--accent)', color: '#000',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              fontFamily: 'var(--font-ui)', fontSize: '14px', cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Loading…' : 'Load Games'}
            </button>
          </form>
          {error && (
            <p style={{ marginTop: '12px', color: '#E74C3C', fontSize: '13px' }}>{error}</p>
          )}
        </div>
      ) : (
        <>
          {/* User info + filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', fontWeight: 700, fontSize: '14px',
              }}>
                {username[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{username}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {loading ? 'Loading…' : `${displayed.length} games`}
                </div>
              </div>
              <button
                onClick={() => { setSubmitted(false); setGames([]); setError(null) }}
                style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                }}
              >
                Change
              </button>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'win', 'loss', 'draw'].map(f => (
                <button key={f} onClick={() => handleFilterChange(f)} style={{
                  padding: '5px 14px', borderRadius: '20px', border: '1px solid',
                  borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                  background: filter === f ? 'var(--accent-dim)' : 'transparent',
                  color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '13px', fontWeight: filter === f ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  textTransform: 'capitalize', transition: 'all var(--transition)',
                }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', background: '#E74C3C18',
              border: '1px solid #E74C3C44', borderRadius: '8px',
              color: '#E74C3C', fontSize: '13px', marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && displayed.length === 0 && !error && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No games found. Try a different filter or username.
            </div>
          )}

          {/* Games list */}
          {displayed.length > 0 && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              {/* Desktop table header — hidden on mobile */}
              {!isSmall && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 100px 80px 120px 130px',
                  padding: '10px 16px', borderBottom: '1px solid var(--border)',
                  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  <span>Opponent</span>
                  <span>Opening</span>
                  <span>Speed</span>
                  <span>Result</span>
                  <span>Date</span>
                  <span></span>
                </div>
              )}

              {displayed.map((game, i) => {
                const hovered   = hoveredId === game.game_id
                const analyzing = analyzingId === game.game_id
                const opponent  = game.white?.toLowerCase() === username.toLowerCase()
                  ? game.black : game.white

                // ── Mobile card ──
                if (isSmall) {
                  return (
                    <div key={game.game_id} style={{
                      padding: '14px 16px',
                      borderBottom: i < displayed.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: hovered ? 'var(--surface-2)' : 'transparent',
                      transition: 'background var(--transition)',
                    }}
                      onMouseEnter={() => setHoveredId(game.game_id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                            vs {opponent}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {game.opening || '—'}
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: RESULT_COLOR[game.result] ?? 'var(--text-muted)', flexShrink: 0, marginLeft: '12px' }}>
                          {game.result}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {SPEED_ICON[game.speed]} {game.time_control} · {game.date}
                        </div>
                        <button
                          onClick={() => handleAnalyze(game)}
                          disabled={!!analyzingId}
                          style={{
                            padding: '5px 14px', borderRadius: '6px',
                            border: '1px solid var(--accent)',
                            background: analyzing ? 'var(--accent-dim)' : 'transparent',
                            color: 'var(--accent)', fontSize: '12px', fontWeight: 600,
                            cursor: analyzingId ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-ui)',
                            opacity: analyzingId && !analyzing ? 0.4 : 1,
                          }}
                        >
                          {analyzing ? 'Analyzing…' : 'Analyze →'}
                        </button>
                      </div>
                    </div>
                  )
                }

                // ── Desktop row ──
                return (
                  <div
                    key={game.game_id}
                    onMouseEnter={() => setHoveredId(game.game_id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 100px 80px 120px 130px',
                      padding: '12px 16px', alignItems: 'center',
                      borderBottom: i < displayed.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: hovered ? 'var(--surface-2)' : 'transparent',
                      transition: 'background var(--transition)',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                      vs {opponent}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
                      {game.opening || '—'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {SPEED_ICON[game.speed] || ''} {game.time_control}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: RESULT_COLOR[game.result] ?? 'var(--text-muted)' }}>
                      {game.result}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {game.date}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleAnalyze(game)}
                        disabled={!!analyzingId}
                        style={{
                          padding: '6px 16px', borderRadius: '6px', border: '1px solid',
                          borderColor: hovered ? 'var(--accent)' : 'var(--border)',
                          background: analyzing ? 'var(--accent-dim)' : hovered ? 'var(--accent-dim)' : 'transparent',
                          color: hovered || analyzing ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: '13px', fontWeight: 500,
                          cursor: analyzingId ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-ui)', transition: 'all var(--transition)',
                          opacity: analyzingId && !analyzing ? 0.4 : 1,
                        }}
                      >
                        {analyzing ? 'Analyzing…' : 'Analyze →'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && displayed.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={handleLoadMore}
                style={{
                  padding: '9px 28px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
                  fontSize: '14px', cursor: 'pointer',
                  transition: 'border-color var(--transition), color var(--transition)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                Load more
              </button>
            </div>
          )}

          {loading && games.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading…
            </div>
          )}
        </>
      )}
    </div>
  )
}