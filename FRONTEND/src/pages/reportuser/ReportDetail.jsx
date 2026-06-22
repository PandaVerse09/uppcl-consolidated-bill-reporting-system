import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileDown, FileSpreadsheet, Landmark, CreditCard, Receipt } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatINR } from '../../data/format'
import { api } from '../../services/api'

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [date, division] = decodeURIComponent(id).split(':')
  useEffect(() => { api.get(`/reports/${date}`, { division }).then(({ report: value }) => setReport(value)).catch((err) => setError(err.message)) }, [date, division])
  if (error) return <p className="text-sm text-danger-600">{error}</p>
  if (!report) return <p className="text-sm text-gray-500">Loading report...</p>
  const row = report.divisions[0]
  const download = (type) => api.download(`/reports/${date}/export/${type}?division=${encodeURIComponent(division)}`, `cbs-report-${date}.${type === 'excel' ? 'xlsx' : 'pdf'}`)
  const sections = [{ label: 'Bank ID Amount', value: row.bankAmount, icon: Landmark }, { label: 'Payment Gateway Amount', value: row.gatewayAmount, icon: CreditCard }, { label: 'Billing System Amount', value: row.billingAmount, icon: Receipt }]
  return <div className="space-y-6">
    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-gray-600"><ArrowLeft size={15} /> Back</button>
    <Card><CardHeader className="flex items-center justify-between"><CardTitle>Report for {date}</CardTitle><Badge status="Published" /></CardHeader><CardContent><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><p className="text-xs text-gray-500">Division</p><p className="text-sm font-medium">{division}</p></div><div><p className="text-xs text-gray-500">Report Date</p><p className="text-sm font-medium">{date}</p></div><div><p className="text-xs text-gray-500">Division Total</p><p className="text-sm font-medium">{formatINR(row.total)}</p></div></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Collection Summary</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{sections.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-md border border-surface-border bg-surface-muted p-4"><div className="mb-2 flex items-center gap-2 text-gray-500"><Icon size={16} /><p className="text-xs font-medium">{label}</p></div><p className="text-lg font-semibold">{formatINR(value)}</p></div>)}</div><div className="mt-6 flex items-center justify-between rounded-md bg-primary-700 px-5 py-4 text-white"><p className="text-sm font-medium">Grand Total</p><p className="text-xl font-semibold">{formatINR(row.total)}</p></div><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => download('pdf')}><FileDown size={15} /> Download PDF</Button><Button variant="secondary" onClick={() => download('excel')}><FileSpreadsheet size={15} /> Download Excel</Button></div></CardContent></Card>
  </div>
}
