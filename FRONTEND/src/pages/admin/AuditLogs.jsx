import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Input, Label } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { api } from '../../services/api'
import { personName, titleCase } from '../../data/apiFormat'

export default function AuditLogs() {
  const [date, setDate] = useState('')
  const [appliedDate, setAppliedDate] = useState('')
  const [logs, setLogs] = useState([])
  useEffect(() => { api.get('/audit', appliedDate ? { from: appliedDate, to: appliedDate } : {}).then((data) => setLogs(data.logs.map((log) => { const time = new Date(log.timestamp); return { ...log, user: personName(log.performedBy), actionLabel: titleCase(log.action), day: time.toLocaleDateString(), time: time.toLocaleTimeString(), remarks: log.note || '-' } }))).catch(() => setLogs([])) }, [appliedDate])
  const columns = [{ key: 'user', header: 'User' }, { key: 'actionLabel', header: 'Action' }, { key: 'day', header: 'Date' }, { key: 'time', header: 'Time' }, { key: 'remarks', header: 'Remarks' }]
  return <div className="space-y-6"><div><h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1><p className="text-sm text-gray-500">Track administrative and uploader actions.</p></div><Card><CardContent className="flex items-end gap-4"><div className="w-44"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><Button onClick={() => setAppliedDate(date)}>Filter</Button><Button variant="secondary" onClick={() => { setDate(''); setAppliedDate('') }}>Reset</Button></CardContent></Card><Card><CardHeader><CardTitle>Activity Log</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={logs} /></CardContent></Card></div>
}
