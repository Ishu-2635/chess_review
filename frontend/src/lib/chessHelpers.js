import { Chess } from 'chess.js'

/**
 * Replays a full PGN and returns the FEN position after each move,
 * plus the starting position. Uses chess.js v1's verbose history, which
 * already includes `before`/`after` FEN strings per move — no need to
 * manually re-simulate the game.
 *
 * @param {string} pgnText - raw PGN string
 * @returns {{ startFen: string, fensAfterMove: string[], sans: string[] }}
 *   fensAfterMove[i] is the position after analysis.moves[i] was played.
 *   sans[i] is the SAN notation for that same move (e.g. "Nf3").
 */
export function derivePositions(pgnText) {
  const chess = new Chess()
  chess.loadPgn(pgnText)

  const verboseHistory = chess.history({ verbose: true })

  return {
    startFen: new Chess().fen(), // always the standard starting position
    fensAfterMove: verboseHistory.map((move) => move.after),
    sans: verboseHistory.map((move) => move.san),
  }
}

/**
 * Given the board position *before* a move and a UCI move string like
 * "e2e4" or "e7e8q" (promotion), returns its SAN notation (e.g. "e4", "exd5",
 * "e8=Q"). Used to display the backend's `best_move` / `top_moves` (UCI-only)
 * in human-readable form.
 *
 * @param {string} fenBefore - FEN of the position before the move
 * @param {string} uciMove - e.g. "e2e4", "e7e8q"
 * @returns {string|null} SAN string, or null if the move is illegal from that position
 */
export function uciToSan(fenBefore, uciMove) {
  const chess = new Chess(fenBefore)
  const from = uciMove.slice(0, 2)
  const to = uciMove.slice(2, 4)
  const promotion = uciMove.length > 4 ? uciMove[4] : undefined

  try {
    const move = chess.move({ from, to, promotion })
    return move ? move.san : null
  } catch {
    return null
  }
}

/**
 * Resolves the FEN to display on the board for a given store currentMoveIndex.
 * currentMoveIndex === -1 means "starting position, no moves played yet".
 *
 * @param {{ startFen: string, fensAfterMove: string[] }} positions
 * @param {number} currentMoveIndex
 * @returns {string} FEN string
 */
export function getFenForIndex(positions, currentMoveIndex) {
  if (!positions) return new Chess().fen()
  if (currentMoveIndex < 0) return positions.startFen
  return positions.fensAfterMove[currentMoveIndex] ?? positions.startFen
}
