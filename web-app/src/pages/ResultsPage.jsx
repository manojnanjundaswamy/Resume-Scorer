import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { analysisApi } from '../api/client'

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'object') return Object.values(value).flat()
  return []
}

function getJobUrl(job) {
  return job.searchUrl || job.linkedinUrl || job.indeedUrl || job.glassdoorUrl
}

function ScoreGauge({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0))
  const r = 70, cx = 80, cy = 80
  const circ = Math.PI * r
  const offset = circ - (safeScore / 100) * circ
  const color = safeScore >= 80 ? '#22c55e' : safeScore >= 60 ? '#f59e0b' : '#ef4444'
  const grade = safeScore >= 90 ? 'A' : safeScore >= 80 ? 'B+' : safeScore >= 70 ? 'B' : safeScore >= 60 ? 'C' : 'D'

  return (
    <div className="flex flex-col items-center">
      <svg width={160} height={104} viewBox="0 0 160 104" aria-label={`Overall score ${safeScore}`}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#1e293b" strokeWidth={14} strokeLinecap="round" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={28} fontWeight={700} fill="white">{safeScore}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize={13} fill={color} fontWeight={700}>{grade}</text>
      </svg>
      <p className="mt-1 text-sm text-slate-400">Overall Score</p>
    </div>
  )
}

