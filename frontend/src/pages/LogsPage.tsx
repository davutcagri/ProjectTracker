import { PagePlaceholder } from '../components/PagePlaceholder'

export function LogsPage() {
  return (
    <PagePlaceholder
      eyebrow="çalıştırma geçmişi"
      title="Loglar"
      description="Her claude çağrısı burada tablo halinde: süre, çıkış kodu, sonuç ve hata varsa son satırları."
      roadmapNote="M5 — Oturum temizliği ve loglar: claude_run kaydı ve GET /api/logs."
    />
  )
}
