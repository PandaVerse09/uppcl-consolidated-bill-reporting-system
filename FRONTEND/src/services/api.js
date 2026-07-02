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

const getRewrites = {
  '/uploads': '/uploads/list',
  '/users': '/users/list',
  '/reports': '/reports/list',
  '/audit': '/audit/list',
}

export const api = {
  get: (path, params) => {
    const targetPath = getRewrites[path] || path
    return request(targetPath, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  },
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path) => request(`${path}/delete`, { method: 'POST' }),
  download: async (path, filename) => {
    // Parse potential query params from path and move them to POST body
    let cleanPath = path
    let body = {}
    const qIndex = path.indexOf('?')
    if (qIndex !== -1) {
      cleanPath = path.substring(0, qIndex)
      const queryString = path.substring(qIndex + 1)
      const searchParams = new URLSearchParams(queryString)
      for (const [key, value] of searchParams.entries()) {
        body[key] = value
      }
    }

    const response = await fetch(`${API_URL}${cleanPath}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Download failed')
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  },
}
