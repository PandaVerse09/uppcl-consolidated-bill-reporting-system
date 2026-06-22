import { useEffect, useState } from 'react'
import { UserPlus, Power, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select } from '../../components/ui/Input'
import { DIVISIONS } from '../../data/constants'
import { api } from '../../services/api'
import { titleCase } from '../../data/apiFormat'

const emptyForm = { name: '', email: '', password: '', role: 'uploader', division: DIVISIONS[0] }
export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const load = () => api.get('/users').then((data) => setUsers(data.users.map((user) => ({ ...user, roleLabel: titleCase(user.role), status: user.isActive ? 'Active' : 'Inactive', divisionLabel: user.division || '-' })))).catch((error) => setMessage(error.message))
  useEffect(() => { load() }, [])
  const addUser = async (event) => { event.preventDefault(); try { await api.post('/users', form); setForm(emptyForm); setShowForm(false); setMessage('User created.'); load() } catch (error) { setMessage(error.message) } }
  const toggleStatus = async (user) => { try { await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive }); load() } catch (error) { setMessage(error.message) } }
  const deleteUser = async (user) => {
    const confirmed = window.confirm(`Delete ${user.name}? This action cannot be undone.`)
    if (!confirmed) return
    try {
      const data = await api.delete(`/users/${user.id}`)
      setMessage(data.message || 'User deleted.')
      load()
    } catch (error) {
      setMessage(error.message)
    }
  }
  const columns = [
    { key: 'name', header: 'Name' }, { key: 'email', header: 'Email' }, { key: 'roleLabel', header: 'Role' }, { key: 'divisionLabel', header: 'Division' },
    { key: 'status', header: 'Status', render: (user) => <Badge status={user.status} /> },
    { key: 'actions', header: 'Actions', render: (user) => <div className="flex gap-1.5"><Button size="sm" variant={user.isActive ? 'danger' : 'success'} onClick={() => toggleStatus(user)}><Power size={13} /> {user.isActive ? 'Deactivate' : 'Activate'}</Button><Button size="sm" variant="danger" onClick={() => deleteUser(user)}><Trash2 size={13} /> Delete</Button></div> },
  ]
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-gray-900">User Management</h1><p className="text-sm text-gray-500">Manage system accounts and access.</p></div><Button onClick={() => setShowForm((value) => !value)}><UserPlus size={15} /> Add User</Button></div>{message && <p className="text-sm text-primary-700">{message}</p>}{showForm && <Card><CardHeader><CardTitle>New User</CardTitle></CardHeader><CardContent><form onSubmit={addUser} className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div><Label>Temporary Password</Label><Input type="password" minLength="8" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div><div><Label>Role</Label><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="admin">Admin</option><option value="uploader">Uploader</option><option value="report_user">Report User</option></Select></div>{form.role === 'uploader' && <div><Label>Division</Label><Select value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })}>{DIVISIONS.map((division) => <option key={division}>{division}</option>)}</Select></div>}<div className="sm:col-span-3 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Create User</Button></div></form></CardContent></Card>}<Card><CardHeader><CardTitle>All Users</CardTitle></CardHeader><CardContent className="p-0"><DataTable columns={columns} rows={users} /></CardContent></Card></div>
}
