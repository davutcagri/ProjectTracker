import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiErrorMessage, apiErrorStatus } from '../api/client'
import { startInterview } from '../api/interview'
import { syncProject } from '../api/projects'
import type { ProjectDocFileName, ProjectDocsStatus, ProjectListItem } from '../api/types'
import { ProgressMeter } from './ProgressMeter'
import { Icon } from './ui/Icon'

/*
  Bir proje kaydı — panodaki bir kart. Grid'de yan yana durur, bu yüzden
  kompakt: ad, kısaltılmış disk yolu, kompakt ilerleme çubuğu, doküman durumu
  rozeti, son aktivite tarihi ve bir "Sync" butonu (SCOPE §8, ROADMAP M4 madde 13).

  Kartın tamamı `/projects/:id` detay sayfasına gider: görünmez bir "stretched
  link" (`absolute inset-0`) kartı kaplar; Sync butonu `relative z-10` ile onun
  üstünde durur, tıklaması linke gitmez.

  Sync akışı (SCOPE §4):
  - POST /api/projects/{id}/sync → dönen detayda README/SCOPE/ROADMAP içerikleri.
  - En az biri eksikse → POST .../interview/start + sihirbaz açılır (onInterviewStart).
  - Hepsi varsa → normal sync; liste tazelenir (onSynced).
*/

const DOC_NAMES: ProjectDocFileName[] = ['README.md', 'SCOPE.md', 'ROADMAP.md']

const DOCS_LABEL: Record<ProjectDocsStatus, string> = {
  COMPLETE: 'Dokümanlar tam',
  INCOMPLETE: 'Dokümanlar eksik',
  UNKNOWN: 'Henüz taranmadı',
}

const DOCS_TONE: Record<ProjectDocsStatus, string> = {
  COMPLETE: 'bg-success-soft text-success',
  INCOMPLETE: 'bg-warning-soft text-warning',
  UNKNOWN: 'bg-sunken text-fg-muted',
}

const dateShort = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateFull = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Geçerli tarihse kısa + tam metnini döner, değilse null. */
function formatDate(iso: string | null): { short: string; full: string } | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return { short: dateShort.format(date), full: dateFull.format(date) }
}

/** Uzun yolu baştan `…/` ile kısaltır, segment ortasından kesmez. */
function shortenPath(path: string, max = 38): string {
  if (path.length <= max) return path
  const segments = path.split('/').filter(Boolean)
  let tail = segments[segments.length - 1] ?? path
  for (let i = segments.length - 2; i >= 0; i--) {
    const next = `${segments[i]}/${tail}`
    if (next.length + 2 > max) break
    tail = next
  }
  return `…/${tail}`
}

function DocsBadge({ status }: { status: ProjectDocsStatus }) {
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${DOCS_TONE[status]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      <span className="truncate">{DOCS_LABEL[status]}</span>
    </span>
  )
}

interface ProjectCardProps {
  project: ProjectListItem
  /** Eksik dosya bulunup interview başlatıldı — üst sayfa sihirbazı açsın. */
  onInterviewStart: (project: ProjectListItem) => void
  /** Dosyalar tamdı, normal sync yapıldı — üst sayfa listeyi tazelesin. */
  onSynced: () => void
}

export function ProjectCard({ project, onInterviewStart, onSynced }: ProjectCardProps) {
  const activity = formatDate(project.lastActivity)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  async function handleSync(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (syncing) return
    setSyncing(true)
    setSyncError(null)
    try {
      const detail = await syncProject(project.id)
      const missing = DOC_NAMES.some((name) => {
        const doc = detail.docs.find((d) => d.fileName === name)
        return !doc || doc.content == null
      })

      if (!missing) {
        onSynced()
        return
      }

      try {
        await startInterview(project.id)
        onInterviewStart(project)
      } catch (err) {
        const status = apiErrorStatus(err)
        const message = apiErrorMessage(err)
        if (status === 409 && message === 'Başka bir interview sürüyor') {
          setSyncError(
            'Şu anda başka bir proje için doküman üretimi sürüyor, bitince tekrar dene.',
          )
        } else if (status === 409) {
          // "tüm dokümanlar zaten mevcut" — yarış durumu; listeyi tazelemek yeter.
          onSynced()
        } else {
          setSyncError(message ?? 'Doküman üretimi başlatılamadı.')
        }
      }
    } catch {
      setSyncError('Sync başarısız oldu. Backend :8420 çalışıyor mu?')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <li>
      <div className="relative flex h-full flex-col rounded-lg border border-border bg-surface p-4 shadow-card transition duration-150 ease-out hover:-translate-y-0.5 hover:border-fg-subtle/60 hover:shadow-card-hover">
        <Link
          to={`/projects/${project.id}`}
          aria-label={`${project.displayName} detayları`}
          className="absolute inset-0 rounded-lg"
        />

        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-fg">
            {project.displayName}
          </h3>
          {project.pinned && (
            <span className="mt-0.5 shrink-0 text-accent" title="Sabitlenmiş proje">
              <Icon name="pin" size={14} />
              <span className="sr-only">Sabitlenmiş proje</span>
            </span>
          )}
        </div>

        <p
          className="mt-1 flex items-center gap-1.5 font-mono text-[11.5px] text-fg-subtle"
          title={project.path}
        >
          <Icon name="folder" size={12} className="shrink-0" />
          <span className="truncate">{shortenPath(project.path)}</span>
        </p>

        <div className="mt-3">
          <ProgressMeter percent={project.progress} size="sm" />
        </div>

        <div className="mt-auto border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <DocsBadge status={project.docsStatus} />
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[12px] font-medium text-fg-muted transition-colors hover:bg-sunken hover:text-fg disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Icon name="refresh" size={13} spin={syncing} />
              {syncing ? 'Sync…' : 'Sync'}
            </button>
          </div>

          {syncError ? (
            <p className="relative z-10 mt-1.5 flex items-start gap-1.5 text-[11px] text-warning">
              <Icon name="alert" size={13} className="mt-px shrink-0" />
              {syncError}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-fg-subtle">
              {activity ? (
                <>
                  Son aktivite ·{' '}
                  <time dateTime={project.lastActivity ?? undefined} title={activity.full}>
                    {activity.short}
                  </time>
                </>
              ) : (
                'Son aktivite bilinmiyor'
              )}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
