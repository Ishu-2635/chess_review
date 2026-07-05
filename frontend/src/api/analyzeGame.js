const API_BASE_URL = 'http://127.0.0.1:8000'

/**
 * Sends a PGN file to the backend for analysis.
 *
 * @param {File} pgnFile - a File object from an <input type="file"> (must be .pgn, UTF-8)
 * @returns {Promise<object>} the parsed /analyze response body on success
 * @throws {Error} with a human-readable message on any failure (network, 400, 500)
 */
export async function analyzeGame(pgnFile) {
  const formData = new FormData()
  formData.append('pgn_file', pgnFile)

  let response
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    })
  } catch (networkError) {
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. Is it running? (${networkError.message})`
    )
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) detail = body.detail
    } catch {
      // response body wasn't JSON — fall back to the generic message above
    }
    throw new Error(detail)
  }

  return response.json()
}
