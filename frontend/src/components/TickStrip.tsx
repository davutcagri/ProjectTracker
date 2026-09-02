/*
  TickStrip — bu arayüzün imza öğesi.
  İlerleme, yuvarlak bir çubuk yerine küçük kare hücrelerle gösterilir;
  her hücre ROADMAP.md'deki bir onay kutusudur (- [x] dolu, - [ ] boş).
  Böylece görsel dil, ilerlemenin gerçek kaynağıyla birebir örtüşür.
*/

interface TickStripProps {
  done: number
  total: number
  /** Hücreler tek satıra sığmazsa kaç hücrede sarılacağı. */
  wrapAt?: number
  label?: string
}

export function TickStrip({ done, total, wrapAt = 24, label }: TickStripProps) {
  if (total <= 0) {
    return <span className="eyebrow">yol haritası yok</span>
  }

  const cells = Array.from({ length: Math.min(total, wrapAt * 3) })
  const pct = Math.round((done / total) * 100)

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex flex-wrap gap-[3px]"
        role="img"
        aria-label={`${done} / ${total} görev tamam (%${pct})`}
      >
        {cells.map((_, i) => (
          <span
            key={i}
            className={
              'h-2.5 w-2.5 rounded-[1px] ' +
              (i < done ? 'bg-done' : 'border border-rule bg-transparent')
            }
          />
        ))}
      </div>
      <span className="eyebrow">
        {label ? `${label} · ` : ''}
        {done}/{total} · %{pct}
      </span>
    </div>
  )
}
