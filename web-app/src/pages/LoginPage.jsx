import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const googleBtnRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1054885293386-2679ksoq0ksra773b2rq7a3k8c7si28h.apps.googleusercontent.com'
    if (!clientId) return

    const initializeGoogle = () => {
      if (!window.google || !window.google.accounts) {
        setTimeout(initializeGoogle, 100)
        return
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            setError('')
            await loginWithGoogle(credential)
            navigate('/upload')
          } catch (e) {
            setError(e.message || 'Google sign-in failed. Please try again.')
          }
        },
      })

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 280,
        })
      }
    }

    initializeGoogle()
  }, [loginWithGoogle, navigate])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo + headline */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/20 mb-4">
          <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">ResumeScore AI</h1>
        <p className="text-slate-400 text-lg">Score your resume. Land your dream job.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
        <h2 className="text-xl font-semibold text-white text-center mb-1">Get started free</h2>
        <p className="text-slate-400 text-sm text-center mb-6">3 free analyses on sign-up. No credit card.</p>

        {/* Google Sign-In */}
        <div className="flex justify-center mb-4">
          <div ref={googleBtnRef} />
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs text-slate-500">
            <span className="bg-slate-900 px-3">or</span>
          </div>
        </div>

        {/* Apple Sign-In placeholder */}
        <button
          onClick={() => setError('Apple Sign-In is available in the mobile app.')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Continue with Apple
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}

        <p className="mt-6 text-xs text-slate-500 text-center">
          By signing in you agree to our{' '}
          <a href="#" className="text-brand-500 hover:underline">Terms</a>
          {' '}and{' '}
          <a href="#" className="text-brand-500 hover:underline">Privacy Policy</a>.
        </p>
      </div>

      {/* Feature bullets */}
      <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm text-center">
        {[
          { icon: '🎯', label: 'AI Score 0–100' },
          { icon: '💡', label: 'Fix Suggestions' },
          { icon: '💼', label: 'Job Matches' },
        ].map(({ icon, label }) => (
          <div key={label} className="text-slate-400">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-xs">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
