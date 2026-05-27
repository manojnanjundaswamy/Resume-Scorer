import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import TopUpModal from './TopUpModal'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [topUpOpen, setTopUpOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        pathname === to
          ? 'bg-brand-500/20 text-brand-300 font-medium'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/upload" className="flex min-w-0 items-center gap-2 font-bold text-white">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="hidden truncate sm:block">ResumeScore AI</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLink('/upload', 'Analyze')}
          {navLink('/history', 'History')}
        </nav>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
            aria-label="Open credit top up modal"
          >
            <span className="text-yellow-300">Credit</span>
            <span>{user?.creditsRemaining ?? 0}</span>
          </button>

          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.name || 'User avatar'}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {(user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden text-xs text-slate-400 transition-colors hover:text-white sm:block"
          >
            Sign out
          </button>
        </div>
      </div>

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </header>
  )
}
