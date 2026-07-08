import { Chess } from 'chess.js'

export function derivePositions(pgnText) {
  if (!pgnText) throw new Error('No PGN text provided')

  const chess = new Chess()

  // Try standard PGN first
  try {
    chess.loadPgn(pgnText.trim())
    const history = chess.history({ verbose: true })
    if (history.length > 0) {
      return {
        startFen:      new Chess().fen(),
        fensAfterMove: history.map((m) => m.after),
        sans:          history.map((m) => m.san),
      }
    }
  } catch {
    // PGN parse failed — fall through to UCI replay
  }

  // UCI replay: strip move numbers and headers, then play each token
  const tokens = pgnText
    .replace(/\[.*?\]/g, '')          // strip PGN headers
    .replace(/\d+\./g, '')             // strip move numbers (1. 2. etc)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const uciChess = new Chess()
  const fensAfterMove = []
  const sans = []

  for (const token of tokens) {
    if (!token || token === '*') continue
    try {
      const from      = token.slice(0, 2)
      const to        = token.slice(2, 4)
      const promotion = token.length > 4 ? token[4] : undefined
      const move      = uciChess.move({ from, to, promotion })
      if (!move) break
      fensAfterMove.push(uciChess.fen())
      sans.push(move.san)
    } catch {
      break // stop on illegal move
    }
  }

  return { startFen: new Chess().fen(), fensAfterMove, sans }
}

/**
 * Returns the FEN to display for a given currentMoveIndex.
 * currentMoveIndex === -1 → starting position.
 */
export function getFenForIndex(positions, currentMoveIndex) {
  if (!positions) return new Chess().fen()
  if (currentMoveIndex < 0) return positions.startFen
  return positions.fensAfterMove[currentMoveIndex] ?? positions.startFen
}


export function uciToSan(fenBefore, uciMove) {
  if (!fenBefore || !uciMove) return null
  try {
    const chess     = new Chess(fenBefore)
    const from      = uciMove.slice(0, 2)
    const to        = uciMove.slice(2, 4)
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined
    const move      = chess.move({ from, to, promotion })
    return move?.san ?? null
  } catch {
    return null
  }
}