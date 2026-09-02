import { useParams } from 'react-router-dom'
import { PagePlaceholder } from '../components/PagePlaceholder'

export function ProjectDetailPage() {
  const { id } = useParams()

  return (
    <PagePlaceholder
      eyebrow={`proje #${id ?? '?'}`}
      title="Proje detayı"
      description="README / SCOPE / ROADMAP sekmeleri, kendi yüzdesiyle milestone listesi, git istatistikleri ve serbest not alanı burada olacak."
      roadmapNote="M2 — Doküman parse ve detay: GET /api/projects/{id}, 3 sekme ve milestone listesi."
    />
  )
}
