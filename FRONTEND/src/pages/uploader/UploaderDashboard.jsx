import { useEffect, useState } from 'react'
import { UploadCloud, Wallet, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatINR } from '../../data/format'
import { dateOnly, submissionRow } from '../../data/apiFormat'
import { api } from '../../services/api'

export default function UploaderDashboard() {
  const [rows, setRows] = useState([])
  useEffect(() => { api.get('/uploads').then((data) => setRows(data.submissions.map(submissionRow))).catch(() => setRows([])) }, [])
  const today = dateOnly(new Date())
  const todayRows = rows.filter((row) => row.date === today)
  const columns = [
    { key: 'date', header: 'Date' }, { key: 'division', header: 'Division' },
    { key: 'amount', header: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'statusLabel', header: 'Status', render: (r) => <Badge status={r.statusLabel} /> },
    { key: 'rejectionReason', header: 'Rejection Reason', render: (r) => <span className="block max-w-72 whitespace-normal">{r.rejectionReason}</span> },
  ]
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-gray-900">Uploader Dashboard</h1><p className="text-sm text-gray-500">Submit division-wise daily transaction data.</p></div><Link to="/uploader/upload"><Button><UploadCloud size={15} /> Upload Data</Button></Link></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Today's Uploads" value={todayRows.length} icon={UploadCloud} tone="primary" />
      <StatCard label="Today's Collection" value={formatINR(todayRows.filter((row) => row.status === 'approved').reduce((sum, row) => sum + row.amount, 0))} icon={Wallet} tone="primary" />
      <StatCard label="Pending Uploads" value={rows.filter((row) => row.status === 'pending').length} icon={Clock} tone="neutral" />
      <StatCard label="Approved Uploads" value={rows.filter((row) => row.status === 'approved').length} icon={CheckCircle2} tone="success" />
      <StatCard label="Rejected Uploads" value={rows.filter((row) => row.status === 'rejected').length} icon={XCircle} tone="danger" />
    </div>
    <Card><CardHeader><CardTitle>Recent Uploads</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={rows.slice(0, 10)} /></CardContent></Card>
  </div>
}
