import { useEffect, useState } from 'react'
import { Pencil, UploadCloud, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Label } from '../../components/ui/Input'
import { formatINR } from '../../data/format'
import { submissionRow } from '../../data/apiFormat'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { date: '', bankAmount: '', gatewayAmount: '', billingAmount: '' }

export default function UploadForm() {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [uploads, setUploads] = useState([])
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadUploads = () => api.get('/uploads').then((data) => setUploads(data.submissions.map(submissionRow))).catch((error) => setMessage(error.message))
  useEffect(() => { loadUploads() }, [])

  const submit = async () => {
    if (!form.date) return setMessage('Please select a date.')
    try {
      setSubmitting(true)
      const data = editingId ? await api.put(`/uploads/${editingId}`, form) : await api.post('/uploads', form)
      setForm(emptyForm)
      setEditingId('')
      setMessage(data.message || 'Data saved.')
      await loadUploads()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const edit = (row) => {
    setEditingId(row.id)
    setForm({
      date: row.date,
      bankAmount: row.bankAmount,
      gatewayAmount: row.gatewayAmount,
      billingAmount: row.billingAmount,
    })
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingId('')
    setForm(emptyForm)
  }

  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'division', header: 'Division' },
    { key: 'bankAmount', header: 'Bank ID', render: (r) => formatINR(r.bankAmount) },
    { key: 'gatewayAmount', header: 'Gateway', render: (r) => formatINR(r.gatewayAmount) },
    { key: 'billingAmount', header: 'Billing', render: (r) => formatINR(r.billingAmount) },
    { key: 'amount', header: 'Total', render: (r) => formatINR(r.amount) },
    { key: 'statusLabel', header: 'Status', render: (r) => <Badge status={r.statusLabel} /> },
    { key: 'rejectionReason', header: 'Rejection Reason', render: (r) => <span className="block max-w-72 whitespace-normal">{r.rejectionReason}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => r.status !== 'superseded'
        ? <Button size="sm" variant="secondary" onClick={() => edit(r)}><Pencil size={13} /> Edit</Button>
        : '-',
    },
  ]

  return <div className="space-y-6">
    <div><h1 className="text-xl font-semibold text-gray-900">Upload Daily Transaction Data</h1><p className="text-sm text-gray-500">Submit source totals for {user?.division}.</p></div>
    {message && <div className="rounded-md border border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-700">{message}</div>}
    <Card><CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader><CardContent>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        {[['bankAmount', 'Bank ID Amount'], ['gatewayAmount', 'Payment Gateway Amount'], ['billingAmount', 'Billing System Amount']].map(([key, label]) => <div key={key}><Label>{label}</Label><Input type="number" min="0" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>)}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        {editingId && <Button variant="secondary" onClick={cancelEdit}><X size={15} /> Cancel</Button>}
        <Button onClick={submit} disabled={submitting}><UploadCloud size={15} /> {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Save Data'}</Button>
      </div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Recent Uploads</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={uploads} /></CardContent></Card>
  </div>
}
