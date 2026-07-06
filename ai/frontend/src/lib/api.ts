const DEFAULT_PUBLIC_API_BASE = '/backend-api'
const DEFAULT_INTERNAL_API_BASE = 'http://127.0.0.1:8001/api'
const REQUEST_TIMEOUT_MS = 20000

const PUBLIC_API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_PUBLIC_API_BASE).replace(/\/$/, '')
const INTERNAL_API_BASE = (
  process.env.INTERNAL_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  DEFAULT_INTERNAL_API_BASE
).replace(/\/$/, '')

function resolveApiBase() {
  return typeof window === 'undefined' ? INTERNAL_API_BASE : PUBLIC_API_BASE
}

function normalizeError(error: unknown, fallback = '请求失败') {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new Error('请求超时，请确认后端服务已经启动。')
    }
    return error
  }
  return new Error(fallback)
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    throw normalizeError(error)
  } finally {
    clearTimeout(timer)
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `请求失败（${res.status}）`
    try {
      const data = await res.json()
      message = data?.detail ?? data?.message ?? message
    } catch {}
    throw new Error(message)
  }
  return (await res.json()) as T
}

export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(`${resolveApiBase()}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function apiGetOrThrow<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${resolveApiBase()}${path}`, { cache: 'no-store' })
  return parseResponse<T>(res)
}

export async function apiPost<T>(path: string, payload?: unknown): Promise<T> {
  const res = await fetchWithTimeout(`${resolveApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  return parseResponse<T>(res)
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${resolveApiBase()}${path}`, {
    method: 'DELETE',
  })
  return parseResponse<T>(res)
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetchWithTimeout(`${resolveApiBase()}${path}`, {
    method: 'POST',
    body: formData,
  })
  return parseResponse<T>(res)
}

export function apiUrl(path: string) {
  return `${resolveApiBase()}${path}`
}

export function getPublicApiBase() {
  return PUBLIC_API_BASE
}
