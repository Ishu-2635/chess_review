const API_BASE_URL = 'http://127.0.0.1:8000'

async function apiFetch(path, body) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch (err) {
    throw new Error(`Cannot reach backend: ${err.message}`)
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try { const b = await response.json(); if (b?.detail) detail = b.detail } catch {}
    throw new Error(detail)
  }
  return response.json()
}

/**
 * Ask Stockfish for its move at the given Elo.
 * @param {string} fen   Current position
 * @param {number} elo   Engine strength
 * @returns {{ move, from, to, promotion }}
 */
export async function fetchEngineMove(fen, elo) {
  return apiFetch('/game/move', { fen, elo })
}

/**
 * Ask Stockfish for the best move to display as a hint.
 * @param {string} fen   Current position
 * @param {number} elo   Engine strength
 * @returns {{ move, from, to, promotion }}
 */
export async function fetchHint(fen, elo) {
  return apiFetch('/game/hint', { fen, elo })
}
