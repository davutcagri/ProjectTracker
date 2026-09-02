import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="max-w-md">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight">
        Bu sayfa yok
      </h1>
      <p className="mt-3 text-ink-soft">
        Aradığın yol bu uygulamada tanımlı değil.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block font-mono text-[13px] text-done underline underline-offset-4"
      >
        Projeler'e dön
      </Link>
    </section>
  )
}
