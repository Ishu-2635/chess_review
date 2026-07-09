import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'

/**
 * Manages a "explore from here" branch off the current board position.
 *
 * Usage:
 *   const explorer = useMoveExplorer()
 *   explorer.startFrom(fenBefore)        // enter explore mode
 *   explorer.playMove('e2', 'e4')        // play a move in the branch
 *   explorer.exitExplorer()              // snap back to game
 *
 * While active: explorer.fen gives the current explore position.
 * explorer.isActive tells Board to show explore fen instead of game fen.
 */
export function useMoveExplorer() {
  const [state, setState] = useState(null)
  // state: { chess: Chess instance, history: [{san, fen}] } | null

  const startFrom = useCallback((fen) => {
    const chess = new Chess(fen)
    setState({ chess, history: [] })
  }, [])

  const playMove = useCallback((from, to, promotion) => {
    setState(prev => {
      if (!prev) return prev
      const chess = new Chess(prev.chess.fen())
      try {
        const move = chess.move({ from, to, promotion: promotion || undefined })
        if (!move) return prev
        return {
          chess,
          history: [...prev.history, { san: move.san, fen: chess.fen() }],
        }
      } catch {
        return prev
      }
    })
  }, [])

  const stepBack = useCallback(() => {
    setState(prev => {
      if (!prev || prev.history.length === 0) return null
      const newHistory = prev.history.slice(0, -1)
      const prevFen = newHistory.length > 0
        ? newHistory[newHistory.length - 1].fen
        : null
      const chess = new Chess(prevFen || undefined)
      // If we popped back to empty history, chess is at startFrom fen
      // We need to track the starting fen separately
      return { chess, history: newHistory, startFen: prev.startFen }
    })
  }, [])

  const exitExplorer = useCallback(() => setState(null), [])

  return {
    isActive:    !!state,
    fen:         state?.chess.fen() ?? null,
    history:     state?.history ?? [],
    startFrom,
    playMove,
    stepBack,
    exitExplorer,
  }
}