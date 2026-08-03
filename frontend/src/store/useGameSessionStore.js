import { create } from 'zustand'
import { Chess } from 'chess.js'

export const LEVELS = [
  { label: 'Beginner',     elo: 800  },
  { label: 'Intermediate', elo: 1200 },
  { label: 'Club',         elo: 1600 },
  { label: 'Advanced',     elo: 2000 },
  { label: 'Expert',       elo: 2400 },
  { label: 'Master',       elo: 2800 },
]

export const TIME_CONTROLS = [
  { label: '1+0',    seconds: 60,   increment: 0  },
  { label: '3+2',    seconds: 180,  increment: 2  },
  { label: '5+0',    seconds: 300,  increment: 0  },
  { label: '10+0',   seconds: 600,  increment: 0  },
  { label: 'Custom', seconds: null, increment: null },
]

export const STATUS = {
  IDLE:            'idle',
  PLAYING:         'playing',
  ENGINE_THINKING: 'engine_thinking',
  CHECKMATE:       'checkmate',
  STALEMATE:       'stalemate',
  DRAW:            'draw',
  RESIGNED:        'resigned',
  TIMEOUT:         'timeout',
}

export const useGameSessionStore = create((set, get) => ({
  // Config 
  elo:             1200,
  userColor:       'white',
  timeControl:     TIME_CONTROLS[2],
  customTime:      300,
  customIncrement: 0,

  //  Game state 
  status:       STATUS.IDLE,
  chess:        new Chess(),
  currentFen:   new Chess().fen(),
  lastMove:     null,
  hintMove:     null,
  gameResult:   null,
  resultReason: null,

  //  Clock 
  whiteClock:  300,
  blackClock:  300,
  activeColor: 'white',

  // Actions 

  setConfig: (key, value) => set({ [key]: value }),

  startGame: (userColor) => {
    const { timeControl, customTime } = get()
    const isCustom = timeControl.label === 'Custom'
    const totalSecs = isCustom ? customTime : timeControl.seconds
    const chess = new Chess()
    const resolvedColor = userColor === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : userColor

    set({
      status:       STATUS.PLAYING,
      chess,
      currentFen:   chess.fen(),
      lastMove:     null,
      hintMove:     null,
      gameResult:   null,
      resultReason: null,
      userColor:    resolvedColor,
      whiteClock:   totalSecs,
      blackClock:   totalSecs,
      activeColor:  'white',
    })
  },

  applyUserMove: (from, to, promotion) => {
    const { chess, timeControl, customIncrement, activeColor } = get()
    const isCustom  = timeControl.label === 'Custom'
    const increment = isCustom ? customIncrement : timeControl.increment

    // Apply move directly to the existing chess instance.
    // This is the only correct way — preserves full PGN history.
    const move = chess.move({ from, to, promotion: promotion || undefined })
    if (!move) return false

    set((state) => ({
      currentFen:  chess.fen(),
      lastMove:    { from, to },
      hintMove:    null,
      status:      STATUS.ENGINE_THINKING,
      whiteClock:  activeColor === 'white' ? state.whiteClock + increment : state.whiteClock,
      blackClock:  activeColor === 'black' ? state.blackClock + increment : state.blackClock,
      activeColor: activeColor === 'white' ? 'black' : 'white',
    }))
    return true
  },

  applyEngineMove: (from, to, promotion) => {
    const { chess, timeControl, customIncrement, activeColor } = get()
    const isCustom  = timeControl.label === 'Custom'
    const increment = isCustom ? customIncrement : timeControl.increment

    // Same principle — apply directly, never reconstruct from FEN
    const move = chess.move({ from, to, promotion: promotion || 'q' || undefined })
    if (!move) {
      set({ status: STATUS.PLAYING })
      return
    }

    const { status, gameResult, resultReason } = detectGameOver(chess)

    set((state) => ({
      currentFen:   chess.fen(),
      lastMove:     { from, to },
      status:       status ?? STATUS.PLAYING,
      gameResult,
      resultReason,
      whiteClock:   activeColor === 'white' ? state.whiteClock + increment : state.whiteClock,
      blackClock:   activeColor === 'black' ? state.blackClock + increment : state.blackClock,
      activeColor:  activeColor === 'white' ? 'black' : 'white',
    }))
  },

  undoMove: () => {
    const { chess, userColor } = get()
    // chess.undo() twice — engine move then user move
    // chess.js undo() mutates the instance and restores history correctly
    const move1 = chess.undo() // undo engine's last move
    const move2 = chess.undo() // undo user's last move

    if (!move2) {
      // Nothing to undo — put engine move back if it existed
      if (move1) chess.move(move1)
      return
    }

    set({
      currentFen:   chess.fen(),
      lastMove:     null,
      hintMove:     null,
      status:       STATUS.PLAYING,
      gameResult:   null,
      resultReason: null,
      activeColor:  userColor,
    })
  },

  setHint: (hintMove) => {
    set({ hintMove })
    setTimeout(() => set({ hintMove: null }), 2500)
  },

  tickClock: () => {
    const { whiteClock, blackClock, status, userColor, activeColor } = get()

    if (status === STATUS.ENGINE_THINKING) {
      const engineColor = userColor === 'white' ? 'black' : 'white'
      const newWhite = engineColor === 'white' ? Math.max(0, whiteClock - 1) : whiteClock
      const newBlack = engineColor === 'black' ? Math.max(0, blackClock - 1) : blackClock
      set({ whiteClock: newWhite, blackClock: newBlack })
      return
    }

    if (status !== STATUS.PLAYING) return

    const newWhite = activeColor === 'white' ? whiteClock - 1 : whiteClock
    const newBlack = activeColor === 'black' ? blackClock - 1 : blackClock

    if (newWhite <= 0 || newBlack <= 0) {
      const loser = newWhite <= 0 ? 'white' : 'black'
      set({
        status:       STATUS.TIMEOUT,
        gameResult:   loser === userColor ? 'loss' : 'win',
        resultReason: 'timeout',
        whiteClock:   Math.max(0, newWhite),
        blackClock:   Math.max(0, newBlack),
      })
      return
    }

    set({ whiteClock: newWhite, blackClock: newBlack })
  },

  resign: () => {
    set({ status: STATUS.RESIGNED, gameResult: 'loss', resultReason: 'resigned' })
  },

  checkGameOver: () => {
    const { chess } = get()
    const { status, gameResult, resultReason } = detectGameOver(chess)
    if (status) set({ status, gameResult, resultReason })
  },

  resetGame: () => {
    const chess = new Chess()
    set({
      status:       STATUS.IDLE,
      chess,
      currentFen:   chess.fen(),
      lastMove:     null,
      hintMove:     null,
      gameResult:   null,
      resultReason: null,
    })
  },
}))


function detectGameOver(chess) {
  const { userColor } = useGameSessionStore.getState()

  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'black' : 'white'
    return {
      status:       STATUS.CHECKMATE,
      gameResult:   winner === userColor ? 'win' : 'loss',
      resultReason: 'checkmate',
    }
  }
  if (chess.isStalemate()) {
    return { status: STATUS.STALEMATE, gameResult: 'draw', resultReason: 'stalemate' }
  }
  if (chess.isDraw()) {
    const reason = chess.isThreefoldRepetition() ? 'threefold repetition'
      : chess.isInsufficientMaterial()            ? 'insufficient material'
      : 'fifty-move rule'
    return { status: STATUS.DRAW, gameResult: 'draw', resultReason: reason }
  }
  return { status: null, gameResult: null, resultReason: null }
}