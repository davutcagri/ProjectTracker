import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/*
  Boş / hata durumları için ortak, cilalı kutu: tonlu daire içinde ikon,
  başlık, açıklama ve isteğe bağlı eylem butonu.
  tone: 'neutral' (boş liste) | 'warning' (bir şeyler ters gitti).
*/

interface EmptyStateProps {
  icon: IconName
  title: string
  body: ReactNode
  tone?: 'neutral' | 'warning'
  action?: ReactNode
}

const TONE = {
  neutral: 'bg-sunken text-fg-muted',
  warning: 'bg-warning-soft text-warning',
}

export function EmptyState({
  icon,
  title,
  body,
  tone = 'neutral',
  action,
}: EmptyStateProps) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full ${TONE[tone]}`}
      >
        <Icon name={icon} size={20} />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-fg">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[13px] text-fg-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
