export type ApiErrorPayload = {
  success?: boolean
  errors?: string[] | string
  error?: string
  [key: string]: any
}

export class ApiError extends Error {
  public status: number
  public payload: ApiErrorPayload | null

  constructor(message: string, status = 0, payload: ApiErrorPayload | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

// Check env (warn in dev, allow build to proceed)
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/g, '')
if (!API_BASE && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.warn('[api] NEXT_PUBLIC_API_BASE_URL is not set; requests will go to /api/v1')
}
const defaultPrefix = API_BASE ? `${API_BASE}/api/v1` : `/api/v1`

const buildApiPath = (relativePath: string) => {
  const rel = String(relativePath).replace(/^\/+/, '')
  return `${defaultPrefix}/${rel}`
}

type AuthHeaders = {
  'access-token'?: string | null
  client?: string | null
  uid?: string | null
  expiry?: string | null
  'token-type'?: string | null
}

const AUTH_KEY = 'auth'

export const getStoredAuth = (): AuthHeaders | null => {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setStoredAuth = (headers: Headers) => {
  const auth: AuthHeaders = {
    'access-token': headers.get('access-token'),
    client: headers.get('client'),
    uid: headers.get('uid'),
    expiry: headers.get('expiry'),
    'token-type': headers.get('token-type'),
  }
  try {
    if (typeof window !== 'undefined') localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  } catch {
    // ignore
  }
}

const attachAuthHeaders = (init: HeadersInit = {}) => {
  const stored = getStoredAuth()
  const out = new Headers(init as HeadersInit)
  if (stored) {
    if (stored['access-token']) out.set('access-token', String(stored['access-token']))
    if (stored.client) out.set('client', String(stored.client))
    if (stored.uid) out.set('uid', String(stored.uid))
  }
  return out
}

const parseJsonSafe = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function request<T = any>(
  method: string,
  relativePath: string,
  body?: any,
  opts?: { headers?: HeadersInit; credentials?: RequestCredentials }
): Promise<{ data: T | null; res: Response }> {
  const url = buildApiPath(relativePath)
  const headers = attachAuthHeaders(opts?.headers ?? { 'Content-Type': 'application/json' })
  const init: RequestInit = {
    method,
    headers,
    credentials: opts?.credentials ?? 'same-origin',
  }
  if (body != null) {
    init.body = JSON.stringify(body)
  }

  const res = await fetch(url, init)

  const newAccess = res.headers.get('access-token')
  if (newAccess) {
    setStoredAuth(res.headers)
  }

  const payload = await parseJsonSafe(res)

  if (!res.ok) {
    const errMessage =
      payload?.error ||
      (Array.isArray(payload?.errors) ? payload.errors.join(', ') : payload?.errors) ||
      res.statusText ||
      'API error'
    throw new ApiError(errMessage, res.status, payload)
  }

  return { data: (payload?.data ?? payload) as T, res }
}

export const apiGet = <T = any>(path: string, opts?: { headers?: HeadersInit; credentials?: RequestCredentials }) =>
  request<T>('GET', path, undefined, opts)

export const apiPost = <T = any>(path: string, body?: any, opts?: { headers?: HeadersInit; credentials?: RequestCredentials }) =>
  request<T>('POST', path, body, opts)

export const apiPut = <T = any>(path: string, body?: any, opts?: { headers?: HeadersInit; credentials?: RequestCredentials }) =>
  request<T>('PUT', path, body, opts)

export const apiDelete = <T = any>(path: string, body?: any, opts?: { headers?: HeadersInit; credentials?: RequestCredentials }) =>
  request<T>('DELETE', path, body, opts)

// ─────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────

export type LoginResult = {
  user: any
}

/**
 * POST /auth/sign_in
 * Stores tokens automatically on success.
 */
export const login = async (email: string, password: string): Promise<LoginResult> => {
  const { data } = await apiPost<LoginResult>('auth/sign_in', { email, password })
  return data ?? { user: null }
}

/**
 * DELETE /auth/sign_out
 * Clears stored auth tokens.
 */
export const logout = async (): Promise<void> => {
  try {
    await apiDelete('auth/sign_out')
  } finally {
    clearStoredAuth()
  }
}

export const clearStoredAuth = () => {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(AUTH_KEY)
  } catch {
    // ignore
  }
}
