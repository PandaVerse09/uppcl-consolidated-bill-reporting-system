import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireRole({ allow, children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allow && !allow.includes(user.role)) return <Navigate to="/login" replace />

  return children
}
