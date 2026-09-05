import { Link } from 'react-router-dom'
import type { ProjectDocsStatus, ProjectListItem } from '../api/types'
import { ProgressMeter } from './ProgressMeter'
import { Icon } from './ui/Icon'

/*
  Bir proje kaydı — panodaki bir kart. Grid'de yan yana durur, bu yüzden
  kompakt: ad, kısaltılmış disk yolu, kompakt ilerleme çubuğu, doküman durumu
  rozeti ve son tarama tarihi. Kart artık `/projects/:id` detay sayfasına link
  (M2 madde 6). README/SCOPE/ROADMAP için ayrı rozetler YOK — liste endpoint'i
  yalnızca tek bir `docsStatus` veriyor, dosya bazında değil (bkz. SCOPE §8 notu
  görev metninde); üç ayrı rozet backend'de o veri eklenince ayrı bir görev olur.
*/

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
function scanDate(iso: string): { short: string; full: string } | null {
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

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const scanned = scanDate(project.lastScanAt)

  return (
    <li>
      <Link
        to={`/projects/${project.id}`}
        className="flex h-full flex-col rounded-lg border border-border bg-surface p-4 shadow-card transition duration-150 ease-out hover:-translate-y-0.5 hover:border-fg-subtle/60 hover:shadow-card-hover"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-fg">
            {project.displayName}
          </h3>
          {project.pinned && (
            <span
              className="mt-0.5 shrink-0 text-accent"
              title="Sabitlenmiş proje"
            >
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
          <DocsBadge status={project.docsStatus} />
          {scanned && (
            <p className="mt-1.5 text-[11px] text-fg-subtle">
              Tarandı ·{' '}
              <time dateTime={project.lastScanAt} title={scanned.full}>
                {scanned.short}
              </time>
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}
