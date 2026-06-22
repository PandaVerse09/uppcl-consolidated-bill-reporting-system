import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)
const ROLE_LABELS = { admin: 'Admin', uploader: 'Uploader', report_user: 'Report User' }

function normalizeUser(user) {
  return { ...user, username: user.name || user.email, roleLabel: ROLE_LABELS[user.role] }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(({ user: currentUser }) => setUser(normalizeUser(currentUser)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async ({ email, password }) => {
    const { user: currentUser } = await api.post('/auth/login', { email, password })
    const authenticatedUser = normalizeUser(currentUser)
    setUser(authenticatedUser)
    return authenticatedUser
  }

  const register = async ({ name, email, password, role, division }) => {
    const { user: currentUser } = await api.post('/auth/register', { name, email, password, role, division })
    const authenticatedUser = normalizeUser(currentUser)
    setUser(authenticatedUser)
    return authenticatedUser
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout', {})
    } finally {
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
