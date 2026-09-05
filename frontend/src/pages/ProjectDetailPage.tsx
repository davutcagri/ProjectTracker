import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { fetchProjectDetail, syncProject } from '../api/projects'
import type { ProjectDetail } from '../api/types'
import { MilestoneList } from '../components/MilestoneList'
import { ProgressMeter } from '../components/ProgressMeter'
import { ProjectDocTabs } from '../components/ProjectDocTabs'
import { ProjectNotes } from '../components/ProjectNotes'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

/*
  Proje detay sayfası (ROADMAP M2 madde 5, SCOPE §8 "Proje detay sayfası").
  - GET /api/projects/{id}: 3 doküman sekmesi + milestone listesi + genel ilerleme.
  - "Sync" -> POST /api/projects/{id}/sync; dönen güncel detayla sayfa güncellenir.
  - Olmayan id -> backend 404 `{ error: 'Project not found' }` -> "bulunamadı" durumu.
*/

type LoadState = 'loading' | 'ready' | 'notFound' | 'error'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  async function load(projectId: string) {
    setLoadState('loading')
    try {
      const data = await fetchProjectDetail(projectId)
      setDetail(data)
      setLoadState('ready')
    } catch (err) {
      setLoadState(
        isAxiosError(err) && err.response?.status === 404 ? 'notFound' : 'error',
      )
    }
  }

  useEffect(() => {
    if (id) void load(id)
  }, [id])

  async function handleSync() {
    if (!id) return
    setSyncing(true)
    setSyncError(null)
    try {
      const updated = await syncProject(id)
      setDetail(updated)
    } catch {
      setSyncError('Sync başarısız oldu. Backend :8420 çalışıyor mu?')
    } finally {
      setSyncing(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <section className="max-w-5xl">
        <BackLink />
        <div className="mt-4 flex items-center gap-2.5 text-[13px] text-fg-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sunken border-t-accent" />
          Proje yükleniyor…
        </div>
      </section>
    )
  }

  if (loadState === 'notFound') {
    return (
      <section className="max-w-xl">
        <BackLink />
        <EmptyState
          icon="alert"
          tone="warning"
          title="Proje bulunamadı"
          body="Bu id ile eşleşen bir proje yok. Kök klasörden silinmiş ya da hiç var olmamış olabilir."
        />
      </section>
    )
  }

  if (loadState === 'error' || !detail) {
    return (
      <section className="max-w-xl">
        <BackLink />
        <EmptyState
          icon="alert"
          tone="warning"
          title="Proje yüklenemedi"
          body="Detaya ulaşılamadı. Backend :8420 çalışıyor mu kontrol edip yeniden dene."
          action={
            <Button variant="secondary" onClick={() => id && void load(id)}>
              Tekrar dene
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section className="max-w-5xl">
      <BackLink />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-[-0.02em] text-fg">
            {detail.displayName}
          </h1>
          <p
            className="mt-1 flex items-center gap-1.5 font-mono text-[12px] text-fg-subtle"
            title={detail.path}
          >
            <Icon name="folder" size={12} className="shrink-0" />
            <span className="truncate">{detail.path}</span>
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="shrink-0">
          <Icon name="refresh" size={14} spin={syncing} />
          {syncing ? 'Sync ediliyor…' : 'Sync'}
        </Button>
      </div>

      {syncError && (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-warning/25 bg-warning-soft px-3 py-2 text-[13px] text-warning">
          <Icon name="alert" size={15} className="shrink-0" />
          {syncError}
        </p>
      )}

      <div className="mt-5 max-w-sm">
        <ProgressMeter percent={detail.progress} label="Genel ilerleme" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <ProjectDocTabs docs={detail.docs} />

        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
            Milestone'lar
          </h2>
          <div className="mt-3">
            <MilestoneList milestones={detail.milestones} />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ProjectNotes key={detail.id} projectId={detail.id} initialNotes={detail.notes} />
      </div>
    </section>
  )
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg"
    >
      <Icon name="arrowRight" size={14} className="rotate-180" />
      Projeler
    </Link>
  )
}
