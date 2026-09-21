import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try { const data = await apiFetch('/auth/me'); setUser(data.user || null); return data.user }
    catch { setUser(null); return null }
  }

  const login = async (credentials) => { const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); setUser(data.user); return data.user }
  const logout = async () => { await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null) }

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('reliefgrid:unauthorized', handleUnauthorized)
    refreshUser().finally(() => setIsLoading(false))
    return () => window.removeEventListener('reliefgrid:unauthorized', handleUnauthorized)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: Boolean(user), setUser, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
