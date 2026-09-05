import { api } from './client'
import type { ProjectDetail, ProjectListItem } from './types'

/*
  Proje listesi + detay endpoint'leri (SCOPE §8, ROADMAP M1/M2).
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

/**
 * GET /api/projects/{id} — proje detayı (dokümanlar + milestone'lar + ilerleme).
 * Olmayan id → backend 404 `{ error: 'Project not found' }` döner; bu fonksiyon
 * hatayı olduğu gibi fırlatır, ele alma çağıran tarafta (bkz. ProjectDetailPage).
 */
export async function fetchProjectDetail(id: string): Promise<ProjectDetail> {
  const { data } = await api.get<ProjectDetail>(`/projects/${id}`)
  return data
}

/**
 * POST /api/projects/{id}/sync — dosyaları yeniden okuyup docsStatus'u
 * günceller, güncel detayı döner.
 */
export async function syncProject(id: string): Promise<ProjectDetail> {
  const { data } = await api.post<ProjectDetail>(`/projects/${id}/sync`)
  return data
}

/**
 * PUT /api/projects/{id}/note — serbest not alanını günceller (ROADMAP M2
 * madde 7). `notes: null` gönderilirse not temizlenir. Yanıt gövdesi düz
 * metindir ("Note updated successfully."), JSON değil — bu yüzden
 * `responseType: 'text'` (axios varsayılan JSON parse etmeye çalışıp hata verir).
 */
export async function updateProjectNote(id: string, notes: string | null): Promise<void> {
  await api.put(`/projects/${id}/note`, { notes }, { responseType: 'text' })
}
