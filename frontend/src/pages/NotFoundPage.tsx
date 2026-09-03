import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'

export function NotFoundPage() {
  return (
    <section className="max-w-xl">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">
        Bu sayfa yok
      </h1>
      <p className="mt-1.5 max-w-md text-[14px] text-fg-muted">
        Aradığın yol bu uygulamada tanımlı değil.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent-hover"
      >
        Projeler'e dön
        <Icon name="arrowRight" size={14} />
      </Link>
    </section>
  )
}
