import axios, { isAxiosError } from 'axios'

/*
  Merkezi axios örneği. Tüm API çağrıları bunun üzerinden gider.
  baseURL '/api' — geliştirmede Vite proxy'si :8420'ye iletir,
  pakette ise SPA ile aynı origin'den (Spring Boot) servis edilir.
*/
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

/**
 * Backend hata gövdesi her zaman `{ "error": "<TR mesaj>" }` biçiminde.
 * Bu yardımcı, bir axios hatasından o mesajı (varsa) çıkarır; yoksa null döner
 * ve çağıran genel bir metne düşer.
 */
export function apiErrorMessage(err: unknown): string | null {
  if (isAxiosError(err)) {
    const body = err.response?.data as { error?: unknown } | undefined
    if (body && typeof body.error === 'string') return body.error
  }
  return null
}

/** Bir axios hatasının HTTP durum kodu (yoksa null). */
export function apiErrorStatus(err: unknown): number | null {
  return isAxiosError(err) ? (err.response?.status ?? null) : null
}
