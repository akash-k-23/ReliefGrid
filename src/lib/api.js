const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api$/, '')
const API_TIMEOUT_MS = 10000

export async function apiFetch(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const { headers, signal, ...requestOptions } = options
  const isJsonBody = options.body && !(options.body instanceof FormData)

  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(`${API_URL}/api${normalizedPath}`, {
      ...requestOptions,
      credentials: 'include',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}), ...headers },
    })
    const data = await response.json().catch(() => ({}))
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('reliefgrid:unauthorized'))
    }
    if (!response.ok) {
      const message = data.message || response.statusText || 'The server returned an error'
      throw new Error(`API request failed (${response.status} ${response.statusText}): ${message}`)
    }
    return data
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`API request timed out after ${API_TIMEOUT_MS / 1000} seconds: ${API_URL}/api${normalizedPath}`)
    }
    if (error.message.startsWith('API request failed')) throw error
    throw new Error(`Unable to reach the ReliefGrid API at ${API_URL}: ${error.message}`)
  } finally {
    clearTimeout(timeoutId)
  }
}

export { API_URL }
