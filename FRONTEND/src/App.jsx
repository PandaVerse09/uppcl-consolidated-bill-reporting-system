import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import { MainLayout } from './layouts/MainLayout'
import { RequireRole } from './components/RequireRole'

import AdminDashboard from './pages/admin/AdminDashboard'
import PendingReports from './pages/admin/PendingReports'
import RejectedReports from './pages/admin/RejectedReports'
import AuditLogs from './pages/admin/AuditLogs'
import UserManagement from './pages/admin/UserManagement'

import UploaderDashboard from './pages/uploader/UploaderDashboard'
import UploadForm from './pages/uploader/UploadForm'

import ReportUserDashboard from './pages/reportuser/ReportUserDashboard'
import ReportSearch from './pages/reportuser/ReportSearch'
import ApprovedReports from './pages/reportuser/ApprovedReports'
import ReportDetail from './pages/reportuser/ReportDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireRole allow={['admin']}>
            <MainLayout />
          </RequireRole>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/pending-reports" element={<PendingReports />} />
        <Route path="/admin/rejected-reports" element={<RejectedReports />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/users" element={<UserManagement />} />
      </Route>

      <Route
        element={
          <RequireRole allow={['uploader']}>
            <MainLayout />
          </RequireRole>
        }
      >
        <Route path="/uploader/dashboard" element={<UploaderDashboard />} />
        <Route path="/uploader/upload" element={<UploadForm />} />
      </Route>

      <Route
        element={
          <RequireRole allow={['admin', 'report_user']}>
            <MainLayout />
          </RequireRole>
        }
      >
        <Route path="/reports/dashboard" element={<ReportUserDashboard />} />
        <Route path="/reports/search" element={<ReportSearch />} />
        <Route path="/reports/approved" element={<ApprovedReports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
