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
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
        pathname === to
          ? 'bg-brand-500/20 text-brand-400 font-medium'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/upload" className="flex items-center gap-2 font-bold text-white">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="hidden sm:block">ResumeScore AI</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLink('/upload', 'Analyze')}
          {navLink('/history', 'History')}
        </nav>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          {/* Credit badge */}
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 rounded-full px-3 py-1 transition-colors cursor-pointer"
          >
            <span className="text-yellow-400 text-xs">⚡</span>
            <span className="text-xs font-semibold text-white">{user?.creditsRemaining ?? 0}</span>
          </button>

          {/* Avatar */}
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
              {(user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </header>
  )
}
