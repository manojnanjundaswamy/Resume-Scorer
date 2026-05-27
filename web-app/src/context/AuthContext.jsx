import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, userApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('rs_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('rs_token')
    localStorage.removeItem('rs_user')
    setUser(null)
  }, [])

  // On mount, validate stored JWT by fetching fresh user data
  useEffect(() => {
    const token = localStorage.getItem('rs_token')
    if (!token) { setLoading(false); return }
    userApi.getMe()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [logout])

  const saveSession = useCallback((token, userData) => {
    localStorage.setItem('rs_token', token)
    localStorage.setItem('rs_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const loginWithGoogle = useCallback(async (idToken) => {
    const { token, user: userData } = await authApi.googleLogin(idToken)
    saveSession(token, userData)
    return userData
  }, [saveSession])

  const loginWithApple = useCallback(async (identityToken, fullName) => {
    const { token, user: userData } = await authApi.appleLogin(identityToken, fullName)
    saveSession(token, userData)
    return userData
  }, [saveSession])

  const refreshUser = useCallback(async () => {
    const fresh = await userApi.getMe()
    localStorage.setItem('rs_user', JSON.stringify(fresh))
    setUser(fresh)
    return fresh
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithApple, logout, refreshUser, refreshCredits: refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
