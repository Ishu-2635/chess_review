import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import MobileNavbar from './components/layout/MobileNavbar'
import HomePage from './pages/HomePage'
import GameBrowserPage from './pages/GameBrowserPage'
import AnalysisPage from './pages/AnalysisPage'
import { useGameStore } from './store/useGameStore'
import { analyzeChesscomGame, analyzeLichessGame } from './api/analyzeGame'
import { useBreakpoint } from './hooks/useBreakpoint'

const PAGE_TITLES = { home: 'Home', browser: 'Games', analysis: 'Analysis' }

export default function App() {
  const [page, setPage]                       = useState('home')
  const [prevPage, setPrevPage]               = useState('home') // where to go on analysis back
  const [browserPlatform, setBrowserPlatform] = useState(null)
  const [drawerOpen, setDrawerOpen]           = useState(false)

  const { isSmall } = useBreakpoint()

  const loadAnalysis = useGameStore((s) => s.loadAnalysis)
  const setLoading   = useGameStore((s) => s.setLoading)
  const setError     = useGameStore((s) => s.setError)

  function navigateTo(next) {
    setPrevPage(page)
    setPage(next)
  }

  function handleSelectSource(source, data) {
    if (source === 'chesscom') {
      setBrowserPlatform('chesscom'); navigateTo('browser')
    } else if (source === 'lichess') {
      setBrowserPlatform('lichess'); navigateTo('browser')
    } else if (source === 'pgn') {
      handlePgnFile(data.file)
    } else {
      alert('URL import coming soon. Use the username browser or PGN upload for now.')
    }
  }

  async function handlePgnFile(file) {
    setLoading(); navigateTo('analysis')
    try {
      const { analyzeGame } = await import('./api/analyzeGame')
      const pgnText = await file.text()
      const result  = await analyzeGame(file)
      loadAnalysis(result, pgnText, null) // names come from PGN headers
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAnalyzeGame(game, platform) {
    setLoading(); navigateTo('analysis')
    try {
      const result = platform === 'chesscom'
        ? await analyzeChesscomGame(game)
        : await analyzeLichessGame(game)

      // Build a minimal PGN for chess.js position replay
      const pgnText = buildPgnFromMoves(result.moves ?? [])

      // Extract player names directly from the game list object —
      // more reliable than parsing reconstructed PGN headers
      const players = {
        white: { name: game.white ?? 'White', elo: null },
        black: { name: game.black ?? 'Black', elo: null },
      }

      loadAnalysis(result, pgnText, players)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAnalysisBack() {
    // Go back to where we came from (browser or home)
    setPage(prevPage === 'browser' ? 'browser' : 'home')
  }

  function handleSidebarNav(id) {
    if (id === 'home') setPage('home')
    else if (id === 'analysis') setPage('analysis')
    setDrawerOpen(false)
  }

  const activeSidebarPage = page === 'browser' ? 'home' : page

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {!isSmall && (
        <Sidebar activePage={activeSidebarPage} onNavigate={handleSidebarNav} isDrawerMode={false} />
      )}
      {isSmall && (
        <Sidebar
          activePage={activeSidebarPage}
          onNavigate={handleSidebarNav}
          isDrawerMode={true}
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {isSmall && (
          <MobileNavbar onOpenSidebar={() => setDrawerOpen(true)} title={PAGE_TITLES[page] || ''} />
        )}

        <main style={{ flex: 1, display: 'flex', overflow: page === 'analysis' && !isSmall ? 'hidden' : 'auto', minWidth: 0, position: 'relative' }}>

          {/* Home — unmount when not needed */}
          {page === 'home' && (
            <HomePage onSelectSource={handleSelectSource} />
          )}

          {/* Browser — keep mounted so game list is preserved when going to analysis and back */}
          <div style={{ display: page === 'browser' ? 'flex' : 'none', flex: 1, minWidth: 0 }}>
            {browserPlatform && (
              <GameBrowserPage
                platform={browserPlatform}
                onAnalyze={handleAnalyzeGame}
                onBack={() => setPage('home')}
              />
            )}
          </div>

          {/* Analysis */}
          {page === 'analysis' && (
            <AnalysisPage onGoHome={handleAnalysisBack} />
          )}
        </main>
      </div>
    </div>
  )
}

function buildPgnFromMoves(moves) {
  if (!moves.length) return ''
  return moves.map(m =>
    m.side === 'white' ? `${m.move_number}. ${m.played_move}` : m.played_move
  ).join(' ').trim()
}