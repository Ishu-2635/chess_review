import { useState, useEffect, useRef } from 'react'

/**
 * Returns badge state for rendering over the board.
 * badge: { square: 'e4', symbol: '??', color: '#E74C3C', fading: bool } | null
 */
export function useClassificationBadge(currentMove) {
  const [badge, setBadge] = useState(null)
  const fadeTimer  = useRef(null)
  const clearTimer = useRef(null)
  const prevMoveRef = useRef(null)

  useEffect(() => {
    if (!currentMove) { setBadge(null); return }

    // Only trigger when move actually changes
    const moveKey = `${currentMove.move_number}-${currentMove.side}`
    if (prevMoveRef.current === moveKey) return
    prevMoveRef.current = moveKey

   // Only skip if classification is missing entirely
if (!currentMove.classification) {
  setBadge(null)
  return
}

// For moves with no symbol, use a short label abbreviation
const LABEL_ABBREV = {
  book:      '📖',
  excellent: '✦',
  good:      '✓',
  miss:      '○',
}
    // Destination square is last 2 chars of UCI move e.g. "e2e4" → "e4"
    const square = currentMove.played_move?.slice(2, 4)
    if (!square) return

    // Clear any existing timers
    clearTimeout(fadeTimer.current)
    clearTimeout(clearTimer.current)

    setBadge({
      square,
      symbol: currentMove.symbol || LABEL_ABBREV[currentMove.classification] || '·',
      color:  currentMove.color,
      fading: false,
    })

    // Start fading after 1.4s, remove after fade completes
    fadeTimer.current  = setTimeout(() => setBadge(b => b ? { ...b, fading: true } : null), 1400)
    clearTimer.current = setTimeout(() => setBadge(null), 1800)

    return () => {
      clearTimeout(fadeTimer.current)
      clearTimeout(clearTimer.current)
    }
  }, [currentMove])

  return badge
}