function CategoryBar({ label, score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0))
  const color = safeScore >= 80 ? 'bg-green-500' : safeScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{safeScore}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${safeScore}%` }} />
      </div>
    </div>
  )
}

function Pill({ label, variant }) {
  const cls = {
    green: 'bg-green-500/15 text-green-300 border border-green-500/30',
    red: 'bg-red-500/15 text-red-300 border border-red-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
  }[variant] ?? 'bg-slate-800 text-slate-300 border border-slate-700'
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${cls}`}>{label}</span>
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-black/10">
      <h3 className="mb-3 font-semibold text-white">{title}</h3>
      {children}
    </section>
  )
}

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active ? 'bg-brand-500/20 text-brand-300' : 'text-slate-400 hover:text-white'}`}
    >
      {label}
    </button>
  )
}

function OverviewTab({ r }) {
  const cats = [
    { label: 'Content Quality', score: r.categoryScores?.content },
    { label: 'ATS Compatibility', score: r.categoryScores?.atsOptimization },
    { label: 'Formatting', score: r.categoryScores?.format },
    { label: 'Experience', score: r.categoryScores?.experience },
    { label: 'Skills Relevance', score: r.categoryScores?.skills },
    { label: 'Education', score: r.categoryScores?.education },
  ].filter(c => c.score !== undefined && c.score !== null)

  const strengths = asArray(r.strengths)
  const weaknesses = asArray(r.weaknesses)
  const keywords = asArray(r.keywords)

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row">
        <ScoreGauge score={r.overallScore} />
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-slate-300">{r.summary || 'No summary available.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.slice(0, 10).map((kw) => <Pill key={kw} label={kw} variant="blue" />)}
          </div>
        </div>
      </div>

      {cats.length > 0 && (
        <Section title="Category Breakdown">
          <div className="space-y-3">
            {cats.map(c => <CategoryBar key={c.label} label={c.label} score={c.score} />)}
          </div>
        </Section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Strengths">
          <ul className="space-y-2">
            {strengths.map((s, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-green-400">+</span>{s}</li>)}
          </ul>
        </Section>
        <Section title="Weaknesses">
          <ul className="space-y-2">
            {weaknesses.map((w, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-red-400">-</span>{w}</li>)}
          </ul>
        </Section>
      </div>
    </div>
  )
}

function ImprovementsTab({ r }) {
  const [filter, setFilter] = useState('all')
  const tips = asArray(r.improvements)
  const filtered = filter === 'all' ? tips : tips.filter(t => t.priority?.toLowerCase() === filter)
  const priorityColor = { high: 'red', medium: 'yellow', low: 'green' }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['all', 'high', 'medium', 'low'].map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${filter === p ? 'border-brand-500/50 bg-brand-500/20 text-brand-300' : 'border-slate-700 text-slate-400 hover:text-white'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No improvements in this category.</p>}

      {filtered.map((tip, i) => {
        const title = tip.title || tip.category || `Improvement ${i + 1}`
        const description = tip.description || tip.suggestion || tip.impact || ''
        return (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-white">{title}</span>
              {tip.priority && <Pill label={tip.priority} variant={priorityColor[tip.priority?.toLowerCase()] ?? 'blue'} />}
            </div>
            {description && <p className="text-sm text-slate-400">{description}</p>}
            {tip.example && (
              <div className="mt-3 rounded-lg bg-slate-800 p-3">
                <p className="mb-1 text-xs text-slate-500">Suggested</p>
                <p className="font-mono text-xs text-green-300">{tip.example}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function JobsTab({ r }) {
  const jobs = asArray(r.jobRecommendations)
  return (
    <div className="space-y-3">
      {jobs.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No job recommendations available.</p>}
      {jobs.map((job, i) => {
        const url = getJobUrl(job)
        return (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white">{job.title}</h4>
                {job.company && <p className="text-sm text-slate-400">{job.company}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.matchScore && <Pill label={`${job.matchScore}% match`} variant="green" />}
                  {job.salary && <Pill label={job.salary} variant="blue" />}
                  {job.location && <Pill label={job.location} variant="yellow" />}
                </div>
                {(job.reason || job.description) && <p className="mt-2 text-xs text-slate-400">{job.reason || job.description}</p>}
                {asArray(job.skills).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {asArray(job.skills).slice(0, 6).map(skill => <Pill key={skill} label={skill} />)}
                  </div>
                )}
              </div>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 rounded-lg border border-brand-500/50 bg-brand-500/20 px-3 py-1.5 text-xs text-brand-300 transition-colors hover:bg-brand-500/30">
                  Search Jobs
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InterviewTab({ r }) {
  const [copied, setCopied] = useState(null)
  const questions = r.interviewQuestions
  const categories = Array.isArray(questions)
    ? Object.entries(questions.reduce((acc, q) => {
        const cat = q.category ?? 'General'
        acc[cat] = [...(acc[cat] ?? []), q]
        return acc
      }, {}))
    : Object.entries(questions ?? {}).map(([cat, qs]) => [cat, asArray(qs).map(q => typeof q === 'string' ? { question: q } : q)])

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="space-y-5">
      {categories.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No interview questions available.</p>}
      {categories.map(([cat, qs]) => (
        <div key={cat}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">{cat}</h4>
          <div className="space-y-2">
            {qs.map((q, i) => {
              const question = q.question || String(q)
              const key = `${cat}-${i}`
              return (
                <div key={key} className="group rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="mb-2 text-sm text-white">{question}</p>
                      {q.tip && <p className="text-xs italic text-slate-500">{q.tip}</p>}
                    </div>
                    <button onClick={() => copy(question, key)} className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 opacity-100 transition hover:bg-slate-700 sm:opacity-0 sm:group-hover:opacity-100">
                      {copied === key ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const TABS = ['Overview', 'Improvements', 'Jobs', 'Interview']

export default function ResultsPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState(location.state?.result ?? null)
  const [tab, setTab] = useState('Overview')
  const [loading, setLoading] = useState(!result)
  const [error, setError] = useState('')

  useEffect(() => {
    if (result) return
    analysisApi.getById(id)
      .then(setResult)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, result])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <p className="mb-4 text-red-400">{error}</p>
      <button onClick={() => navigate('/upload')} className="text-sm text-brand-300 hover:underline">
        Back to Upload
      </button>
    </div>
  )

  if (!result) return null

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link to="/upload" className="text-sm text-slate-400 hover:text-white">New analysis</Link>
          <span className="text-slate-700">|</span>
          <Link to="/history" className="text-sm text-slate-400 hover:text-white">History</Link>
          {result.aiProvider && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">via {result.aiProvider}</span>}
        </div>

        <h1 className="mb-6 text-2xl font-extrabold text-white">Your Resume Analysis</h1>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-900 p-1 scrollbar-hide">
          {TABS.map(t => <TabBtn key={t} label={t} active={tab === t} onClick={() => setTab(t)} />)}
        </div>

        {tab === 'Overview' && <OverviewTab r={result} />}
        {tab === 'Improvements' && <ImprovementsTab r={result} />}
        {tab === 'Jobs' && <JobsTab r={result} />}
        {tab === 'Interview' && <InterviewTab r={result} />}
      </main>
    </div>
  )
}
