import { create } from 'zustand'

/**
 * Central store for the loaded game analysis + navigation state.
 *
 * currentMoveIndex is 0-based into `analysis.moves`. Every component that
 * needs to know "where are we in the game" reads currentMoveIndex from here
 * instead of receiving it as a prop — this is what keeps the board, move
 * list, and eval bar in sync no matter which UI triggered the change.
 */
export const useGameStore = create((set, get) => ({
  // --- state ---
  analysis: null,
  pgnText: null,
  players: null,         // { white: { name, elo }, black: { name, elo } } — overrides PGN headers
  currentMoveIndex: -1,
  status: 'idle',
  errorMessage: null,
  boardOrientation: 'white',

  // --- derived getters (call as get().xyz(), not reactive by themselves) ---
  currentMove: () => {
    const { analysis, currentMoveIndex } = get()
    if (!analysis || currentMoveIndex < 0) return null
    return analysis.moves[currentMoveIndex] ?? null
  },
  isGameLoaded: () => get().analysis !== null,
  totalMoves: () => get().analysis?.moves.length ?? 0,

  // --- actions ---
  loadAnalysis: (analysis, pgnText, players = null) =>
    set({
      analysis,
      pgnText,
      players,
      currentMoveIndex: -1,
      status: 'idle',
      errorMessage: null,
    }),

  setLoading: () => set({ status: 'loading', errorMessage: null }),

  setError: (message) => set({ status: 'error', errorMessage: message }),

  reset: () =>
    set({
      analysis: null,
      pgnText: null,
      players: null,
      currentMoveIndex: -1,
      status: 'idle',
      errorMessage: null,
    }),

  setMove: (index) => {
    const total = get().totalMoves()
    if (total === 0) return
    const clamped = Math.max(-1, Math.min(index, total - 1))
    set({ currentMoveIndex: clamped })
  },

  nextMove: () => {
    const { currentMoveIndex } = get()
    get().setMove(currentMoveIndex + 1)
  },

  prevMove: () => {
    const { currentMoveIndex } = get()
    get().setMove(currentMoveIndex - 1)
  },

  goToStart: () => set({ currentMoveIndex: -1 }),

  goToEnd: () => {
    const total = get().totalMoves()
    set({ currentMoveIndex: total - 1 })
  },

  flipBoard: () =>
    set((state) => ({
      boardOrientation: state.boardOrientation === 'white' ? 'black' : 'white',
    })),
}))