import { useGameStore } from '../../store/useGameStore'
import { CLASSIFICATION_META } from '../../constants/theme'
import { useMemo } from 'react'
import { derivePositions, uciToSan } from '../../lib/chessHelpers'

export default function StatsPanel({ explorer }) {
  const analysis         = useGameStore((s) => s.analysis)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)
  const pgnText          = useGameStore((s) => s.pgnText)
  const currentMove      = analysis?.moves[currentMoveIndex] ?? null

  const positions = useMemo(() => {
    if (!pgnText) return null
    try { return derivePositions(pgnText) } catch { return null }
  }, [pgnText])

  // FEN before the current move — needed to convert top_moves UCI → SAN
  const fenBefore = useMemo(() => {
    if (!positions || currentMoveIndex < 0) return null
    return currentMoveIndex === 0
      ? positions.startFen
      : positions.fensAfterMove[currentMoveIndex - 1]
  }, [positions, currentMoveIndex])

  // FEN after the current move — starting point for explorer
  const fenAfter = useMemo(() => {
    if (!positions || currentMoveIndex < 0) return null
    return positions.fensAfterMove[currentMoveIndex] ?? null
  }, [positions, currentMoveIndex])

  const topMoveSans = useMemo(() => {
    if (!currentMove || !fenBefore) return []
    return (currentMove.top_moves || []).map(uci => ({
      uci,
      san: uciToSan(fenBefore, uci) || uci,
    }))
  }, [currentMove, fenBefore])

  if (!analysis) return null
  const { white, black } = analysis

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px',
      height: '100%', overflowY: 'auto', padding: '16px' }}>

      {/* Explorer status */}
      {explorer.isActive && (
        <div style={{
          padding: '10px 12px', background: 'var(--accent-dim)',
          border: '1px solid var(--accent-glow)', borderRadius: '8px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
            Explore Mode Active
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Drag pieces on the board to try moves. Right-click board or click Exit to return.
          </div>
          <button onClick={explorer.exitExplorer} style={{
            marginTop: '8px', padding: '5px 12px', borderRadius: '6px',
            border: '1px solid #E74C3C44', background: '#E74C3C18',
            color: '#E74C3C', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}>
            Exit Explorer
          </button>
        </div>
      )}

      {/* Current move */}
      {currentMove && (
        <Section title="Current Move">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px', background: 'var(--surface-2)', borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)',
                marginBottom: '2px', textTransform: 'capitalize' }}>
                {currentMove.side}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px',
                  fontWeight: 600, color: 'var(--text)' }}>
                  {currentMove.played_move}
                </span>
                {currentMove.symbol && (
                  <span style={{ fontSize: '16px', color: currentMove.color, fontWeight: 700 }}>
                    {currentMove.symbol}
                  </span>
                )}
              </div>
            </div>
            <ClassificationBadge
              classification={currentMove.classification}
              color={currentMove.color}
            />
          </div>



          {/* Top alternatives */}
          {topMoveSans.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Top Alternatives
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {topMoveSans.map(({ uci, san }, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', background: 'var(--surface-2)',
                    borderRadius: '6px', border: '1px solid var(--border)',
                    transition: 'border-color var(--transition)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px',
                        color: 'var(--text-faint)', minWidth: '14px' }}>{i + 1}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px',
                        fontWeight: i === 0 ? 600 : 400,
                        color: i === 0 ? 'var(--accent)' : 'var(--text)' }}>
                        {san}
                      </span>
                      {i === 0 && (
                        <span style={{ fontSize: '10px', background: 'var(--accent-dim)',
                          color: 'var(--accent)', padding: '1px 6px',
                          borderRadius: '4px', fontWeight: 600 }}>Best</span>
                      )}
                    </div>
                    {/* Explore this move button */}
                    {fenBefore && (
                      <button
                        onClick={() => {
                          // Enter explorer at the position before this move,
                          // then auto-play the alternative move
                          explorer.startFrom(fenBefore)
                          const from = uci.slice(0, 2)
                          const to   = uci.slice(2, 4)
                          const promo = uci.length > 4 ? uci[4] : undefined
                          setTimeout(() => explorer.playMove(from, to, promo), 50)
                        }}
                        title="Explore this move on the board"
                        style={{
                          padding: '3px 8px', borderRadius: '4px',
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--text-muted)', fontSize: '11px',
                          cursor: 'pointer', fontFamily: 'var(--font-ui)',
                          transition: 'all var(--transition)',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                      >
                        Explore →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explore from current position */}
          {fenAfter && !explorer.isActive && (
            <button
              onClick={() => explorer.startFrom(fenAfter)}
              style={{
                marginTop: '10px', width: '100%',
                padding: '7px', borderRadius: '6px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: '13px',
                cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'all var(--transition)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              ⊕ Explore from here
            </button>
          )}
        </Section>
      )}

      {/* Accuracy */}
      <Section title="Accuracy">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <AccuracyCard label="White" accuracy={white.accuracy} totalMoves={white.total_moves} avgCpLoss={white.avg_cp_loss} />
          <AccuracyCard label="Black" accuracy={black.accuracy} totalMoves={black.total_moves} avgCpLoss={black.avg_cp_loss} />
        </div>
      </Section>

      {/* Classification breakdown */}
      <Section title="Move Breakdown">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {Object.entries(CLASSIFICATION_META).map(([key, meta]) => {
            const wCount = white.counts[key] || 0
            const bCount = black.counts[key] || 0
            if (wCount === 0 && bCount === 0) return null
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 8px', borderRadius: '6px', background: 'var(--surface-2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%',
                    background: meta.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{meta.label}</span>
                  {meta.symbol && (
                    <span style={{ fontSize: '11px', color: meta.color, fontWeight: 700 }}>{meta.symbol}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <CountBadge value={wCount} label="W" />
                  <CountBadge value={bCount} label="B" />
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

/* ── Sub-components ── */
function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px',
        display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{title}</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>
      {children}
    </div>
  )
}

function AccuracyCard({ label, accuracy, totalMoves, avgCpLoss }) {
  const pct   = accuracy ?? 0
  const color = pct >= 90 ? '#27AE60' : pct >= 75 ? 'var(--accent)' : '#E74C3C'
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '12px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600,
        color, marginBottom: '4px' }}>
        {pct.toFixed(1)}%
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
        {totalMoves} moves · {avgCpLoss?.toFixed(1)} avg cp
      </div>
    </div>
  )
}

function ClassificationBadge({ classification, color }) {
  return (
    <div style={{ padding: '4px 10px', borderRadius: '20px',
      border: `1px solid ${color}33`, background: `${color}18`,
      fontSize: '12px', fontWeight: 600, color, textTransform: 'capitalize', flexShrink: 0 }}>
      {classification}
    </div>
  )
}

function StatChip({ label, value, accent }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--surface-2)',
      borderRadius: '6px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px',
        fontWeight: 600, color: accent ? '#E74C3C' : 'var(--text)' }}>{value}</div>
    </div>
  )
}

function CountBadge({ value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px',
        fontWeight: 600, color: 'var(--text)', minWidth: '16px', textAlign: 'right' }}>{value}</span>
    </div>
  )
}