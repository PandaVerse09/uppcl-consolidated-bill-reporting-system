const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const data = (response.headers.get('content-type') || '').includes('application/json')
    ? await response.json()
    : null
  if (!response.ok) throw new Error(data?.message || 'Unable to complete the request')
  return data
}

function query(params = {}) {
  const values = Object.entries(params).filter(([, value]) => value !== '' && value != null)
  return values.length ? `?${new URLSearchParams(values)}` : ''
}

export const api = {
  get: (path, params) => request(`${path}${query(params)}`),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  download: async (path, filename) => {
    const response = await fetch(`${API_URL}${path}`, { credentials: 'include' })
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Download failed')
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  },
}
