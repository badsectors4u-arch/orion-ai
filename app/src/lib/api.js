// Thin fetch wrapper around the Orion backend API.
//
// Every request goes to a relative `/api/...` path: in production, nginx
// proxies that path to the backend container (see /nginx.conf); in local
// dev, Vite's dev server proxy does the same (see vite.config.js). Nothing
// here needs to know the backend's actual host.

const TOKEN_KEY = 'orion_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore (private browsing, storage disabled, ...) */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Could not reach the Orion backend. Is it running?', 0)
  }

  if (res.status === 204) return null

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed (${res.status})`
    throw new ApiError(
      typeof message === 'string' ? message : JSON.stringify(message),
      res.status,
    )
  }

  return data
}

async function requestBlob(path) {
  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`/api${path}`, { headers })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`
    throw new ApiError(typeof message === 'string' ? message : JSON.stringify(message), res.status)
  }
  const filename =
    res.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/)?.[1] ||
    'report.pdf'
  const blob = await res.blob()
  return { blob, filename }
}

// ── Auth ────────────────────────────────────────────────────────────────

export function register({ email, password, username }) {
  return request('/auth/register', { method: 'POST', body: { email, password, username }, auth: false })
}

export function login({ email, password }) {
  return request('/auth/login', { method: 'POST', body: { email, password }, auth: false })
}

export function me() {
  return request('/auth/me')
}

export function updateSettings(payload) {
  return request('/auth/settings', { method: 'PUT', body: payload })
}

// ── Targets ─────────────────────────────────────────────────────────────

export function listTargets() {
  return request('/targets')
}

export function createTarget(url) {
  return request('/targets', { method: 'POST', body: { url } })
}

export function deleteTarget(id) {
  return request(`/targets/${id}`, { method: 'DELETE' })
}

// ── Scans ───────────────────────────────────────────────────────────────

export function listScans() {
  return request('/scans')
}

export function createScan({ target_url, scan_type, ai_hunter_duration }) {
  return request('/scans', { method: 'POST', body: { target_url, scan_type, ai_hunter_duration } })
}

export function getScan(id) {
  return request(`/scans/${id}`)
}

export function deleteScan(id) {
  return request(`/scans/${id}`, { method: 'DELETE' })
}

export function getScanPdf(id) {
  return requestBlob(`/scans/${id}/pdf`)
}

// ── Plans & quota ───────────────────────────────────────────────────────

export function getQuota() {
  return request('/plans/quota')
}

export function upgradePlan(plan) {
  return request('/plans/upgrade', { method: 'POST', body: { plan } })
}

// ── AI Security Copilot ────────────────────────────────────────────────

export function chat({ message, scan_id, history }) {
  return request('/ai/chat', { method: 'POST', body: { message, scan_id, history } })
}
