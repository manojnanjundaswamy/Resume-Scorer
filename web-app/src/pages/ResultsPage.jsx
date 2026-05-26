import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { analysisApi } from '../api/client'

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreGauge({ score }) {
  const r = 70, cx = 80, cy = 80
  const circ = Math.PI * r  // half-circle
  const offset = circ - (score / 100) * circ

  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' :
                score >= 60 ? 'B'  : score >= 50 ? 'C+' : score >= 40 ? 'C' : 'D'

  return (
    <div className="flex flex-col items-center">
      <svg width={160} height={100} viewBox="0 0 160 100">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#1e293b" strokeWidth={14} strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={28} fontWeight={700} fill="white">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={13} fill={color} fontWeight={600}>{grade}</text>
      </svg>
      <p className="text-slate-400 text-sm mt-1">Overall Score</p>
    </div>
  )
}

function CategoryBar({ label, score }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{score}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function Pill({ label, variant }) {
  const cls = {
    green:  'bg-green-500/15 text-green-300 border border-green-500/30',
    red:    'bg-red-500/15 text-red-300 border border-red-500/30',
    blue:   'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
  }[variant] ?? 'bg-slate-800 text-slate-300'
  return <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
      <h3 className="font-semibold text-white">{title}</h3>
      {children}
    </div>
  )
}

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function OverviewTab({ r }) {
  const cats = [
    { label: 'Content Quality',   score: r.categoryScores?.content },
    { label: 'ATS Compatibility', score: r.categoryScores?.atsOptimization },
    { label: 'Formatting',        score: r.categoryScores?.format },
    { label: 'Experience',        score: r.categoryScores?.experience },
    { label: 'Skills Relevance',  score: r.categoryScores?.skills },
    { label: 'Education',         score: r.categoryScores?.education },
  ].filter(c => c.score !== undefined && c.score !== null)

  return (
    <div className="space-y-4">
      {/* Score + summary */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={r.overallScore ?? 0} />
        <div className="flex-1">
          <p className="text-slate-300 text-sm leading-relaxed">{r.summary}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {r.keywords?.slice(0, 8).map((kw) => (
              <Pill key={kw} label={kw} variant="blue" />
            ))}
          </div>
        </div>
      </div>

      {/* Category scores */}
      {cats.length > 0 && (
        <Section title="Category Breakdown">
          <div className="space-y-3">
            {cats.map(c => <CategoryBar key={c.label} label={c.label} score={c.score} />)}
          </div>
        </Section>
      )}

      {/* Strengths + Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="✅ Strengths">
          <ul className="space-y-2">
            {r.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-green-400 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="⚠️ Weaknesses">
          <ul className="space-y-2">
            {r.weaknesses?.map((w, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-red-400 mt-0.5">•</span> {w}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}

function ImprovementsTab({ r }) {
  const [filter, setFilter] = useState('all')
  const tips = r.improvements ?? []
  const filtered = filter === 'all' ? tips : tips.filter(t => t.priority?.toLowerCase() === filter)

  const PRIORITY_COLOR = { high: 'red', medium: 'yellow', low: 'green' }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'high', 'medium', 'low'].map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${
              filter === p
                ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                : 'border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">No improvements in this category.</p>
      )}

      {filtered.map((tip, i) => (
        <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="font-medium text-white text-sm">{tip.title}</span>
            {tip.priority && (
              <Pill label={tip.priority} variant={PRIORITY_COLOR[tip.priority?.toLowerCase()] ?? 'blue'} />
            )}
          </div>
          <p className="text-slate-400 text-sm">{tip.description}</p>
          {tip.example && (
            <div className="mt-3 p-3 bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Suggested:</p>
              <p className="text-xs text-green-300 font-mono">{tip.example}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function JobsTab({ r }) {
  return (
    <div className="space-y-3">
      {(!r.jobRecommendations || r.jobRecommendations.length === 0) && (
        <p className="text-slate-500 text-sm text-center py-8">No job recommendations available.</p>
      )}
      {r.jobRecommendations?.map((job, i) => (
        <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white">{job.title}</h4>
              {job.company && <p className="text-slate-400 text-sm">{job.company}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {job.matchScore && <Pill label={`${job.matchScore}% match`} variant="green" />}
                {job.salary && <Pill label={job.salary} variant="blue" />}
                {job.location && <Pill label={job.location} variant="yellow" />}
              </div>
              {job.reason && <p className="text-slate-400 text-xs mt-2">{job.reason}</p>}
            </div>
            {job.searchUrl && (
              <a
                href={job.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-3 py-1.5 bg-brand-500/20 border border-brand-500/50 text-brand-400 text-xs rounded-lg hover:bg-brand-500/30 transition-colors"
              >
                Search Jobs ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function InterviewTab({ r }) {
  const [copied, setCopied] = useState(null)

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 1800)
  }

  const categories = r.interviewQuestions
    ? Object.entries(
        r.interviewQuestions.reduce((acc, q) => {
          const cat = q.category ?? 'General'
          acc[cat] = [...(acc[cat] ?? []), q]
          return acc
        }, {})
      )
    : []

  return (
    <div className="space-y-5">
      {categories.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">No interview questions available.</p>
      )}
      {categories.map(([cat, questions]) => (
        <div key={cat}>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{cat}</h4>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white mb-2">{q.question}</p>
                    {q.tip && (
                      <p className="text-xs text-slate-500 italic">{q.tip}</p>
                    )}
                  </div>
                  <button
                    onClick={() => copy(q.question, `${cat}-${i}`)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
                    title="Copy question"
                  >
                    {copied === `${cat}-${i}` ? (
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Improvements', 'Jobs', 'Interview']

export default function ResultsPage() {
  const { id }     = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()
  const [result, setResult] = useState(location.state?.result ?? null)
  const [tab, setTab]       = useState('Overview')
  const [loading, setLoading] = useState(!result)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (result) return
    analysisApi.getById(id)
      .then(setResult)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={() => navigate('/upload')} className="text-brand-400 hover:underline text-sm">
        ← Back to Upload
      </button>
    </div>
  )

  if (!result) return null

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back + heading */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/upload" className="text-slate-400 hover:text-white text-sm">← New analysis</Link>
          <span className="text-slate-700">|</span>
          <Link to="/history" className="text-slate-400 hover:text-white text-sm">History</Link>
          {result.aiProvider && (
            <>
              <span className="text-slate-700">|</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                via {result.aiProvider}
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-6">Your Resume Analysis</h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <TabBtn key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
          ))}
        </div>

        {/* Tab content */}
        {tab === 'Overview'      && <OverviewTab r={result} />}
        {tab === 'Improvements'  && <ImprovementsTab r={result} />}
        {tab === 'Jobs'          && <JobsTab r={result} />}
        {tab === 'Interview'     && <InterviewTab r={result} />}
      </main>
    </div>
  )
}
