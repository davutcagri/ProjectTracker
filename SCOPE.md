---
updated: 2026-09-06
version: v1-mvp
---

# ProjectTracker — Kapsam Dokümanı (v1 / MVP)

## 1. Amaç

Yerel diskteki geliştirme projelerinin **ilerleme durumunu, kapsamını ve yol
haritasını** tek bir web portalinden görüntülemek.

Portal, her projenin kök dizinindeki `README.md`, `SCOPE.md` ve `ROADMAP.md`
dosyalarını okuyup görselleştirir. Bu dosyalar yoksa, yerel `claude` CLI'yı o
dizinde çalıştırıp **portal arayüzünden yürütülen, çoğunlukla açık uçlu (gerektiğinde
şıklı) bir soru-cevap akışıyla** oluşturur.

## 2. Kullanıcı modeli

- **Tek kullanıcı.** Kimlik doğrulama yok. Yalnızca `localhost`'tan erişilir;
  bağlanan = sahibi.
- Çok kullanıcı, roller, kayıt: **kapsam dışı**.

## 3. Mimari

Tek bir Java process:

```
                         ProjectTracker.app  (jpackage: gömülü JRE + fat jar)
                     ┌───────────────────────────────────────────────┐
   Tarayıcı  ◀─────▶ │  Spring Boot (Java 17)          :8420          │
   localhost:8420    │   ├─ REST API                                  │
                     │   ├─ Statik SPA (React derlenmiş, jar içinde)  │
                     │   ├─ H2 (dosya modu)  ── portal meta verisi    │
                     │   ├─ JGit             ── git metadata          │
                     │   └─ ClaudeRunner ────────────┐               │
                     └───────────────────────────────┼───────────────┘
                                                     │ ProcessBuilder
                                                     ▼
                                       claude -p  (alt process, cwd = proje dizini)
                                                     │
                                                     ▼
                                   ~/Documents/Projects/<proje>/*.md
```

**Markdown dosyaları tek doğruluk kaynağıdır.** DB yalnızca portalın kendi
durumunu tutar; kapsam / ilerleme / yol haritası verisi her Sync'te dosyalardan
yeniden hesaplanır (cache yok).

## 4. Proje keşfi

- **Kök yol** `app_settings` tablosunda saklanır, web arayüzünden düzenlenebilir.
  Varsayılan: `~/Documents/Projects`.
- **"Projeleri Tara"** (liste sayfası + uygulama açılışında otomatik): kök yolun
  birinci seviye alt klasörlerini okur. Gizli klasörler (`.` ile başlayan) hariç
  her alt klasör bir projedir. Kök klasörde yeni bulunan klasörler `project`
  tablosuna eklenir; kök klasörde artık bulunmayan projelerin DB kaydı **silinir
  (hard delete)** — "silinmiş" işareti / soft-delete yoktur.
- **Not:** bir proje kök klasörden silinip sonra tekrar eklenirse, o projeye ait
  `notes` ve `pinned` gibi portal alanları korunmaz; kayıt sıfırdan oluşturulur.
- **Proje başına "Sync"** (her kartta): o projenin kök dizininde `README.md` /
  `SCOPE.md` / `ROADMAP.md` var mı bakar.
  - **Varsa:** içeriği parse edip kartı ve detay sayfasını günceller.
  - **En az biri eksikse:** Claude interview'ını başlatır (bkz. §6). "Doküman
    Üret" işlevi bu butonun içindedir; ayrı buton yoktur.

## 5. Doküman modeli

Üç dosya, hepsi proje kök dizininde:

| Dosya | Portal ne yapar |
|---|---|
| `README.md` | Ham render (proje açıklaması) |
| `SCOPE.md` | Ham render |
| `ROADMAP.md` | **İlerlemenin kaynağı** — aşağıya bakın |

> **Not (v1):** `SCOPE.md` / `ROADMAP.md` başındaki `updated:` frontmatter alanı
> **v1'de parse EDİLMEZ**. Dokümanın tazeliği M3'te gelen git son commit tarihi
> (git repo değilse `.md` dosyasının değiştirilme zamanı — mtime) ile gösterilir;
> bu daha güvenilir bir "son aktivite" sinyalidir. `updated:` desteği M8'e ertelendi.

