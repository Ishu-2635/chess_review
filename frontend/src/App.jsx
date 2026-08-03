import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import MobileNavbar from './components/layout/MobileNavbar'
import HomePage from './pages/HomePage'
import GameBrowserPage from './pages/GameBrowserPage'
import AnalysisPage from './pages/AnalysisPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import SavedGamesPage from './pages/SavedGamesPage'
import PlayPage from './pages/PlayPage'
import SaveGameModal from './components/auth/SaveGameModal'
import { useGameStore } from './store/useGameStore'
import { useAuthStore } from './store/useAuthStore'
import { analyzeChesscomGame, analyzeLichessGame } from './api/analyzeGame'
import { saveGame } from './api/savedGames'
import { useBreakpoint } from './hooks/useBreakpoint'

const PAGE_TITLES = {
  home: 'Home', browser: 'Games', analysis: 'Analysis',
  login: 'Sign In', signup: 'Sign Up', 'forgot-password': 'Reset Password',
  'saved-games': 'Saved Games', play: 'Play',
}

// Pages that don't show the sidebar
const AUTH_PAGES = ['login', 'signup', 'forgot-password']

export default function App() {
  const [page, setPage]               = useState('home')
  const [prevPage, setPrevPage]       = useState('home')
  const [browserPlatform, setBrowserPlatform] = useState(null)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const { isSmall } = useBreakpoint()
  const loadAnalysis = useGameStore((s) => s.loadAnalysis)
  const setLoading   = useGameStore((s) => s.setLoading)
  const setError     = useGameStore((s) => s.setError)
  const authLoading  = useAuthStore((s) => s.loading)

  // Show nothing while restoring session
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  function navigateTo(next) {
    setPrevPage(page)
    setPage(next)
  }

  function handleSelectSource(source, data) {
    if (source === 'chesscom') { setBrowserPlatform('chesscom'); navigateTo('browser') }
    else if (source === 'lichess') { setBrowserPlatform('lichess'); navigateTo('browser') }
    else if (source === 'pgn') handlePgnFile(data.file)
    else alert('URL import coming soon.')
  }

  async function handlePgnFile(file) {
    setLoading(); navigateTo('analysis')
    try {
      const { analyzeGame } = await import('./api/analyzeGame')
      const pgnText = await file.text()
      const result  = await analyzeGame(file)
      loadAnalysis(result, pgnText, null)
      setShowSaveModal(true)
    } catch (err) { setError(err.message) }
  }

  async function handleAnalyzeGame(game, platform) {
    setLoading(); navigateTo('analysis')
    try {
      const result = platform === 'chesscom'
        ? await analyzeChesscomGame(game)
        : await analyzeLichessGame(game)
      const pgnText = buildPgnFromMoves(result.moves ?? [])
      const players = {
        white: { name: game.white ?? 'White', elo: null },
        black: { name: game.black ?? 'Black', elo: null },
      }
      loadAnalysis(result, pgnText, players)
      setShowSaveModal(true)
    } catch (err) { setError(err.message) }
  }

  async function handleSaveGame(gameData) {
    await saveGame(gameData)
  }

  function handleAnalysisBack() {
    setPage(prevPage === 'browser' ? 'browser' : 'home')
  }

  function handleSidebarNav(id) {
    setPage(id)
    setDrawerOpen(false)
  }

  const isAuthPage = AUTH_PAGES.includes(page)
  const activeSidebarPage = page === 'browser' ? 'home' : page

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar — hidden on auth pages */}
      {!isAuthPage && !isSmall && (
        <Sidebar activePage={activeSidebarPage} onNavigate={handleSidebarNav} isDrawerMode={false} />
      )}
      {!isAuthPage && isSmall && (
        <Sidebar activePage={activeSidebarPage} onNavigate={handleSidebarNav}
          isDrawerMode={true} drawerOpen={drawerOpen} onCloseDrawer={() => setDrawerOpen(false)} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile navbar — hidden on auth pages */}
        {!isAuthPage && isSmall && (
          <MobileNavbar onOpenSidebar={() => setDrawerOpen(true)} title={PAGE_TITLES[page] || ''} />
        )}

        
        <main
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: isAuthPage ? 'center' : 'flex-start',
            alignItems: isAuthPage ? 'center' : 'stretch',
            paddingTop: isAuthPage ? '25vh' : 0,
            minWidth: 0,
            overflow: page === 'analysis' && !isSmall ? 'hidden' : 'auto',
            position: 'relative',
          }}
        >
          {/* Auth pages */}
          {page === 'login'            && <LoginPage onNavigate={setPage} />}
          {page === 'signup'           && <SignupPage onNavigate={setPage} />}
          {page === 'forgot-password'  && <ForgotPasswordPage onNavigate={setPage} />}

          {/* App pages */}
          {page === 'home'        && <HomePage onSelectSource={handleSelectSource} onNavigate={setPage} />}
          {page === 'saved-games' && <SavedGamesPage onOpenGame={() => navigateTo('analysis')} />}
          {page === 'analysis'    && <AnalysisPage onGoHome={handleAnalysisBack} onShowSave={() => setShowSaveModal(true)} />}
          {page === 'play' && (
            <PlayPage
              onNavigateAnalysis={async (pgn) => {
                setLoading()
                navigateTo('analysis')
                try {
                  // Convert PGN string to a File object so analyzeGame() can send it
                  const blob = new Blob([pgn], { type: 'text/plain' })
                  const file = new File([blob], 'game.pgn', { type: 'text/plain' })
                  const { analyzeGame } = await import('./api/analyzeGame')
                  const result = await analyzeGame(file)
                  loadAnalysis(result, pgn, null)
                  setShowSaveModal(true)
                } catch (err) {
                  setError(err.message)
                }
              }}
            />
          )}

          {/* Browser — kept mounted to preserve game list */}
          <div style={{ display: page === 'browser' ? 'flex' : 'none', flex: 1, minWidth: 0 }}>
            {browserPlatform && (
              <GameBrowserPage platform={browserPlatform} onAnalyze={handleAnalyzeGame} onBack={() => setPage('home')} />
            )}
          </div>
        </main>
      </div>

      {/* Save game modal */}
      {showSaveModal && (
        <SaveGameModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveGame}
        />
      )}
    </div>
  )
}

function buildPgnFromMoves(moves) {
  if (!moves.length) return ''
  return moves.map(m =>
    m.side === 'white' ? `${m.move_number}. ${m.played_move}` : m.played_move
  ).join(' ').trim()
}