import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { formatINR } from '../../data/format'
import { submissionRow } from '../../data/apiFormat'
import { api } from '../../services/api'

export default function RejectedReports() {
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')

  const load = () => api.get('/uploads', { status: 'rejected' })
    .then((data) => {
      setReports(data.submissions.map(submissionRow))
      setMessage('')
    })
    .catch((error) => setMessage(error.message))

  useEffect(() => { load() }, [])

  const columns = [
    { key: 'date', header: 'Report Date' },
    { key: 'division', header: 'Division' },
    { key: 'bankAmount', header: 'Bank ID', render: (row) => formatINR(row.bankAmount) },
    { key: 'gatewayAmount', header: 'Gateway', render: (row) => formatINR(row.gatewayAmount) },
    { key: 'billingAmount', header: 'Billing', render: (row) => formatINR(row.billingAmount) },
    { key: 'amount', header: 'Total', render: (row) => formatINR(row.amount) },
    { key: 'uploadedByName', header: 'Uploaded By' },
    { key: 'reviewedByName', header: 'Rejected By' },
    { key: 'rejectionReason', header: 'Reason', render: (row) => <span className="block max-w-72 whitespace-normal">{row.rejectionReason}</span> },
    { key: 'statusLabel', header: 'Status', render: (row) => <Badge status={row.statusLabel} /> },
  ]

  return <div className="space-y-6">
    <div><h1 className="text-xl font-semibold text-gray-900">Rejected Reports</h1><p className="text-sm text-gray-500">Submissions rejected during administrative review.</p></div>
    {message && <p className="text-sm text-danger-600">{message}</p>}
    <Card><CardHeader><CardTitle>Rejected ({reports.length})</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={reports} /></CardContent></Card>
  </div>
}
