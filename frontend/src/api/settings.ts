import { api } from './client'
import type { Settings } from './types'

/*
  Ayarlar endpoint'leri (SCOPE §4 / §8 "Ayarlar: kök yol düzenleme").
  app_settings tek satırdır; şimdilik yalnızca "Projeleri Tara"nın baktığı
  kök yolu tutar. `api` = merkezi axios örneği (baseURL '/api').
*/

/** GET /api/settings — kayıtlı kök yolu döner. */
export async function fetchSettings(): Promise<Settings> {
  const { data } = await api.get<Settings>('/settings')
  return data
}

/**
 * PUT /api/settings — kök yolu günceller.
 * Yanıt, backend'in trim'leyip kaydettiği değeri içerir; onu esas al.
 * Geçersiz yol → 400 + { error: "<Türkçe mesaj>" } (kullanıcıya gösterilebilir).
 */
export async function updateSettings(rootPath: string): Promise<Settings> {
  const { data } = await api.put<Settings>('/settings', { rootPath })
  return data
}