**İlerleme hesabı** — `ROADMAP.md` içinde `## <Milestone>` başlıkları altındaki
GitHub tarzı onay kutuları:

- `- [x]` tamamlanmış görev, `- [ ]` bekleyen görev
- Milestone ilerlemesi = işaretli / toplam
- Proje ilerlemesi = tüm milestone'lardaki işaretli / toplam
- Milestone statüsü: %0 → *Planlandı*, %100 → *Tamamlandı*, arası → *Devam ediyor*

Ekstra bir şablon/kural yok; bu format hem elle düzenlenebilir hem Claude
tarafından doğal üretilir.

## 6. Claude entegrasyonu

### 6.1 Agent tanımı

Portal repo'sunda tek dosya:
`backend/src/main/resources/agent/portal-doc-generator.json`.

Kendi system prompt'u, tool allowlist'i (`Read, Glob, Grep, Write, Edit`) ve
modeli olan, ProjectTracker'a özel bir Claude Code agent'ı. Global `~/.claude/`'a
**hiçbir şey kurulmaz**; hedef proje kirletilmez. Agent tanımı portal repo'sunda
versiyonlanır.

### 6.2 Çağrı

```
claude -p "<görev metni>" \
  --agents '<portal-doc-generator.json içeriği>' \
  --agent portal-doc-generator \
  --session-id <portal üretir: UUID> \
  --output-format stream-json
```

- `cwd` = proje kök dizini
- Her çağrı çalışır ve **process olarak çıkar** — turlar arası bekleyen process
  yoktur. Akış temiz bir istek/yanıt döngüsüdür.
- **Devam turunda (`--resume`) `--agents` + `--agent` yeniden verilir.** M4
  uygulamasında görüldü: satır içi (`--agents` JSON) agent tanımı session'a
  kalıcı yazılmıyor; her turda (start ve her `--resume`) tekrar geçilmezse agent
  yüklenmiyor. Eski "resume'da gerekmez" varsayımı yanlıştı.

### 6.3 stdout sözleşmesi

Agent, kullanıcı girdisine ihtiyaç duyduğunda son mesajında şunu yazar:

```
<portal-questions>
[
  {
    "id": "project-summary",
    "text": "Bu proje ne yapıyor? Kısaca özetle.",
    "type": "textarea",
    "choices": [],
    "placeholder": "örn. Öğrenciler için soru-cevap forumu…"
  },
  {
    "id": "license",
    "text": "Lisans tercihin?",
    "type": "choice",
    "choices": ["MIT", "Apache-2.0", "GPL-3.0", "Belirsiz / sonra"],
    "placeholder": null
  }
]
</portal-questions>
```

**Soru tipi (hibrit):** `type` alanı `text` | `textarea` | `choice` | `multi`
olabilir. **Varsayılan açık uçludur** (`textarea`); Claude yalnızca soru gerçekten
kapalı-kümeli olduğunda (`choice`/`multi`) şık listesi verir. `choices` yalnızca
bu iki tipte doludur. Her soru arayüzde "Geç" ile atlanabilir.

Portal bunu `stream-json` çıktısından parse eder, `interview_session
.pending_questions_json`'a yazar, arayüzde **sihirbaz olarak tek tek** gösterir.
Kullanıcı tüm soruları cevaplayınca portal `claude --resume <session-id> -p
"<cevaplar>"` ile devam eder.

İş bitince agent `<portal-done>` + 2-3 cümle özet yazar.

### 6.4 Kurallar

- Yalnızca **eksik** `*.md` dosyaları oluşturulur; var olanlar değiştirilmez.
- Sorular **varsayılan açık uçludur** (`textarea`); `choice`/`multi` yalnızca
  gerçekten kapalı-kümeli sorularda kullanılır. Böylece "proje özeti", "hedef
  kitle" gibi bilgiler serbestçe verilebilir.
