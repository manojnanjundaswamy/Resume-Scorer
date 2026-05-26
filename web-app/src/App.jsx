import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage      from './pages/LoginPage'
import UploadPage     from './pages/UploadPage'
import AnalyzingPage  from './pages/AnalyzingPage'
import ResultsPage    from './pages/ResultsPage'
import HistoryPage    from './pages/HistoryPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  return user ? children : <Navigate to="/login" replace />
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  return user ? <Navigate to="/upload" replace /> : children
}

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
          <Route path="/analyzing" element={<PrivateRoute><AnalyzingPage /></PrivateRoute>} />
          <Route path="/results/:id" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
