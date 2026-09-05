/*
  API sözleşmesi — SCOPE §7 / §8'e göre yazıldı. Backend endpoint'leri
  hazır olmadığı için bunlar taslaktır; gerçek yanıtlar bağlanınca güncellenecek.
*/

/* ------------------------------------------------------------------ *
 * M1 — GET /api/projects gerçek sözleşmesi (backend hazır, doğrulandı)
 * ------------------------------------------------------------------ */

export type ProjectDocsStatus = 'UNKNOWN' | 'COMPLETE' | 'INCOMPLETE'

/** Liste sayfasındaki bir proje kaydı (GET /api/projects dizisinin elemanı). */
export interface ProjectListItem {
  id: string
  path: string
  displayName: string
  pinned: boolean
  docsStatus: ProjectDocsStatus
  /**
   * 0-100 tam sayı. Bu alan backend'de M2 ile paralel bir görevde ekleniyor;
   * o görev henüz tamamlanmadıysa yanıtta gelmeyebilir (`undefined`) — arayüz
   * bunu "veri yok" olarak ele alır (bkz. ProgressMeter).
   */
  progress: number
  lastScanAt: string
}

/* ------------------------------------------------------------------ *
 * M1 — GET/PUT /api/settings gerçek sözleşmesi (backend hazır, doğrulandı)
 * ------------------------------------------------------------------ */

/** app_settings tek satırı — şimdilik yalnızca taranacak kök yol. */
export interface Settings {
  rootPath: string
}

/* ------------------------------------------------------------------ *
 * M2 — GET /api/projects/{id} ve POST /api/projects/{id}/sync gerçek
 * sözleşmesi (backend M2 madde 1-4 tamam, madde 5-6 burada bağlanıyor).
 * ------------------------------------------------------------------ */

export type ProjectDocFileName = 'README.md' | 'SCOPE.md' | 'ROADMAP.md'

/** Tek bir kök dizin dosyası. `content === null` → proje kökünde dosya yok. */
export interface ProjectDoc {
  fileName: ProjectDocFileName
  content: string | null
}

/** Backend İngilizce döner; arayüzde Türkçeye çevrilir (bkz. MilestoneList). */
export type MilestoneStatus = 'Empty' | 'Not Started' | 'In Progress' | 'Completed'

export interface ProjectMilestone {
  name: string
  totalTasks: number
  completedTasks: number
  status: MilestoneStatus
  /** 0-100 tam sayı. */
  progress: number
}

/** Detay sayfası (GET /api/projects/{id}, POST /api/projects/{id}/sync). */
export interface ProjectDetail {
  id: string
  path: string
  displayName: string
  docs: ProjectDoc[]
  /** 0-100 tam sayı. */
  progress: number
  milestones: ProjectMilestone[]
  lastScanAt: string
  /** Serbest not alanı (ROADMAP M2 madde 7). null = not girilmemiş/silinmiş. */
  notes: string | null
}

/* ------------------------------------------------------------------ *
 * M3 taslağı — git metadata henüz backend'de yok. SİLME.
 * ------------------------------------------------------------------ */

export interface GitStats {
  branch: string
  lastCommitAt: string
  lastCommitMessage: string
  commitCount: number
  branchCount: number
}

/** Interview sihirbazı — SCOPE §6.3 <portal-questions> formatı. */
export type QuestionType = 'text' | 'textarea' | 'choice' | 'multi'

export interface InterviewQuestion {
  id: string
  text: string
  type: QuestionType
  choices: string[]
  placeholder: string | null
}

export type InterviewStatus =
  | 'RUNNING'
  | 'WAITING_INPUT'
  | 'DONE'
  | 'ERROR'

export interface InterviewState {
  status: InterviewStatus
  pendingQuestions: InterviewQuestion[]
}
