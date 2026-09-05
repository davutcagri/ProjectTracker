/*
  ProgressMeter — uygulamanın imza ilerleme göstergesi.
  (Eski adı TickStrip; konsept korundu, görünüm modernleşti.)

  İki kullanım biçimi var:
  - `done`/`total` — görev sayısı bilinen yerlerde (milestone satırı). İlerleme
    segmentlerden oluşur: her segment ROADMAP.md'deki bir onay kutusudur
    ([x] dolu = tamam, [ ] boş = bekliyor). Görev sayısı `maxSegments`'i
    geçerse tek sürekli çubuğa düşer (oran korunur).
  - `percent` — ham yüzde (proje geneli gibi görev sayısı olmayan yerlerde).
    Her zaman sürekli çubuk olarak çizilir, sayaç metni yalnızca "%NN".

  `size="sm"` alt etiket satırını kaldırır, çubuğu inceltir — kart gibi dar
  alanlarda kompakt gösterim için (M2 madde 6).
*/

interface ProgressMeterProps {
  label?: string
  maxSegments?: number
  size?: 'sm' | 'md'
  /** Veri hiç yokken gösterilecek metin (ör. milestone'da "Görev yok"). */
  emptyLabel?: string
  done?: number
  total?: number
  percent?: number
}

export function ProgressMeter({
  done,
  total,
  percent,
  label,
  maxSegments = 28,
  size = 'md',
  emptyLabel = 'Yol haritası yok',
}: ProgressMeterProps) {
  const hasTaskCounts = done !== undefined && total !== undefined && total > 0
  const usingPercent = percent !== undefined

  if (!usingPercent && !hasTaskCounts) {
    return <span className="text-[12px] text-fg-subtle">{emptyLabel}</span>
  }

  const safeDone = hasTaskCounts ? Math.max(0, Math.min(done!, total!)) : 0
  const pct = usingPercent
    ? Math.max(0, Math.min(100, Math.round(percent!)))
    : Math.round((safeDone / total!) * 100)
  const segmented = hasTaskCounts && !usingPercent && total! <= maxSegments
  const barHeight = size === 'sm' ? 'h-1' : 'h-1.5'
  const counterText = usingPercent ? `%${pct}` : `${safeDone}/${total} · %${pct}`
  const ariaLabel = usingPercent
    ? `%${pct} tamamlandı`
    : `${safeDone} / ${total} görev tamam, %${pct}`

  return (
    <div className="flex flex-col gap-1.5" role="img" aria-label={ariaLabel}>
      {segmented ? (
        <div className="flex gap-[3px]">
          {Array.from({ length: total! }).map((_, i) => (
            <span
              key={i}
              className={
                `${barHeight} flex-1 rounded-[2px] ` +
                (i < safeDone ? 'bg-accent' : 'bg-sunken')
              }
            />
          ))}
        </div>
      ) : (
        <div className={`${barHeight} w-full overflow-hidden rounded-full bg-sunken`}>
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {size === 'md' ? (
        <div className="flex items-center justify-between text-[12px] text-fg-muted">
          <span>{label ?? 'İlerleme'}</span>
          <span className="tabular-nums">{counterText}</span>
        </div>
      ) : (
        <span className="text-[11px] tabular-nums text-fg-subtle">{counterText}</span>
      )}
    </div>
  )
}
