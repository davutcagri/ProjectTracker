import { PagePlaceholder } from '../components/PagePlaceholder'

export function ProjectDetailPage() {
  return (
    <PagePlaceholder
      title="Proje detayı"
      description="README / SCOPE / ROADMAP sekmeleri, kendi yüzdesiyle milestone listesi, git istatistikleri ve serbest not alanı burada olacak."
      roadmapNote="M2 — Doküman parse ve detay: GET /api/projects/{id}, 3 sekme ve milestone listesi."
    />
  )
}
