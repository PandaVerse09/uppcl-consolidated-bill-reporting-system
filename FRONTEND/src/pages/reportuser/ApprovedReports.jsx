import { Eye, FileDown, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { formatINR } from '../../data/format'
import { useReports } from '../../hooks/useReports'
import { api } from '../../services/api'

export default function ApprovedReports() {
  const navigate = useNavigate()
  const { rows, error } = useReports()
  const download = (row, type) => api.download(`/reports/${row.date}/export/${type}?division=${encodeURIComponent(row.division)}`, `cbs-report-${row.date}.${type === 'excel' ? 'xlsx' : 'pdf'}`)
  const columns = [
    { key: 'date', header: 'Date' }, { key: 'division', header: 'Division' },
    { key: 'total', header: 'Division Total', render: (r) => formatINR(r.total) },
    { key: 'actions', header: 'Actions', render: (r) => <div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => navigate(`/reports/${encodeURIComponent(r.id)}`)}><Eye size={13} /> View</Button><Button size="sm" variant="secondary" onClick={() => download(r, 'pdf')}><FileDown size={13} /> PDF</Button><Button size="sm" variant="secondary" onClick={() => download(r, 'excel')}><FileSpreadsheet size={13} /> Excel</Button></div> },
  ]
  return <div className="space-y-6"><div><h1 className="text-xl font-semibold text-gray-900">Approved Reports</h1><p className="text-sm text-gray-500">Consolidated reports generated from approved submissions.</p></div>{error && <p className="text-sm text-danger-600">{error}</p>}<Card><CardHeader><CardTitle>Approved ({rows.length})</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={rows} /></CardContent></Card></div>
}
