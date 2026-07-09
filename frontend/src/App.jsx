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
  const [page, setPage]             = useState('home')
  const [browserPlatform, setBrowserPlatform] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { isSmall } = useBreakpoint()

  const loadAnalysis = useGameStore((s) => s.loadAnalysis)
  const setLoading   = useGameStore((s) => s.setLoading)
  const setError     = useGameStore((s) => s.setError)

  function handleSelectSource(source, data) {
    if (source === 'chesscom') {
      setBrowserPlatform('chesscom'); setPage('browser')
    } else if (source === 'lichess') {
      setBrowserPlatform('lichess'); setPage('browser')
    } else if (source === 'pgn') {
      handlePgnFile(data.file)
    } else {
      alert('URL import coming soon. Use username browser or PGN upload for now.')
    }
  }

  async function handlePgnFile(file) {
    setLoading()
    setPage('analysis')
    try {
      const { analyzeGame } = await import('./api/analyzeGame')
      const pgnText = await file.text()
      const result  = await analyzeGame(file)
      loadAnalysis(result, pgnText)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAnalyzeGame(game, platform) {
    setLoading(); setPage('analysis')
    try {
      const result = platform === 'chesscom'
        ? await analyzeChesscomGame(game)
        : await analyzeLichessGame(game)
      const pgnText = buildPgnFromMoves(result.moves ?? [])
      loadAnalysis(result, pgnText)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleSidebarNav(id) {
    if (id === 'home') setPage('home')
    else if (id === 'analysis') setPage('analysis')
    setDrawerOpen(false)
  }

  const activeSidebarPage = page === 'browser' ? 'home' : page

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Desktop sidebar — hidden on small screens via CSS */}
      {!isSmall && (
        <Sidebar
          activePage={activeSidebarPage}
          onNavigate={handleSidebarNav}
          isDrawerMode={false}
        />
      )}

      {/* Mobile/tablet: drawer sidebar */}
      {isSmall && (
        <Sidebar
          activePage={activeSidebarPage}
          onNavigate={handleSidebarNav}
          isDrawerMode={true}
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile top navbar */}
        {isSmall && (
          <MobileNavbar
            onOpenSidebar={() => setDrawerOpen(true)}
            title={PAGE_TITLES[page] || ''}
          />
        )}

        <main style={{ flex: 1, display: 'flex', overflow: page === 'analysis' && !isSmall ? 'hidden' : 'auto', minWidth: 0 }}>
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
    </div>
  )
}

function buildPgnFromMoves(moves) {
  if (!moves.length) return ''
  return moves.map(m =>
    m.side === 'white' ? `${m.move_number}. ${m.played_move}` : m.played_move
  ).join(' ').trim()
}