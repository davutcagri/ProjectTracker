import { api } from './client'
import type { ProjectListItem } from './types'

/*
  Proje listesi endpoint'leri (SCOPE §8 "Liste sayfası", ROADMAP M1).
  `api` = merkezi axios örneği (baseURL '/api'); geliştirmede Vite proxy'si
  bunu :8420'ye iletir.
*/

/** GET /api/projects — tüm projeleri döner (sıralama frontend'de yapılır). */
export async function fetchProjects(): Promise<ProjectListItem[]> {
  const { data } = await api.get<ProjectListItem[]>('/projects')
  return Array.isArray(data) ? data : []
}

/**
 * POST /api/projects/scan — diski yeniden tarar, projeleri senkronlar.
 * Yanıt gövdesi düz metindir ("Project sync completed."), JSON değil.
 * Çağrı bittikten sonra `fetchProjects()` ile liste yeniden çekilmeli.
 */
export async function scanProjects(): Promise<void> {
  await api.post('/projects/scan', null, { responseType: 'text' })
}
