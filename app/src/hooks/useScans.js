import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../lib/api.js'

/**
 * Loads every scan for the current user, with full detail (vulnerabilities,
 * attack graph, AI analysis) merged in. The list endpoint alone doesn't
 * include findings, so this fetches the detail of each scan in parallel.
 * Pass `pollMs` to keep refreshing (e.g. while a scan is running).
 */
export function useScanDetails({ pollMs } = {}) {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const list = await api.listScans()
      const details = await Promise.all(
        list.map((s) => api.getScan(s.id).catch(() => s)),
      )
      setScans(details)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    refresh()
    if (!pollMs) return undefined
    const t = setInterval(refresh, pollMs)
    return () => clearInterval(t)
  }, [refresh, pollMs])

  return { scans, loading, error, refresh }
}

/** Flattens every scan's vulnerabilities into one list, each tagged with its scan. */
export function flattenFindings(scans) {
  return scans.flatMap((s) =>
    (s.vulnerabilities || []).map((v) => ({
      ...v,
      scanId: s.id,
      targetUrl: s.target_url,
      discoveredAt: s.completed_at || s.created_at,
    })),
  )
}
