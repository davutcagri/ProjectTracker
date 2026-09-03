import type { ReactNode } from 'react'
import { Icon } from './ui/Icon'

/*
  M0 iskeleti: sayfaların gerçek içeriği M1+ görevlerinde gelecek.
  O zamana kadar Loglar ve Proje detay sayfaları bu ortak
  "yapım aşamasında" kabuğunu kullanır.
*/

interface PagePlaceholderProps {
  title: string
  description?: string
  roadmapNote: string
  children?: ReactNode
}

export function PagePlaceholder({
  title,
  description,
  roadmapNote,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="max-w-2xl">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 max-w-md text-[14px] text-fg-muted">{description}</p>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
          <Icon name="settings" size={16} />
        </span>
        <div>
          <p className="text-[13px] font-medium text-fg">Yapım aşamasında</p>
          <p className="mt-0.5 text-[13px] text-fg-muted">{roadmapNote}</p>
        </div>
      </div>

      {children}
    </section>
  )
}
