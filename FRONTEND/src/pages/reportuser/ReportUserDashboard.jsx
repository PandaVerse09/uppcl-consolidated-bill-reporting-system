import { FileCheck2, Wallet, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'
import { useReports } from '../../hooks/useReports'
import { formatINR } from '../../data/format'
import { dateOnly } from '../../data/apiFormat'

export default function ReportUserDashboard() {
  const { reports } = useReports()
  const today = new Date().toISOString().slice(0, 10)
  const todayReport = reports.find((report) => dateOnly(report.date) === today)
  const divisions = new Set(reports.flatMap((report) => report.divisions.map((row) => row.division)))
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-gray-900">Report Dashboard</h1><p className="text-sm text-gray-500">View and download consolidated billing reports.</p></div><Link to="/reports/search"><Button>Search Reports</Button></Link></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard label="Available Reports" value={reports.length} icon={FileCheck2} tone="primary" /><StatCard label="Today's Consolidated Amount" value={formatINR(todayReport?.totals?.grandTotal || 0)} icon={Wallet} tone="success" /><StatCard label="Total Divisions Covered" value={divisions.size} icon={Building2} tone="neutral" /></div></div>
}
