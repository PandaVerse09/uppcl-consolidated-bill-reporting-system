import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-white px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-700 text-sm font-bold text-white">
          DRMP
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            Daily Revenue Monitoring Portal
          </p>
          <p className="text-xs text-gray-500 leading-tight">
            Uttar Pradesh Power Corporation Limited
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
          {user?.roleLabel}
        </span>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
              <UserIcon size={16} />
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">
              {user?.username}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-md border border-surface-border bg-white py-1 shadow-card z-20">
              <div className="px-3 py-2 border-b border-surface-border">
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
