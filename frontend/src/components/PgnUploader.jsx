import { useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { analyzeGame } from '../api/analyzeGame'

export default function PgnUploader() {
  const fileInputRef = useRef(null)
  const status = useGameStore((s) => s.status)
  const errorMessage = useGameStore((s) => s.errorMessage)
  const loadAnalysis = useGameStore((s) => s.loadAnalysis)
  const setLoading = useGameStore((s) => s.setLoading)
  const setError = useGameStore((s) => s.setError)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading()
    try {
      // Read the raw PGN text too — chess.js will need it later to derive
      // a FEN per move for the board. Read alongside the upload, not after,
      // so we don't have to re-read the file a second time.
      const pgnText = await file.text()
      const result = await analyzeGame(file)
      loadAnalysis(result, pgnText)
    } catch (err) {
      setError(err.message)
    } finally {
      // allow re-selecting the same file twice in a row
      event.target.value = ''
    }
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={status === 'loading'}
        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium"
      >
        {status === 'loading' ? 'Analyzing…' : 'Upload PGN'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pgn"
        onChange={handleFileChange}
        className="hidden"
      />
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
