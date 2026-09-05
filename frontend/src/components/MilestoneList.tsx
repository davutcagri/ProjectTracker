import type { MilestoneStatus, ProjectMilestone } from '../api/types'
import { ProgressMeter } from './ProgressMeter'
import { EmptyState } from './ui/EmptyState'

/*
  Milestone listesi — ROADMAP.md'deki her `## <Milestone>` başlığı bir satır
  (SCOPE §5 / §8). Durum backend'den İngilizce gelir, burada çeviriyoruz.
*/

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  Empty: 'Boş',
  'Not Started': 'Başlanmadı',
  'In Progress': 'Devam ediyor',
  Completed: 'Tamamlandı',
}

const STATUS_TONE: Record<MilestoneStatus, string> = {
  Empty: 'bg-sunken text-fg-subtle',
  'Not Started': 'bg-sunken text-fg-muted',
  'In Progress': 'bg-warning-soft text-warning',
  Completed: 'bg-success-soft text-success',
}

function MilestoneRow({ milestone }: { milestone: ProjectMilestone }) {
  return (
    <li className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13.5px] font-semibold text-fg">{milestone.name}</h3>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[milestone.status]}`}
        >
          {STATUS_LABEL[milestone.status]}
        </span>
      </div>
      <div className="mt-3">
        <ProgressMeter
          done={milestone.completedTasks}
          total={milestone.totalTasks}
          emptyLabel="Görev yok"
          label="Görevler"
        />
      </div>
    </li>
  )
}

export function MilestoneList({ milestones }: { milestones: ProjectMilestone[] }) {
  if (milestones.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="Milestone yok"
        body="ROADMAP.md bulunamadı ya da içinde henüz bir milestone (## başlığı) yok."
      />
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {milestones.map((milestone) => (
        <MilestoneRow key={milestone.name} milestone={milestone} />
      ))}
    </ul>
  )
}
