import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  // On load, if a token is already stored, validate it against /auth/me
  // rather than trusting it blindly.
  useEffect(() => {
    let cancelled = false
    async function restore() {
      if (!api.getToken()) {
        setInitializing(false)
        return
      }
      try {
        const profile = await api.me()
        if (!cancelled) setUser(profile)
      } catch {
        api.setToken(null)
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }
    restore()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email, password) => {
    const { access_token, user: profile } = await api.login({ email, password })
    api.setToken(access_token)
    setUser(profile)
    return profile
  }, [])

  const register = useCallback(async (email, password, username) => {
    const { access_token, user: profile } = await api.register({ email, password, username })
    api.setToken(access_token)
    setUser(profile)
    return profile
  }, [])

  const refreshUser = useCallback(async () => {
    const profile = await api.me()
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    initializing,
    login,
    register,
    logout,
    refreshUser,
  }), [user, initializing, login, register, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
