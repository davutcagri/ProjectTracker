import { useCallback, useEffect, useState } from 'react'
import { fetchProjects, scanProjects } from '../api/projects'
import type { ProjectListItem } from '../api/types'
import { InterviewWizard } from '../components/InterviewWizard'
import { ProjectCard } from '../components/ProjectCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

/*
  Proje listesi sayfası (ROADMAP M1, SCOPE §8 "Liste sayfası").
  - GET /api/projects ile kartları çeker.
  - "Projeleri tara" → POST /api/projects/scan → liste yeniden çekilir.
  Sıralama: sabitlenmiş projeler üstte, ardından ada göre (tr) alfabetik.
*/

type LoadState = 'loading' | 'ready' | 'error'

function sortProjects(list: ProjectListItem[]): ProjectListItem[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.displayName.localeCompare(b.displayName, 'tr')
  })
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  // Kart Sync'i eksik dosya bulup interview başlatınca burası dolar → sihirbaz açılır.
  const [interviewFor, setInterviewFor] = useState<ProjectListItem | null>(null)

  // mode 'initial' → tam sayfa yükleme/hata durumu; 'refresh' → sessiz yenileme.
  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoadState('loading')
    try {
      const data = await fetchProjects()
      setProjects(sortProjects(data))
      setLoadState('ready')
      return true
    } catch {
      if (mode === 'initial') setLoadState('error')
      return false
    }
  }, [])

  useEffect(() => {
    void load('initial')
  }, [load])

  async function handleScan() {
    setScanning(true)
    setScanError(null)
    try {
      await scanProjects()
      const refreshed = await load('refresh')
      if (!refreshed) {
        setScanError('Tarama bitti ama liste yenilenemedi. Sayfayı yenileyin.')
      }
    } catch {
      setScanError('Tarama başarısız oldu. Backend :8420 çalışıyor mu?')
    } finally {
      setScanning(false)
    }
  }

  const showCount = loadState === 'ready' && projects.length > 0

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">
            Projeler
          </h1>
          {showCount && (
            <span className="rounded-full bg-sunken px-2 py-0.5 text-[12px] font-medium tabular-nums text-fg-muted">
              {projects.length}
            </span>
          )}
        </div>
        <Button onClick={handleScan} disabled={scanning} className="shrink-0">
          <Icon name="refresh" size={14} spin={scanning} />
          {scanning ? 'Taranıyor…' : 'Projeleri tara'}
        </Button>
      </div>

      {scanError && (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-warning/25 bg-warning-soft px-3 py-2 text-[13px] text-warning">
          <Icon name="alert" size={15} className="shrink-0" />
          {scanError}
        </p>
      )}

      {loadState === 'loading' && <ListSkeleton />}

      {loadState === 'error' && (
        <EmptyState
          icon="alert"
          tone="warning"
          title="Projeler yüklenemedi"
          body="Listeye ulaşılamadı. Backend :8420 çalışıyor mu kontrol edip yeniden dene."
          action={
            <Button variant="secondary" onClick={() => void load('initial')}>
              Tekrar dene
            </Button>
          }
        />
      )}

      {loadState === 'ready' && projects.length === 0 && (
        <EmptyState
          icon="inbox"
          title="Henüz proje yok"
          body="Kök klasörde proje bulunamadı. Klasörleri ekledikten sonra taramayı başlat."
          action={
            <Button onClick={handleScan} disabled={scanning}>
              <Icon name="refresh" size={14} spin={scanning} />
              {scanning ? 'Taranıyor…' : 'Projeleri tara'}
            </Button>
          }
        />
      )}

      {loadState === 'ready' && projects.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onInterviewStart={setInterviewFor}
              onSynced={() => void load('refresh')}
            />
          ))}
        </ul>
      )}

      {interviewFor && (
        <InterviewWizard
          projectId={interviewFor.id}
          projectName={interviewFor.displayName}
          onClose={() => setInterviewFor(null)}
          onCompleted={() => void load('refresh')}
        />
      )}
    </section>
  )
}

function ListSkeleton() {
  return (
    <ul
      className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <li
          key={i}
          className="rounded-lg border border-border bg-surface p-4 shadow-card"
        >
          <div className="h-4 w-3/4 animate-pulse rounded bg-sunken" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-sunken" />
          <div className="mt-6 border-t border-border pt-3">
            <div className="h-4 w-28 animate-pulse rounded-full bg-sunken" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-sunken" />
          </div>
        </li>
      ))}
    </ul>
  )
}
