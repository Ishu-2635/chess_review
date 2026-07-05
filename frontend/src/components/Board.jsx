import { useMemo } from 'react'
import { Chessboard } from 'react-chessboard'
import { useGameStore } from '../store/useGameStore'
import { derivePositions, getFenForIndex } from '../lib/chessHelpers'

export default function Board() {
  const pgnText = useGameStore((s) => s.pgnText)
  const currentMoveIndex = useGameStore((s) => s.currentMoveIndex)
  const boardOrientation = useGameStore((s) => s.boardOrientation)
  const flipBoard = useGameStore((s) => s.flipBoard)

  // Recompute only when a new PGN is loaded, not on every move-index change —
  // replaying the whole game is cheap but there's no reason to redo it
  // just because the user clicked prev/next.
  const positions = useMemo(() => {
    if (!pgnText) return null
    return derivePositions(pgnText)
  }, [pgnText])

  const fen = getFenForIndex(positions, currentMoveIndex)

  if (!pgnText) {
    return (
      <div className="aspect-square w-full max-w-[480px] flex items-center justify-center bg-gray-100 rounded text-gray-400">
        No game loaded
      </div>
    )
  }

  return (
    <div className="w-full max-w-[480px]">
      <Chessboard
        position={fen}
        boardOrientation={boardOrientation}
        arePiecesDraggable={false}
      />
      <button
        onClick={flipBoard}
        className="mt-2 px-3 py-1.5 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
      >
        Flip board
      </button>
    </div>
  )
}
