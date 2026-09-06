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
    const data = err.response?.data
    if (data && typeof data === 'object') {
      const body = data as { error?: unknown }
      if (typeof body.error === 'string') return body.error
    }
    // Bazı çağrılar `responseType: 'text'` kullanır (ör. scan); o durumda
    // hata gövdesi de ayrıştırılmamış bir JSON metni olarak gelir.
    if (typeof data === 'string' && data.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(data) as { error?: unknown }
        if (typeof parsed.error === 'string') return parsed.error
      } catch {
        /* JSON değil — genel mesaja düşülür */
      }
    }
  }
  return null
}

/** Bir axios hatasının HTTP durum kodu (yoksa null). */
export function apiErrorStatus(err: unknown): number | null {
  return isAxiosError(err) ? (err.response?.status ?? null) : null
}
