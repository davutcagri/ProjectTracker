import type { ReactNode } from 'react'

/*
  M0 iskeleti: sayfaların gerçek içeriği M1+ görevlerinde gelecek.
  O zamana kadar tüm sayfalar bu ortak "yapım aşamasında" kabuğunu kullanır.
*/

interface PagePlaceholderProps {
  eyebrow: string
  title: string
  description: string
  roadmapNote: string
  children?: ReactNode
}

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  roadmapNote,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="max-w-xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 text-ink-soft">{description}</p>

      <div className="mt-6 rounded-md border border-rule bg-panel px-4 py-3">
        <p className="eyebrow">yapım aşamasında</p>
        <p className="mt-1 text-[13px] text-ink-soft">{roadmapNote}</p>
      </div>

      {children}
    </section>
  )
}
