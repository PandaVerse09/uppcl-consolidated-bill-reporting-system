import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  Search,
  ScrollText,
  Users,
  ClipboardList,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/pending-reports', label: 'Pending Reports', icon: ClipboardList },
    { to: '/admin/rejected-reports', label: 'Rejected Reports', icon: XCircle },
    { to: '/reports/search', label: 'Search Reports', icon: Search },
    { to: '/reports/approved', label: 'Approved Reports', icon: FileCheck2 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/users', label: 'User Management', icon: Users },
  ],
  uploader: [
    { to: '/uploader/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/uploader/upload', label: 'Upload Data', icon: UploadCloud },
  ],
  report_user: [
    { to: '/reports/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports/search', label: 'Search Reports', icon: Search },
    { to: '/reports/approved', label: 'Approved Reports', icon: FileCheck2 },
  ],
}

export function Sidebar() {
  const { user } = useAuth()
  const items = NAV_BY_ROLE[user?.role] || []

  return (
    <aside className="hidden w-60 shrink-0 border-r border-surface-border bg-white md:block">
      <nav className="flex flex-col gap-1 p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-surface-muted hover:text-gray-800'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
