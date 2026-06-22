import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { reportRows } from '../data/apiFormat'

export function useReports(params = {}) {
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  const key = JSON.stringify(params)
  useEffect(() => {
    api.get('/reports', params)
      .then((data) => { setReports(data.reports); setError('') })
      .catch((requestError) => setError(requestError.message))
  }, [key])
  return { reports, rows: reportRows(reports), error }
}
