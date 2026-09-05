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
  /**
   * Projede en son ne zaman iş yapıldığı (ISO-8601 UTC): git deposuysa son
   * commit tarihi, değilse kökteki README/SCOPE/ROADMAP.md'nin en yeni
   * değiştirilme zamanı. Hiçbiri yoksa null. Kartta gösterilen tarih budur —
   * `lastScanAt` (backend'in en son tarama zamanı) ile karıştırma.
   */
  lastActivity: string | null
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

  /* ---- ROADMAP M3 — git metadata (backend hazır, doğrulanmış sözleşme) ---- */
  /** Proje klasörü bir git deposu mu? Diğer git alanları için ayraç. */
  gitRepo: boolean
  /** Son commit tarihi (ISO-8601 UTC). Git değilse veya hiç commit yoksa null. */
  lastCommitDate: string | null
  /** Son commit mesajı. Git değilse veya hiç commit yoksa null. */
  lastCommitMessage: string | null
  /** Branch (dal) sayısı. Git değilse null, boş depoda 0. */
  branchCount: number | null
  /** Commit sayısı. Git değilse null, boş depoda 0. */
  commitCount: number | null
  /**
   * Son aktivite (ISO-8601 UTC): git ise son commit tarihi, değilse en yeni
   * `.md` dosyasının değişiklik zamanı. Hiçbiri yoksa null. Asıl gösterim yeri
   * proje kartı (ROADMAP M3 madde 5).
   */
  lastActivity: string | null
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

export type InterviewStatus = 'RUNNING' | 'WAITING_INPUT' | 'DONE' | 'ERROR'

/** Bir cevabı backend'e gönderirken kullanılan biçim (çıplak dizinin elemanı). */
export interface InterviewAnswer {
  questionId: string
  /** Serbest metin; `multi` tipinde seçimler virgülle birleştirilir. */
  answer: string
  /** Kullanıcı "Geç" dediyse true; bu durumda `answer` boş gönderilir. */
  skipped: boolean
}

/**
 * GET/POST .../interview yanıtı. `pendingQuestions` yalnızca status
 * `WAITING_INPUT` iken doludur; diğer durumlarda boş dizidir. `doneSummary`
 * backend'de şimdilik hep null — DONE ekranında sabit metin gösterilir.
 */
export interface InterviewStatusResponse {
  sessionId: string
  projectId: string
  status: InterviewStatus
  pendingQuestions: InterviewQuestion[]
  startedAt: string
  lastActivityAt: string
  doneSummary: string | null
}
