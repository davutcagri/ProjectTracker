import type { ButtonHTMLAttributes } from 'react'

/*
  Tek buton bileşeni — uygulamadaki üç kullanım (Projeleri tara, Kaydet,
  Tekrar dene) aynı ölçü ve davranışı paylaşsın diye.
  variant: 'primary' (mor, ana eylem) | 'secondary' (beyaz, ikincil).
*/

type Variant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg shadow-card hover:bg-accent-hover disabled:hover:bg-accent',
  secondary:
    'border border-border bg-surface text-fg hover:bg-sunken disabled:hover:bg-surface',
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${className ?? ''}`}
      {...rest}
    />
  )
}
