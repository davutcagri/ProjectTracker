import { useCallback, useEffect, useState } from 'react'
import { fetchLogs } from '../api/logs'
import type { ClaudeRun } from '../api/types'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'

/*
  Loglar sayfası (ROADMAP M5 madde 6, SCOPE §8 "Loglar sayfası").
  GET /api/logs → her `claude` çağrısının kaydı, en yeni üstte. Hata ayrıntıları
  (stderr son satırları) FAILED satırlarında "detay" ile açılır (SCOPE §9).

  Geniş ekranda hizalı bir tablo; dar ekranda (< md) her kayıt bir yığın kart.
*/

type LoadState = 'loading' | 'ready' | 'error'

const startFmt = new Intl.DateTimeFormat('tr', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** ISO tarihi yerel biçime çevirir; geçersizse ham metni döner. */
function formatStart(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : startFmt.format(date)
}

/** Milisaniyeyi okunur süreye çevirir: "840 ms", "68.1 sn", "1 dk 8 sn". */
function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const totalSeconds = ms / 1000
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)} sn`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return seconds === 0 ? `${minutes} dk` : `${minutes} dk ${seconds} sn`
}

export function LogsPage() {
  const [runs, setRuns] = useState<ClaudeRun[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [refreshing, setRefreshing] = useState(false)

  // `loadState` başlangıçta zaten 'loading'; effect'te senkron setState yapmamak
  // için ilk yüklemede durumu değiştirmiyoruz (yalnızca sonuç gelince).
  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true)
    try {
      const data = await fetchLogs()
      setRuns(data)
      setLoadState('ready')
    } catch {
      if (mode === 'initial') setLoadState('error')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load('initial')
  }, [load])

  const showCount = loadState === 'ready' && runs.length > 0

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">
            Loglar
          </h1>
          {showCount && (
            <span className="rounded-full bg-sunken px-2 py-0.5 text-[12px] font-medium tabular-nums text-fg-muted">
              {runs.length}
            </span>
          )}
        </div>
        {loadState === 'ready' && (
          <Button
            variant="secondary"
            onClick={() => void load('refresh')}
            disabled={refreshing}
            className="shrink-0"
          >
            <Icon name="refresh" size={14} spin={refreshing} />
            {refreshing ? 'Yenileniyor…' : 'Yenile'}
          </Button>
        )}
      </div>

      {loadState === 'loading' && <TableSkeleton />}

      {loadState === 'error' && (
        <EmptyState
          icon="alert"
          tone="warning"
          title="Loglar yüklenemedi"
          body="Çağrı geçmişine ulaşılamadı. Backend :8420 çalışıyor mu kontrol edip yeniden dene."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setLoadState('loading')
                void load('initial')
              }}
            >
              Tekrar dene
            </Button>
          }
        />
      )}

      {loadState === 'ready' && runs.length === 0 && (
        <EmptyState
          icon="logs"
          title="Henüz Claude çağrısı yok"
          body={
            <>
              Bir projede Sync ile doküman üretimi başlattığında, her{' '}
              <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[12px] text-fg">
                claude
              </code>{' '}
              çağrısı süresi ve sonucuyla burada listelenir.
            </>
          }
        />
      )}

      {loadState === 'ready' && runs.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <div className="hidden grid-cols-[1fr_150px_100px_224px] gap-4 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle md:grid">
            <span>Proje</span>
            <span>Başlangıç</span>
            <span>Süre</span>
            <span>Sonuç</span>
          </div>
          <ul className="divide-y divide-border">
            {runs.map((run) => (
              <LogRow key={run.id} run={run} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function OutcomeBadge({ run }: { run: ClaudeRun }) {
  const failed = run.outcome === 'FAILED'
  const tone = failed
    ? 'bg-danger-soft text-danger'
    : 'bg-success-soft text-success'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {failed ? 'Başarısız' : 'Başarılı'}
    </span>
  )
}

function LogRow({ run }: { run: ClaudeRun }) {
  const [open, setOpen] = useState(false)
  const hasDetail = run.outcome === 'FAILED'
  const start = formatStart(run.startedAt)
  const duration = formatDuration(run.durationMs)
  const exitText = `çıkış ${run.exitCode}`

  return (
    <li className="text-[13px]">
      <div
        className={
          'px-4 py-3 md:grid md:grid-cols-[1fr_150px_100px_224px] md:items-center md:gap-4 ' +
          (hasDetail ? 'transition-colors hover:bg-sunken/40' : '')
        }
      >
        {/* Proje + (dar ekranda) sonuç rozeti */}
        <div className="flex min-w-0 items-center justify-between gap-3 md:justify-start">
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-accent" aria-hidden>
              ›
            </span>
            <span
              className="min-w-0 truncate font-medium text-fg"
              title={run.projectDisplayName}
            >
              {run.projectDisplayName}
            </span>
          </span>
          <span className="shrink-0 md:hidden">
            <OutcomeBadge run={run} />
          </span>
        </div>

        {/* Başlangıç */}
        <time
          dateTime={run.startedAt}
          className="mt-1 block text-[12px] tabular-nums text-fg-subtle md:mt-0 md:text-[13px] md:text-fg-muted"
        >
          <span className="md:hidden">Başlangıç: </span>
          {start}
        </time>

        {/* Süre */}
        <span className="mt-0.5 block font-mono text-[12px] tabular-nums text-fg-subtle md:mt-0 md:text-[13px] md:text-fg-muted">
          <span className="font-sans md:hidden">Süre: </span>
          {duration}
        </span>

        {/* Sonuç (geniş ekran): rozet + çıkış kodu + detay */}
        <div className="mt-2 flex items-center gap-2 md:mt-0">
          <span className="hidden md:inline-flex">
            <OutcomeBadge run={run} />
          </span>
          <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-fg-subtle">
            {exitText}
          </span>
          {hasDetail && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
            >
              <Icon
                name="arrowRight"
                size={12}
                className={open ? 'rotate-90 transition-transform' : 'transition-transform'}
              />
              detay
            </button>
          )}
        </div>
      </div>

      {hasDetail && open && (
        <div className="px-4 pb-3 md:pl-9">
          <pre className="overflow-x-auto rounded-md border border-border bg-sunken p-3 text-[12px] leading-relaxed text-fg-muted">
            {run.stderrTail?.trim() || 'Bu çağrı için stderr çıktısı kaydedilmedi.'}
          </pre>
        </div>
      )}
    </li>
  )
}

function TableSkeleton() {
  return (
    <div
      className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-card"
      aria-hidden
    >
      <ul className="divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-4 flex-1 animate-pulse rounded bg-sunken" />
            <div className="hidden h-3 w-32 animate-pulse rounded bg-sunken sm:block" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-sunken" />
          </li>
        ))}
      </ul>
    </div>
  )
}
