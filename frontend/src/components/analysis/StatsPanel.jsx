import { useGameStore } from '../../store/useGameStore'
import { CLASSIFICATION_META } from '../../constants/theme'
import { useMemo } from 'react'
import { derivePositions, uciToSan } from '../../lib/chessHelpers'

export default function StatsPanel() {
  const analysis = useGameStore((s) => s.analysis)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)
  const pgnText = useGameStore((s) => s.pgnText)

  const currentMove = analysis?.moves[currentMoveIndex] ?? null

  const positions = useMemo(() => {
    if (!pgnText) return null
    try { return derivePositions(pgnText) } catch { return null }
  }, [pgnText])

  // Convert top_moves (UCI) to SAN for display
  const topMoveSans = useMemo(() => {
    if (!currentMove || !positions || currentMoveIndex < 0) return []
    const fenBefore = currentMoveIndex === 0
      ? positions.startFen
      : positions.fensAfterMove[currentMoveIndex - 1]
    return (currentMove.top_moves || []).map(uci => uciToSan(fenBefore, uci) || uci)
  }, [currentMove, positions, currentMoveIndex])

  if (!analysis) return null

  const { white, black } = analysis

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: '100%',
      overflowY: 'auto',
      padding: '16px',
    }}>
      {/* Current move info */}
      {currentMove && (
        <Section title="Current Move">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px', background: 'var(--surface-2)', borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'capitalize' }}>
                {currentMove.side}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '18px',
                  fontWeight: 600, color: 'var(--text)',
                }}>
                  {currentMove.played_move}
                </span>
                {currentMove.symbol && (
                  <span style={{ fontSize: '16px', color: currentMove.color, fontWeight: 700 }}>
                    {currentMove.symbol}
                  </span>
                )}
              </div>
            </div>
            <ClassificationBadge classification={currentMove.classification} color={currentMove.color} />
          </div>

          {/* Eval delta */}
          {currentMove.classification !== 'book' && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '8px', marginTop: '8px',
            }}>
              <StatChip label="CP Loss" value={`-${currentMove.centipawn_loss}`} accent={currentMove.centipawn_loss > 50} />
              <StatChip
                label="Win Prob Δ"
                value={`${(currentMove.wp_delta * 100).toFixed(1)}%`}
                accent={currentMove.wp_delta < -0.05}
              />
            </div>
          )}

          {/* Top alternatives */}
          {topMoveSans.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Top Alternatives
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {topMoveSans.map((san, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', background: 'var(--surface-2)',
                    borderRadius: '6px', border: '1px solid var(--border)',
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
                  </div>
                ))}
              </div>
            </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(CLASSIFICATION_META).map(([key, meta]) => {
            const wCount = white.counts[key] || 0
            const bCount = black.counts[key] || 0
            if (wCount === 0 && bCount === 0) return null
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '8px',
                padding: '5px 8px', borderRadius: '6px',
                background: 'var(--surface-2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: meta.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{meta.label}</span>
                  {meta.symbol && (
                    <span style={{ fontSize: '12px', color: meta.color, fontWeight: 700 }}>{meta.symbol}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <CountBadge value={wCount} color="var(--text-muted)" label="W" />
                  <CountBadge value={bCount} color="var(--text-muted)" label="B" />
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span>{title}</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>
      {children}
    </div>
  )
}

function AccuracyCard({ label, accuracy, totalMoves, avgCpLoss }) {
  const pct = accuracy ?? 0
  const color = pct >= 90 ? '#27AE60' : pct >= 75 ? 'var(--accent)' : '#E74C3C'

  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '12px',
    }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, color, marginBottom: '4px' }}>
        {pct.toFixed(1)}%
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
        {totalMoves} moves · {avgCpLoss?.toFixed(1)} avg cp loss
      </div>
    </div>
  )
}

function ClassificationBadge({ classification, color }) {
  return (
    <div style={{
      padding: '4px 10px', borderRadius: '20px',
      border: `1px solid ${color}33`,
      background: `${color}18`,
      fontSize: '12px', fontWeight: 600,
      color, textTransform: 'capitalize', flexShrink: 0,
    }}>
      {classification}
    </div>
  )
}

function StatChip({ label, value, accent }) {
  return (
    <div style={{
      padding: '8px 10px', background: 'var(--surface-2)',
      borderRadius: '6px', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '14px',
        fontWeight: 600, color: accent ? '#E74C3C' : 'var(--text)',
      }}>{value}</div>
    </div>
  )
}

function CountBadge({ value, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px',
        fontWeight: 600, color: 'var(--text)', minWidth: '16px', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}