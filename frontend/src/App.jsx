import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import HomePage from './pages/HomePage'
import GameBrowserPage from './pages/GameBrowserPage'
import AnalysisPage from './pages/AnalysisPage'
import { useGameStore } from './store/useGameStore'
import { analyzeChesscomGame, analyzeLichessGame } from './api/analyzeGame'

export default function App() {
  const [page, setPage]                   = useState('home')
  const [browserPlatform, setBrowserPlatform] = useState(null)

  const loadAnalysis = useGameStore((s) => s.loadAnalysis)
  const setLoading   = useGameStore((s) => s.setLoading)
  const setError     = useGameStore((s) => s.setError)

  //source selected on home page
  function handleSelectSource(source, data) {
    if (source === 'chesscom') {
      setBrowserPlatform('chesscom')
      setPage('browser')
    } else if (source === 'lichess') {
      setBrowserPlatform('lichess')
      setPage('browser')
    } else if (source === 'pgn') {
      // PgnUploader handles its own fetch+store update;
      // just navigate to analysis page
      setPage('analysis')
    } else if (source === 'chesscom-url' || source === 'lichess-url') {
      // URL paste — not yet supported
      alert('URL import coming soon. Please use the username browser or PGN upload for now.')
    }
  }

  // game picked from browser
  async function handleAnalyzeGame(game, platform) {
    setLoading()
    setPage('analysis')
    try {
      let result, pgnText

      if (platform === 'chesscom') {
        result = await analyzeChesscomGame(game)
      } else {
        result = await analyzeLichessGame(game)
      }

      // The /analyze/chesscom and /analyze/lichess endpoints return the same
      // shape as /analyze. They don't return raw PGN, so we derive a minimal
      // PGN from the moves array for chess.js to replay positions.
      pgnText = buildPgnFromMoves(result.moves ?? [])
      loadAnalysis(result, pgnText)
    } catch (err) {
      setError(err.message)
    }
  }

  // sidebar navigation 
  function handleSidebarNav(id) {
    if (id === 'home') setPage('home')
    else if (id === 'analysis') setPage('analysis')
  }

  const activeSidebarPage = page === 'browser' ? 'home' : page

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar activePage={activeSidebarPage} onNavigate={handleSidebarNav} />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {page === 'home' && (
          <HomePage onSelectSource={handleSelectSource} />
        )}
        {page === 'browser' && (
          <GameBrowserPage
            platform={browserPlatform}
            onAnalyze={handleAnalyzeGame}
            onBack={() => setPage('home')}
          />
        )}
        {page === 'analysis' && (
          <AnalysisPage onGoHome={() => setPage('home')} />
        )}
      </main>
    </div>
  )
}


function buildPgnFromMoves(moves) {
  if (!moves.length) return ''
  let pgn = ''
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    if (move.side === 'white') pgn += `${move.move_number}. ${move.played_move} `
    else pgn += `${move.played_move} `
  }
  return pgn.trim()
}