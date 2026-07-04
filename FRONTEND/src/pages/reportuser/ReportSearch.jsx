import { useState } from 'react'
import { Eye, FileDown, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select } from '../../components/ui/Input'
import { DIVISIONS, SOURCES } from '../../data/constants'
import { formatINR } from '../../data/format'
import { useReports } from '../../hooks/useReports'
import { api } from '../../services/api'

export default function ReportSearch() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ date: '', division: '', source: '' })
  const [applied, setApplied] = useState({})
  const { rows, error } = useReports(applied.date ? { from: applied.date, to: applied.date, division: applied.division } : { division: applied.division })
  const results = rows.filter((row) => !applied.source || ({ 'Bank ID': row.bankId, 'Payment Gateway': row.gateway, 'Billing System': row.billing })[applied.source] > 0)
  const download = (row, type) => api.download(`/reports/${row.date}/export/${type}${row.division ? `?division=${encodeURIComponent(row.division)}` : ''}`, `drmp-report-${row.date}.${type === 'excel' ? 'xlsx' : 'pdf'}`)
  const columns = [
    { key: 'date', header: 'Date' }, { key: 'division', header: 'Division' },
    { key: 'bankId', header: 'Bank ID', render: (r) => formatINR(r.bankId) },
    { key: 'gateway', header: 'Gateway', render: (r) => formatINR(r.gateway) },
    { key: 'billing', header: 'Billing', render: (r) => formatINR(r.billing) },
    { key: 'total', header: 'Total', render: (r) => <span className="font-semibold">{formatINR(r.total)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'actions', header: 'Actions', render: (r) => <div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => navigate(`/reports/${encodeURIComponent(r.id)}`)}><Eye size={13} /> View</Button><Button size="sm" variant="secondary" onClick={() => download(r, 'pdf')}><FileDown size={13} /> PDF</Button><Button size="sm" variant="secondary" onClick={() => download(r, 'excel')}><FileSpreadsheet size={13} /> Excel</Button></div> },
  ]
  return <div className="space-y-6">
    <div><h1 className="text-xl font-semibold text-gray-900">Search Reports</h1><p className="text-sm text-gray-500">Filter approved consolidated reports.</p></div>
    {error && <p className="text-sm text-danger-600">{error}</p>}
    <Card><CardContent className="flex flex-wrap items-end gap-4">
      <div className="w-44"><Label>Date</Label><Input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} /></div>
      <div className="w-52"><Label>Division</Label><Select value={filters.division} onChange={(e) => setFilters({ ...filters, division: e.target.value })}><option value="">All Divisions</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</Select></div>
      <div className="w-52"><Label>Source</Label><Select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}><option value="">All Sources</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></div>
      <Button onClick={() => setApplied(filters)}>Search</Button><Button variant="secondary" onClick={() => { setFilters({ date: '', division: '', source: '' }); setApplied({}) }}>Reset</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Results ({results.length})</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={results} /></CardContent></Card>
  </div>
}
