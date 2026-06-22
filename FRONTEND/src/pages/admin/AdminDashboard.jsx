import { useEffect, useState } from 'react'
import { Building2, Wallet, Clock, CheckCircle2, XCircle, Check, X, CalendarCheck } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Label } from '../../components/ui/Input'
import { formatINR } from '../../data/format'
import { submissionRow, dateOnly } from '../../data/apiFormat'
import { api } from '../../services/api'

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([])
  const [reports, setReports] = useState([])
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 10))
  const [message, setMessage] = useState('')
  const load = () => Promise.all([api.get('/uploads'), api.get('/reports')]).then(([uploadData, reportData]) => { setSubmissions(uploadData.submissions.map(submissionRow)); setReports(reportData.reports) }).catch(() => {})
  useEffect(() => { load() }, [])
  const act = async (row, action) => { try { if (action === 'approve') await api.patch(`/admin/uploads/${row.id}/approve`, { comment: 'Approved from dashboard' }); else { const reason = window.prompt('Enter rejection reason'); if (!reason) return; await api.patch(`/admin/uploads/${row.id}/reject`, { reason }) } await load() } catch (error) { window.alert(error.message) } }
  const publish = async () => { if (!publishDate) return setMessage('Select a report date.'); try { const data = await api.post(`/admin/reports/${publishDate}/publish`, {}); setMessage(data.message || 'Report published.'); await load() } catch (error) { setMessage(error.message) } }
  const today = new Date().toISOString().slice(0, 10)
  const todayReport = reports.find((report) => dateOnly(report.date) === today)
  const divisions = new Set(submissions.map((row) => row.division))
  const pending = submissions.filter((row) => row.status === 'pending')
  const columns = [
    { key: 'date', header: 'Date' }, { key: 'division', header: 'Division' }, { key: 'amount', header: 'Amount', render: (r) => formatINR(r.amount) }, { key: 'uploadedByName', header: 'Uploaded By' }, { key: 'statusLabel', header: 'Status', render: (r) => <Badge status={r.statusLabel} /> },
    { key: 'actions', header: 'Actions', render: (r) => <div className="flex gap-1.5"><Button size="sm" variant="success" onClick={() => act(r, 'approve')}><Check size={13} /> Approve</Button><Button size="sm" variant="danger" onClick={() => act(r, 'reject')}><X size={13} /> Reject</Button></div> },
  ]
  return <div className="space-y-6"><div><h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1><p className="text-sm text-gray-500">Overview of consolidated billing across all divisions.</p></div>{message && <p className="text-sm text-primary-700">{message}</p>}<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"><StatCard label="Active Divisions" value={divisions.size} icon={Building2} tone="primary" /><StatCard label="Collections Today" value={formatINR(todayReport?.totals?.grandTotal || 0)} icon={Wallet} tone="primary" /><StatCard label="Pending Approval" value={pending.length} icon={Clock} tone="neutral" /><StatCard label="Approved Submissions" value={submissions.filter((row) => row.status === 'approved').length} icon={CheckCircle2} tone="success" /><StatCard label="Rejected Submissions" value={submissions.filter((row) => row.status === 'rejected').length} icon={XCircle} tone="danger" /></div><Card><CardHeader><CardTitle>Publish Daily Report</CardTitle></CardHeader><CardContent><div className="flex flex-col gap-3 sm:max-w-md sm:flex-row sm:items-end"><div className="flex-1"><Label>Date</Label><Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} /></div><Button onClick={publish}><CalendarCheck size={15} /> Publish</Button></div></CardContent></Card><Card><CardHeader><CardTitle>Pending Reports</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={pending.slice(0, 10)} /></CardContent></Card></div>
}
