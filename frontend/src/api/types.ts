/*
  API sözleşmesi — SCOPE §7 / §8'e göre yazıldı. Backend endpoint'leri
  hazır olmadığı için bunlar taslaktır; gerçek yanıtlar bağlanınca güncellenecek.
*/

export type DocsStatus = 'COMPLETE' | 'PARTIAL' | 'MISSING'

/** Liste kartında gösterilen özet proje bilgisi (GET /api/projects). */
export interface ProjectSummary {
  id: number
  path: string
  displayName: string
  shortDescription: string | null
  pinned: boolean
  hasReadme: boolean
  hasScope: boolean
  hasRoadmap: boolean
  /** 0..1 — ROADMAP yoksa null. */
  progress: number | null
  lastActivityAt: string | null
}

export type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE'

export interface Milestone {
  title: string
  status: MilestoneStatus
  doneCount: number
  totalCount: number
}

/** Detay sayfası (GET /api/projects/{id}). */
export interface ProjectDetail extends ProjectSummary {
  readmeHtml: string | null
  scopeHtml: string | null
  roadmapHtml: string | null
  milestones: Milestone[]
  notes: string
  git: GitStats | null
}

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
