---
updated: 2026-09-02
version: v1-mvp
---

# ProjectTracker — Yol Haritası (v1)

İlerleme, aşağıdaki onay kutularından hesaplanır. Portal bu dosyayı kendi ilerleme
çubuğu için de aynı şekilde parse eder: `- [x]` tamamlandı, `- [ ]` bekliyor.

Milestone'lar bağımlılık sırasına dizilmiştir; yukarıdan aşağıya ilerlenir.

## M0 — Ortam ve iskelet

- [x] `brew install maven` ve `java -version` ile JDK 17 doğrulaması
- [x] Spring Boot projesi: Spring Web, Spring Data JPA, H2, Validation
- [x] JGit (`org.eclipse.jgit`) ve Jackson bağımlılıkları
- [x] Vite + React + TS + Tailwind + React Router + axios frontend projesi
- [x] `frontend-maven-plugin` ile build entegrasyonu (React `dist/` → `static/`)
- [x] `application.properties`: port 8420, H2 dosya modu, JPA `ddl-auto`
- [x] Sağlık kontrolü endpoint'i + boş React sayfası tek jar'dan servis ediliyor

## M1 — Proje keşfi ve liste

- [x] `app_settings` entity + tek satır seed (`root_path = ~/Documents/Projects`)
- [x] `project` entity + repository
- [x] Kök yol tarama servisi (birinci seviye alt klasörler, gizli olanlar hariç)
- [x] `POST /api/projects/scan` — yeni/silinen projeleri senkronla
- [x] Açılışta otomatik tarama (`ApplicationRunner`)
- [x] `GET /api/projects` — liste endpoint'i
- [x] Frontend: proje listesi sayfası + kartlar + "Projeleri Tara" butonu
- [x] Frontend: Ayarlar sayfası — kök yol düzenleme

## M2 — Doküman parse ve detay

- [ ] Markdown okuyucu: `README.md` / `SCOPE.md` / `ROADMAP.md` varlık + içerik
- [ ] Frontmatter (`updated:`) parser
- [ ] ROADMAP checkbox parser → milestone listesi + milestone/proje ilerleme %
- [ ] `GET /api/projects/{id}` — render içerik + milestone'lar + ilerleme
- [ ] `POST /api/projects/{id}/sync` — dosyalar varsa parse et
- [ ] Frontend: detay sayfası (3 sekme + milestone listesi + ilerleme çubuğu)
- [ ] Frontend: kartta ilerleme çubuğu + doküman rozetleri (README/SCOPE/ROADMAP)
- [ ] `project.notes` — serbest not alanı (kaydet/oku)

## M3 — Git metadata (JGit)

- [ ] Proje git repo'su mu tespiti
- [ ] Son commit tarihi + mesajı, branch sayısı, commit sayısı
- [ ] "Son aktivite" = git ise son commit tarihi, değilse `.md` dosya mtime'ı
- [ ] Detay sayfasında git istatistik bölümü
- [ ] Kartta son aktivite tarihi

## M4 — Claude agent ve interview döngüsü

- [ ] `portal-doc-generator.json` agent tanımı (system prompt + tool allowlist)
- [ ] Agent system prompt: `<portal-questions>` soru formatı (hibrit: açık uçlu
      varsayılan + opsiyonel `choice`/`multi`), `<portal-done>` bitiş sinyali,
      "yalnızca eksik `*.md`", dil kuralı
- [ ] `ClaudeRunner` arayüzü + `ProcessBuilder` implementasyonu
      (`--agents`, `--agent`, `--session-id`, `--output-format stream-json`)
- [ ] `stream-json` çıktı parser'ı (session_id, son mesaj, `<portal-questions>` /
      `<portal-done>` blokları)
- [ ] PreToolUse hook: yazma yalnızca proje kökü `*.md`
- [ ] `interview_session` entity
- [ ] `POST /api/projects/{id}/interview/start` — dosya eksikse yeni session
- [ ] `POST /api/projects/{id}/interview/answers` — `--resume` ile devam (async, `202`)
- [ ] `GET /api/projects/{id}/interview` — durum + bekleyen sorular (polling)
- [ ] Global kilit (aynı anda tek interview)
- [ ] 5 dakika tur timeout
- [ ] Frontend: interview sihirbazı — soru tipine göre render (`text`/`textarea`
      metin kutusu, `choice` radyo + "Diğer", `multi` checkbox), her soruda "Geç",
      "Claude düşünüyor" spinner'ı, İptal butonu
- [ ] Frontend: kartta Sync eksik dosya bulunca interview akışını tetikler

## M5 — Oturum temizliği ve loglar

- [ ] `<portal-done>` → `interview_session` satırı sil
- [ ] `@Scheduled` 24 saat TTL süpürücüsü → terk edilmiş oturumları sil
- [ ] `claude_run` entity + her çağrıda kayıt (exit code, stderr son satırları,
      süre, sonuç)
- [ ] 30 günden eski `claude_run` satırlarını temizleyen `@Scheduled` görev
- [ ] `GET /api/logs` — çağrı geçmişi endpoint'i
- [ ] Frontend: Loglar sayfası

## M6 — Hata yönetimi ve cilalama

- [ ] `claude` hata/timeout → `ERROR` durumu + `claude_run` log kaydı
- [ ] Frontend: hata kartı ("claude çağrısı başarısız oldu") + "Tekrar Dene"
- [ ] "Giriş yapılmamış" durumunda net mesaj
- [ ] Boş durumlar (proje yok, kök yol geçersiz, doküman yok)
- [ ] Genel görsel geçiş + responsive kontrol

## M7 — Paketleme (.app)

- [ ] `jpackage` script'i (`ProjectTracker.app`, gömülü JRE, fat jar)
- [ ] Uygulama açılışında `Desktop.browse("http://localhost:8420")`
- [ ] Uygulamadan çıkınca Spring Boot graceful shutdown
- [ ] Zaten çalışıyorsa ikinci başlatmada yalnızca tarayıcı aç
- [ ] Kurulum notları (Gatekeeper ilk açılış uyarısı dahil)
- [ ] `/Applications` veya Dock'a yerleştirme talimatı

## M8 — Opsiyonel / v2 adayları

- [ ] Var olan `*.md` dosyalarını Claude ile güncelleme
- [ ] Birden fazla kök yol
- [ ] Canlı dosya izleme (WatchService)
- [ ] Proje etiketleri / filtreleme / sıralama
- [ ] Dashboard: tüm projelerin toplu ilerleme özeti
