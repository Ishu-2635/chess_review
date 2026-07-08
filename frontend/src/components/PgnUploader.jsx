import { useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { analyzeGame } from '../api/analyzeGame'

export default function PgnUploader({ label = 'Upload PGN', style = {} }) {
  const fileInputRef = useRef(null)
  const status       = useGameStore((s) => s.status)
  const errorMessage = useGameStore((s) => s.errorMessage)
  const loadAnalysis = useGameStore((s) => s.loadAnalysis)
  const setLoading   = useGameStore((s) => s.setLoading)
  const setError     = useGameStore((s) => s.setError)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading()
    try {
      // Read PGN text first — chess.js needs it to replay positions
      const pgnText = await file.text()
      const result  = await analyzeGame(file)
      loadAnalysis(result, pgnText)
    } catch (err) {
      setError(err.message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div style={style}>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={status === 'loading'}
        style={{
          padding: '8px 20px', borderRadius: '8px', border: 'none',
          background: 'var(--accent)', color: '#000', fontWeight: 600,
          fontSize: '14px', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-ui)', opacity: status === 'loading' ? 0.6 : 1,
          transition: 'opacity var(--transition)',
        }}
      >
        {status === 'loading' ? 'Analyzing…' : label}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pgn"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {status === 'error' && errorMessage && (
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#E74C3C' }}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}