- Yazma işlemleri proje kökündeki `*.md` ile sınırlı (PreToolUse hook ile zorlanır).
- Non-interactive permission modu: `--permission-mode acceptEdits` + PreToolUse
  hook. Hook `Write|Edit|MultiEdit` çağrılarını yakalar, yol proje kökünde bir
  `*.md` ise `allow` kararı döner, değilse reddeder. `acceptEdits` tek başına
  alt-klasör yazımını da açardı; güvenlik hook'un `allow`/deny kararından gelir.
  Hook ayarı `--settings` ile satır içi JSON olarak geçilir (global `~/.claude`
  kirletilmez).
- Tek tur timeout: **5 dakika**.
- **Global kilit:** aynı anda yalnızca bir interview çalışır; ikinci deneme
  "Başka bir interview sürüyor" ile engellenir.
- Üretilen dokümanların dili: projenin mevcut diline uyar, belirsizse **Türkçe**.

### 6.5 İstek işleme (async + polling)

- `POST /api/projects/{id}/interview/answers` → hemen `202 Accepted`; backend
  `@Async` ile `claude`'u çalıştırır.
- Frontend `GET /api/projects/{id}/interview` ile ~2 sn'de bir durum sorar:
  `RUNNING` → `WAITING_INPUT` / `DONE` / `ERROR`.

### 6.6 Oturum yaşam döngüsü ve temizlik

