import { api } from './client'
import type { ClaudeRun } from './types'

/*
  Loglar sayfası endpoint'i (SCOPE §8 "Loglar sayfası", ROADMAP M5 madde 5).
  `api` = merkezi axios örneği (baseURL '/api').
*/

/**
 * GET /api/logs?limit=<int> — `claude` çağrı geçmişi, en yeni üstte.
 * `limit` opsiyonel: backend varsayılanı 100, üst sınırı 1000. Kayıt yoksa [].
 */
export async function fetchLogs(limit?: number): Promise<ClaudeRun[]> {
  const { data } = await api.get<ClaudeRun[]>('/logs', {
    params: limit != null ? { limit } : undefined,
  })
  return Array.isArray(data) ? data : []
}
