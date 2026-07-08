const API_BASE_URL = 'http://127.0.0.1:8000'

//shared fetch helper

async function apiFetch(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch (networkError) {
    throw new Error(
      `Cannot reach the backend at ${API_BASE_URL}. Is it running? (${networkError.message})`
    )
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) detail = body.detail
    } catch { /* non-JSON error body — keep generic message */ }
    throw new Error(detail)
  }

  return response.json()
}

// POST /analyze
// Accepts a .pgn File object, returns the full analysis response.

export async function analyzeGame(pgnFile) {
  const formData = new FormData()
  formData.append('pgn_file', pgnFile)
  return apiFetch('/analyze', { method: 'POST', body: formData })
}

// GET /games/chesscom/{username} 

export async function fetchChesscomGames(username, filters = {}) {
  const params = new URLSearchParams()
  if (filters.page)   params.set('page',   filters.page)
  if (filters.result) params.set('result', filters.result)
  if (filters.speed)  params.set('speed',  filters.speed)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/games/chesscom/${encodeURIComponent(username)}${qs}`)
}

// GET /games/lichess/{username}
// Returns paginated list of Lichess games for a username.

export async function fetchLichessGames(username, filters = {}) {
  const params = new URLSearchParams()
  if (filters.page)   params.set('page',   filters.page)
  if (filters.result) params.set('result', filters.result)
  if (filters.speed)  params.set('speed',  filters.speed)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/games/lichess/${encodeURIComponent(username)}${qs}`)
}

// POST /analyze/chesscom 
// game: { game_id, source_url } — pass the game object from fetchChesscomGames directly.

export async function analyzeChesscomGame(game) {
  return apiFetch('/analyze/chesscom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game_id:    game.game_id,
      source_url: game.source_url,
    }),
  })
}

// POST /analyze/lichess
// game: { source_url } — pass the game object from fetchLichessGames directly.

export async function analyzeLichessGame(game) {
  return apiFetch('/analyze/lichess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_url: game.source_url,
    }),
  })
}