| Katman | Ne yapar |
|---|---|
| **`<portal-done>`** | Oturum `DONE` + kısa özet (`doneSummary`) ile işaretlenir; satır **anında silinmez**. Bir süpürücü (`@Scheduled`, dakikada bir) `DONE` olup ~2 dk'dır aktivitesi olmayan satırları siler. Bu nezaket süresi frontend'in `DONE` durumunu polling ile görebilmesi içindir. `~/.claude/` altına **dokunulmaz**. |
| **24 saat TTL süpürücüsü** (`@Scheduled`, saatte bir) | 24 saattir aktivitesi olmayan `RUNNING`/`WAITING_INPUT` oturumların ve 1 saatten eski `ERROR` oturumların DB satırını siler. (`ABANDONED` enum'ı tutuluyor ama kullanılmıyor — satır ara adım olmadan doğrudan siliniyor.) |
| **Claude Code yerleşik temizliği** (`cleanupPeriodDays`, varsayılan 30 gün) | Tüm `.jsonl` transkriptlerini zamanla otomatik siler. Portal bu dosyalara hiç dokunmaz. |

## 7. Veri modeli (H2)

**Kalıcı:**

- `project` — `id, path, display_name, pinned, notes, last_scan_at, docs_status`
- `app_settings` — tek satır; `root_path`
- `claude_run` — `id, project_id, session_id, started_at, duration_ms,
  exit_code, stderr_tail, outcome` (Loglar görünümü için; 30 günden eski satırlar
  temizlenir)

**Geçici** (tamamlanınca / terk edilince silinir):

- `interview_session` — `id, project_id, claude_session_id, status, started_at,
  last_activity_at, pending_questions_json`

**Türetilmiş** (DB'ye yazılmaz, her Sync'te dosyalardan hesaplanır):

- kapsam metni, milestone listesi, ilerleme %, son commit bilgisi, branch /
  commit sayısı

## 8. Arayüz

- **Liste sayfası:** proje kartları — ad · kısa açıklama (README/SCOPE ilk
  paragrafı) · ilerleme çubuğu · **tek birleşik doküman durumu rozeti** ("tam" /
  "eksik" / "bilinmiyor", mevcut `docsStatus` alanına dayanır — README/SCOPE/
  ROADMAP için üç ayrı rozet **v1'de gerekli değil**, MVP kararı 2026-09-05) ·
  son aktivite tarihi · dil/yapı ikonu · **Sync** butonu. ROADMAP yoksa çubuk
  yerine "Yol haritası yok". Üstte **"Projeleri Tara"**.
- **Proje detay sayfası:** 3 sekme (README / SCOPE / ROADMAP render edilmiş
  markdown) · ayrıştırılmış milestone listesi (her biri kendi %'siyle) · git
  istatistikleri (branch, son commit, commit sayısı) · serbest not alanı.
- **Interview sihirbazı:** modal/panel; Claude'un soruları tek tek. `text`/
  `textarea` → metin kutusu; `choice` → radyo + "Diğer"; `multi` → checkbox.
  Her soruda "Geç" var. "Claude düşünüyor…" spinner'ı (polling); "İptal" butonu.
- **Loglar sayfası:** `claude_run` kayıtları tablo halinde; hata detayları burada.
- **Ayarlar:** kök yol düzenleme.

## 9. Hata yönetimi

- `claude` non-zero exit / bozuk çıktı / 5 dk timeout → `interview_session
  .status = ERROR`, `claude_run.outcome = FAILED`, stderr son satırları kaydedilir.
- Arayüzde kart yalnızca **"claude çağrısı başarısız oldu"** der; detay Loglar
  sayfasında.
- **"Tekrar Dene"** → yeni session başlatır.

## 10. Dağıtım ve paketleme

Boru hattı:

1. `npm run build` → `dist/`
2. `frontend-maven-plugin` → `backend/src/main/resources/static/`
3. `mvn package` → fat jar (`:8420`, API + SPA tek süreç)
4. `jpackage` → `ProjectTracker.app` (gömülü JRE + jar)

**Çalışma:** `ProjectTracker.app`'e çift tıkla → tek Java process →
`Desktop.browse("http://localhost:8420")` ile tarayıcı açılır → uygulamadan çık
→ Spring Boot graceful shutdown. Terminal gerekmez. Node/npm yalnızca geliştirme
ve build anında gereklidir, çalışma anında değil.

**Geliştirme akışı:** `mvn spring-boot:run` (`:8420`) + `npm run dev` (`:5173`,
`/api` proxy'li) ayrı çalışır.

## 11. Teknoloji yığını

- **Backend:** Java 17, Spring Boot, Maven, Spring Web, Spring Data JPA, H2, JGit,
  Jackson
- **Frontend:** Vite, React, TypeScript, Tailwind CSS, React Router, axios
- **Entegrasyon:** `claude` CLI (v2.1.236+) — `--agents` / `--agent` /
  `--session-id` / `--output-format stream-json` / `--resume`
- **Paketleme:** frontend-maven-plugin, jpackage

## 12. Ön koşullar

| Araç | Durum |
|---|---|
| JDK 17 | ✅ kurulu |
| Maven | ❌ `brew install maven` (veya `mvnw` wrapper) |
| Node + npm | ✅ Node 26, npm 11 |
| `claude` CLI | ✅ v2.1.236, oturum açık |

## 13. Kapsam dışı (v1)

- Var olan `*.md` dosyalarını Claude ile güncelleme / gözden geçirme
- Birden fazla kök yol; birden fazla projede aynı anda interview
- Kimlik doğrulama, çok kullanıcı
- Canlı dosya izleme (WatchService) / SSE
- Bulut dağıtımı, uzak makinelerden erişim
- Backend testleri (sahibi elle yazacak; TDD dayatılmıyor)
- Git dışı ilerleme metrikleri (LOC, kod analizi vb.)

## 14. Riskler / açık noktalar

- `claude -p` + inline `--agents` JSON + headless birlikte beklendiği gibi
  çalışmazsa → `--append-system-prompt`'a düşülür.
- Agent'ın stdout sözleşmesine (`<portal-questions>` / `<portal-done>`) tutarlı
  uyması prompt kalitesine bağlı; toleranslı parser + net talimat şart.
- `stream-json` çıktı formatı Claude Code sürümleri arası değişebilir.
- jpackage ile üretilen `.app` imzasız olacağı için Gatekeeper ilk açılışta
  uyarı verebilir (sağ tık → Aç).
- `updated:` frontmatter v1'de parse edilmiyor (karar 2026-09-04). Doküman tazeliği
  M3 git son commit tarihi / `.md` mtime ile gösterilecek. İleride ihtiyaç olursa
  M8'de eklenir; `GET /api/projects/{id}` DTO'suna şimdilik `updated` alanı konmaz.
