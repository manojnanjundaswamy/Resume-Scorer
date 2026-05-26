import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { analysisApi } from '../api/client'

function gradeColor(grade) {
  if (!grade) return 'text-slate-400'
  if (grade.startsWith('A')) return 'text-green-400'
  if (grade.startsWith('B')) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBar(score) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden w-24">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function HistoryPage() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    analysisApi.getHistory()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-white mb-6">Analysis History</h1>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No analyses yet.</p>
            <Link
              to="/upload"
              className="inline-block px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Analyze your first resume
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/results/${item.id}`}
                className="flex items-center gap-4 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-brand-500/40 p-4 transition-all group"
              >
                {/* Score circle */}
                <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-slate-700 flex flex-col items-center justify-center flex-shrink-0 transition-colors">
                  <span className="text-lg font-bold text-white leading-none">{item.score}</span>
                  <span className={`text-xs font-semibold leading-none mt-0.5 ${gradeColor(item.grade)}`}>
                    {item.grade}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">Resume Analysis</p>
                  <div className="flex items-center gap-2 mt-1">
                    {scoreBar(item.score)}
                    <span className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                  {item.aiProvider && (
                    <span className="text-xs text-slate-600">{item.aiProvider}</span>
                  )}
                </div>

                {/* Arrow */}
                <svg className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
