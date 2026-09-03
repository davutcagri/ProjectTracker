/*
  ProgressMeter — uygulamanın imza ilerleme göstergesi.
  (Eski adı TickStrip; konsept korundu, görünüm modernleşti.)

  İlerleme sürekli bir çubuk değil, segmentlerden oluşur: her segment
  ROADMAP.md'deki bir onay kutusudur ([x] dolu = tamam, [ ] boş = bekliyor).
  Böylece görsel dil ilerlemenin gerçek kaynağıyla birebir örtüşür.

  Görev sayısı çoksa (maxSegments üstü) tek sürekli çubuğa düşer; oran korunur.
  M2'de proje kartında ve detay sayfasında milestone başına kullanılacak.
*/

interface ProgressMeterProps {
  done: number
  total: number
  label?: string
  maxSegments?: number
}

export function ProgressMeter({
  done,
  total,
  label,
  maxSegments = 28,
}: ProgressMeterProps) {
  if (total <= 0) {
    return <span className="text-[12px] text-fg-subtle">Yol haritası yok</span>
  }

  const safeDone = Math.max(0, Math.min(done, total))
  const pct = Math.round((safeDone / total) * 100)
  const segmented = total <= maxSegments

  return (
    <div
      className="flex flex-col gap-1.5"
      role="img"
      aria-label={`${safeDone} / ${total} görev tamam, %${pct}`}
    >
      {segmented ? (
        <div className="flex gap-[3px]">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={
                'h-1.5 flex-1 rounded-[2px] ' +
                (i < safeDone ? 'bg-accent' : 'bg-sunken')
              }
            />
          ))}
        </div>
      ) : (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-[12px] text-fg-muted">
        <span>{label ?? 'İlerleme'}</span>
        <span className="tabular-nums">
          {safeDone}/{total} · %{pct}
        </span>
      </div>
    </div>
  )
}
