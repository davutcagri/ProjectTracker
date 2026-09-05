import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/*
  Basit modal (yüzen panel) kabuğu — harici kütüphane yok.
  "Portal" = React ağacının başka bir yerinde dursa da DOM'da <body>'nin
  sonuna basılan içerik; böylece panel sayfadaki hiçbir `overflow`/`z-index`
  kısıtından etkilenmez.

  - Arka plana (backdrop) tıklama ve Esc tuşu `onClose` çağırır.
  - Açıkken sayfa gövdesinin kaydırması kilitlenir.
  - `labelledBy` = paneldeki başlık elemanının id'si (erişilebilirlik).
*/

interface ModalProps {
  onClose: () => void
  labelledBy: string
  children: ReactNode
}

export function Modal({ onClose, labelledBy, children }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="my-auto w-full max-w-lg rounded-lg border border-border bg-surface shadow-card-hover"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
