import type { AuthPayload } from '@/types'

function decodeJWT(token: string): AuthPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as AuthPayload
  } catch {
    return null
  }
}

export function saveToken(token: string) {
  localStorage.setItem('mamenu_token', token)
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mamenu_token')
}

export function clearToken() {
  localStorage.removeItem('mamenu_token')
}

export function getAuthPayload(): AuthPayload | null {
  const token = getToken()
  if (!token) return null
  const payload = decodeJWT(token)
  if (!payload) return null
  if (payload.exp * 1000 < Date.now()) {
    clearToken()
    return null
  }
  return payload
}

export function getRole(): string | null {
  return getAuthPayload()?.role ?? null
}

export function isAuthenticated(): boolean {
  return getAuthPayload() !== null
}
