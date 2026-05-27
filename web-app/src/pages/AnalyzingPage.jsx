import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { analysisApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  { id: 1, label: 'Uploading resume',         duration: 1200 },
  { id: 2, label: 'Extracting content',        duration: 1800 },
  { id: 3, label: 'Scoring structure',         duration: 2500 },
  { id: 4, label: 'Evaluating job match',      duration: 2000 },
  { id: 5, label: 'Generating interview prep', duration: 1500 },
  { id: 6, label: 'Finalizing report',         duration: 800  },
]

export default function AnalyzingPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { refreshUser } = useAuth()

  const { file, jd } = location.state ?? {}
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError]             = useState('')
  const hasCalled = useRef(false)

  // Animate through steps while the real API call runs in parallel
  useEffect(() => {
    if (!file) { navigate('/upload', { replace: true }); return }
    if (hasCalled.current) return
    hasCalled.current = true

    let stepIdx = 0
    const advance = () => {
      if (stepIdx < STEPS.length - 1) {
        stepIdx++
        setCurrentStep(stepIdx)
        setTimeout(advance, STEPS[stepIdx].duration)
      }
    }
    setTimeout(advance, STEPS[0].duration)

    // Actual API call
    analysisApi.analyze(file, jd)
      .then(async (result) => {
        await refreshUser()
        navigate(`/results/${result.analysisId}`, { state: { result }, replace: true })
      })
      .catch((err) => {
        setError(err.message || 'Analysis failed. Please try again.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="text-5xl mb-4 text-red-400">!</div>
          <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Animated icon */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border-4 border-brand-500/30 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center">
              <svg className="w-9 h-9 text-brand-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-1">Analyzing Your Resume</h1>
        <p className="text-slate-400 text-sm text-center mb-8">Our AI is running a 3-pass analysis...</p>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const done    = idx < currentStep
            const active  = idx === currentStep
            const pending = idx > currentStep
            return (
              <div key={step.id} className={`flex items-center gap-3 transition-opacity duration-300 ${pending ? 'opacity-30' : 'opacity-100'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done   ? 'bg-green-500'   :
                  active ? 'bg-brand-500'   :
                           'bg-slate-800'
                }`}>
                  {done ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : active ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                  )}
                </div>
                <span className={`text-sm ${done ? 'text-green-400' : active ? 'text-white font-medium' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


