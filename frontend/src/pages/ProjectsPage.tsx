import { PagePlaceholder } from '../components/PagePlaceholder'
import { TickStrip } from '../components/TickStrip'

export function ProjectsPage() {
  return (
    <PagePlaceholder
      eyebrow="genel bakış"
      title="Projeler"
      description="Kök yolun altındaki her klasör bir proje. Kartlar; kısa açıklama, doküman rozetleri ve ROADMAP'ten sayılan ilerlemeyi gösterecek."
      roadmapNote="M1 — Proje keşfi ve liste: tarama servisi, GET /api/projects ve kart listesi."
    >
      <div className="mt-8">
        <p className="eyebrow">ilerleme böyle görünecek</p>
        <div className="mt-3 rounded-md border border-rule bg-panel px-4 py-4">
          <TickStrip done={3} total={7} label="M0 — Ortam ve iskelet" />
        </div>
      </div>
    </PagePlaceholder>
  )
}
