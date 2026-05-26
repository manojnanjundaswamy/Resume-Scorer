import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { analysisApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const ACCEPTED = ['.pdf', '.doc', '.docx']
const MAX_MB = 10

function fileValid(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  if (!ACCEPTED.includes(ext)) return 'Only PDF, DOC, and DOCX files are supported.'
  if (file.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB} MB.`
  return null
}

export default function UploadPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [file, setFile]           = useState(null)
  const [jd, setJd]               = useState('')
  const [dragging, setDragging]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const fileInputRef = useRef(null)

  const selectFile = useCallback((f) => {
    setError('')
    const err = fileValid(f)
    if (err) { setError(err); return }
    setFile(f)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) selectFile(f)
  }, [selectFile])

  const handleSubmit = async () => {
    if (!file) { setError('Please select a resume file.'); return }
    if (user?.creditsRemaining < 1) {
      setError('No credits remaining. Please top up to continue.')
      return
    }
    setLoading(true)
    setError('')

    // Navigate immediately to the analyzing page, pass file via state
    navigate('/analyzing', { state: { file, jd } })
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white mb-2">Analyze Your Resume</h1>
          <p className="text-slate-400">Upload your resume and get an AI-powered score in seconds.</p>
        </div>

        {/* Credits warning */}
        {user?.creditsRemaining === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm text-center">
            ⚡ You have 0 credits remaining.{' '}
            <button className="underline font-medium" onClick={() => {}}>Top up</button> to continue.
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 text-center ${
            dragging
              ? 'border-brand-500 bg-brand-500/10'
              : file
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-slate-700 bg-slate-900 hover:border-brand-500/50 hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => e.target.files[0] && selectFile(e.target.files[0])}
          />

          {file ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-white">{file.name}</p>
              <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="mt-3 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="font-medium text-white mb-1">Drop your resume here</p>
              <p className="text-sm text-slate-500">PDF, DOC, DOCX — up to {MAX_MB} MB</p>
            </>
          )}
        </div>

        {/* Optional JD */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Job Description{' '}
            <span className="text-slate-500 font-normal">(optional — improves match scoring)</span>
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={4}
            placeholder="Paste the job description here..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500 resize-none transition-colors"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="mt-6 w-full py-3.5 rounded-xl font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Resume — 1 Credit
            </>
          )}
        </button>

        <p className="mt-3 text-xs text-slate-500 text-center">
          You have <strong className="text-white">{user?.creditsRemaining ?? 0}</strong> credit{user?.creditsRemaining !== 1 ? 's' : ''} remaining.
        </p>
      </main>
    </div>
  )
}
