import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import TopUpModal from '../components/TopUpModal'
import { useAuth } from '../context/AuthContext'

const ACCEPTED = ['.pdf', '.doc', '.docx', '.txt']
const MAX_MB = 10

function fileValid(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  if (!ACCEPTED.includes(ext)) return 'Only PDF, DOC, DOCX, and TXT files are supported.'
  if (file.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB} MB.`
  return null
}

export default function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [topUpOpen, setTopUpOpen] = useState(false)
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
    if ((user?.creditsRemaining ?? 0) < 1) {
      setError('No credits remaining. Please top up to continue.')
      setTopUpOpen(true)
      return
    }
    setLoading(true)
    setError('')
    navigate('/analyzing', { state: { file, jd } })
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">Resume intelligence</p>
          <h1 className="mb-2 text-3xl font-extrabold text-white sm:text-4xl">Analyze Your Resume</h1>
          <p className="text-slate-400">Upload your resume and get an AI-powered score in seconds.</p>
        </div>

        {(user?.creditsRemaining ?? 0) === 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center text-sm text-yellow-200">
            <span>You have 0 credits remaining.</span>{' '}
            <button className="font-semibold underline underline-offset-4" onClick={() => setTopUpOpen(true)}>
              Top up
            </button>{' '}
            <span>to continue.</span>
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-all sm:p-10 ${
            dragging
              ? 'border-brand-500 bg-brand-500/10'
              : file
              ? 'border-green-500/60 bg-green-500/5'
              : 'border-slate-700 bg-slate-900 hover:border-brand-500/50 hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => e.target.files[0] && selectFile(e.target.files[0])}
          />

          {file ? (
            <>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="break-words font-semibold text-white">{file.name}</p>
              <p className="mt-1 text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="mt-3 text-xs text-slate-500 transition-colors hover:text-red-400"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
                <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="mb-1 font-medium text-white">Drop your resume here</p>
              <p className="text-sm text-slate-500">PDF, DOC, DOCX, TXT - up to {MAX_MB} MB</p>
            </>
          )}
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Job Description{' '}
            <span className="font-normal text-slate-500">(optional - improves match scoring)</span>
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={4}
            placeholder="Paste the job description here..."
            className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Resume - 1 Credit
            </>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          You have <strong className="text-white">{user?.creditsRemaining ?? 0}</strong> credit{user?.creditsRemaining !== 1 ? 's' : ''} remaining.
        </p>
      </main>

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  )
}
