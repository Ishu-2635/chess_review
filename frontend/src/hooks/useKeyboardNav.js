import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

export function useKeyboardNav() {
  const isGameLoaded = useGameStore((s) => s.isGameLoaded())
  const nextMove = useGameStore((s) => s.nextMove)
  const prevMove = useGameStore((s) => s.prevMove)
  const goToStart = useGameStore((s) => s.goToStart)
  const goToEnd = useGameStore((s) => s.goToEnd)

  useEffect(() => {
    if (!isGameLoaded) return

    function handleKey(e) {
      // Don't steal keypresses when user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case 'ArrowRight':
        case 'l':
          e.preventDefault()
          nextMove()
          break
        case 'ArrowLeft':
        case 'h':
          e.preventDefault()
          prevMove()
          break
        case 'ArrowUp':
        case 'Home':
          e.preventDefault()
          goToStart()
          break
        case 'ArrowDown':
        case 'End':
          e.preventDefault()
          goToEnd()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isGameLoaded, nextMove, prevMove, goToStart, goToEnd])
}