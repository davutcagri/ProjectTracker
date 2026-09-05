import type { ReactNode } from 'react'
import { Icon } from './ui/Icon'

/*
  Proje detay sayfasındaki git istatistik bölümü (ROADMAP M3 madde 4).

  Ayraç alan `gitRepo`:
  - false → klasör bir git deposu değil, kısa bilgi satırı gösterilir.
  - true  → branch (dal) sayısı, commit sayısı ve son commit (tarih + mesaj).
            `commitCount === 0` (boş depo) → "Henüz commit yok"; tarih/mesaj null gelir.

  Kart stili MilestoneList / ProjectNotes ile aynı tutuldu (aynı görsel dil).
*/

interface GitStatsProps {
  gitRepo: boolean
  lastCommitDate: string | null
  lastCommitMessage: string | null
  branchCount: number | null
  commitCount: number | null
}

const commitDateFmt = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Geçerli ISO tarihi biçimlenmiş metne çevirir, değilse null. */
function formatCommitDate(iso: string): string | null {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : commitDateFmt.format(date)
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
        Git
      </h2>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md bg-sunken px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-fg">
        {value ?? '—'}
      </p>
    </div>
  )
}

export function GitStats({
  gitRepo,
  lastCommitDate,
  lastCommitMessage,
  branchCount,
  commitCount,
}: GitStatsProps) {
  if (!gitRepo) {
    return (
      <Panel>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-fg-muted">
          <Icon name="folder" size={14} className="shrink-0" />
          Bu klasör bir git deposu değil.
        </p>
      </Panel>
    )
  }

  const hasCommits = (commitCount ?? 0) > 0 && lastCommitDate !== null
  const commitDate = lastCommitDate ? formatCommitDate(lastCommitDate) : null
  const commitMessage = lastCommitMessage?.split('\n')[0].trim() || null

  return (
    <Panel>
      <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_7rem_1fr]">
        <Stat label="Branch" value={branchCount} />
        <Stat label="Commit" value={commitCount} />

        <div className="min-w-0 rounded-md bg-sunken px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-fg-subtle">
            Son commit
          </p>
          {hasCommits ? (
            <>
              <p
                className="mt-0.5 truncate text-[13px] text-fg"
                title={commitMessage ?? undefined}
              >
                {commitMessage ?? 'Mesaj yok'}
              </p>
              {commitDate && (
                <p className="text-[12px] tabular-nums text-fg-muted">
                  <time dateTime={lastCommitDate ?? undefined}>{commitDate}</time>
                </p>
              )}
            </>
          ) : (
            <p className="mt-0.5 text-[13px] text-fg-muted">Henüz commit yok.</p>
          )}
        </div>
      </div>
    </Panel>
  )
}
