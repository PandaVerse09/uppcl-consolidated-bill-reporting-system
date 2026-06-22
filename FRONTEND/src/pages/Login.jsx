import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input, Label, Select } from '../components/ui/Input'
import { DIVISIONS } from '../data/constants'

const HOME_BY_ROLE = { admin: '/admin/dashboard', uploader: '/uploader/dashboard', report_user: '/reports/dashboard' }
const DEFAULT_REGISTER_FORM = { name: '', email: '', password: '', role: 'report_user', division: '' }

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registerForm, setRegisterForm] = useState(DEFAULT_REGISTER_FORM)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const goToHome = (user) => {
    navigate(HOME_BY_ROLE[user.role] || '/')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      const user = await login({ email, password })
      goToHome(user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegisterChange = (event) => {
    const { name, value } = event.target
    setRegisterForm((current) => ({ ...current, [name]: value }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      const user = await register({
        ...registerForm,
        division: registerForm.role === 'uploader' ? registerForm.division : undefined,
      })
      setRegisterForm(DEFAULT_REGISTER_FORM)
      goToHome(user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-primary-700 text-lg font-bold text-white">UP</div>
          <h1 className="text-lg font-semibold text-gray-900">Consolidated Billing System</h1>
          <p className="text-sm text-gray-500">Uttar Pradesh Power Corporation Limited</p>
        </div>
        <div className="rounded-lg border border-surface-border bg-white p-6 shadow-card">
          <div className="mb-5 grid grid-cols-2 rounded-md bg-surface-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded px-3 py-2 ${mode === 'login' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded px-3 py-2 ${mode === 'register' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}
            >
              Register User
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
              {error && <p className="text-xs text-danger-600">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>{submitting ? 'Signing in...' : 'Login'}</Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div><Label htmlFor="register-name">Name</Label><Input id="register-name" name="name" required value={registerForm.name} onChange={handleRegisterChange} autoComplete="name" /></div>
              <div><Label htmlFor="register-email">Email</Label><Input id="register-email" name="email" type="email" required value={registerForm.email} onChange={handleRegisterChange} autoComplete="email" /></div>
              <div><Label htmlFor="register-password">Password</Label><Input id="register-password" name="password" type="password" required minLength={8} value={registerForm.password} onChange={handleRegisterChange} autoComplete="new-password" /></div>
              <div>
                <Label htmlFor="register-role">Role</Label>
                <Select id="register-role" name="role" value={registerForm.role} onChange={handleRegisterChange}>
                  <option value="report_user">Report User</option>
                  <option value="uploader">Uploader</option>
                </Select>
              </div>
              {registerForm.role === 'uploader' && (
                <div>
                  <Label htmlFor="register-division">Division</Label>
                  <Select id="register-division" name="division" required value={registerForm.division} onChange={handleRegisterChange}>
                    <option value="">Select division</option>
                    {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
                  </Select>
                </div>
              )}
              {error && <p className="text-xs text-danger-600">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>{submitting ? 'Creating account...' : 'Register User'}</Button>
              <p className="text-xs text-gray-400">Admin accounts are created from the admin panel or seed script.</p>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">For authorized UPPCL personnel only.</p>
      </div>
    </div>
  )
}
