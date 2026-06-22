import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatINR } from '../../data/format'
import { submissionRow } from '../../data/apiFormat'
import { api } from '../../services/api'

export default function PendingReports() {
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')
  const load = () => api.get('/admin/pending').then((data) => setReports(data.submissions.map(submissionRow))).catch((error) => setMessage(error.message))
  useEffect(() => { load() }, [])
  const approve = async (id) => { try { await api.patch(`/admin/uploads/${id}/approve`, { comment: 'Approved from dashboard' }); setMessage('Submission approved and report updated.'); load() } catch (error) { setMessage(error.message) } }
  const reject = async (id) => { const reason = window.prompt('Enter rejection reason'); if (!reason) return; try { await api.patch(`/admin/uploads/${id}/reject`, { reason }); setMessage('Submission rejected.'); load() } catch (error) { setMessage(error.message) } }
  const columns = [
    { key: 'date', header: 'Report Date' }, { key: 'division', header: 'Division' },
    { key: 'amount', header: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'uploadedByName', header: 'Uploaded By' },
    { key: 'statusLabel', header: 'Status', render: (r) => <Badge status={r.statusLabel} /> },
    { key: 'actions', header: 'Actions', render: (r) => <div className="flex gap-1.5"><Button size="sm" variant="success" onClick={() => approve(r.id)}><Check size={13} /> Approve</Button><Button size="sm" variant="danger" onClick={() => reject(r.id)}><X size={13} /> Reject</Button></div> },
  ]
  return <div className="space-y-6"><div><h1 className="text-xl font-semibold text-gray-900">Pending Reports</h1><p className="text-sm text-gray-500">Review uploader changes that require approval after publication.</p></div>{message && <p className="text-sm text-primary-700">{message}</p>}<Card><CardHeader><CardTitle>Submissions Awaiting Action ({reports.length})</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={reports} /></CardContent></Card></div>
}
