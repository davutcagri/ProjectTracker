# ProjectTracker — Paketleme ve Kurulum (macOS)

Bu belge `ProjectTracker.app`'in nasıl üretileceğini, kurulacağını ve
çalıştırılacağını anlatır. Hedef: **tek çift tıklamayla açılan, terminal
gerektirmeyen** bir masaüstü uygulaması (SCOPE §3, §10).

---

## 1. Ön koşullar (yalnızca build makinesi)

| Araç | Neden | Not |
|---|---|---|
| **JDK 17** (jpackage dahil) | `jpackage` ile `.app` üretmek + gömülü JRE | `brew install openjdk@17`. Script `/opt/homebrew/opt/openjdk@17/bin/jpackage` yolunu, yoksa `PATH`'i dener. |
| **İnternet erişimi** | `./mvnw package` ilk çalıştığında `frontend-maven-plugin` Node/npm indirir ve React bağımlılıklarını kurar | Sonraki build'lerde cache'ten gelir. |
| Maven | Gerekmez | `backend/mvnw` wrapper kullanılır. |
| Node / npm (elle kurulu) | Gerekmez | `frontend-maven-plugin` kendi indirir. |

**Çalıştıran makinede** hiçbir şey gerekmez: `.app` içinde gömülü JRE + fat jar var.
Node/npm sadece build anında lazım, çalışma anında değil.

---

## 2. Build

Proje kökünde:

```bash
./scripts/package-macos.sh
```

Script sırasıyla:

1. `backend/` içinde `./mvnw -q clean package -DskipTests` çalıştırır →
   `backend/target/backend-0.0.1-SNAPSHOT.jar` (içinde derlenmiş React SPA:
   `BOOT-INF/classes/static/index.html`).
2. Jar'ı geçici temiz bir klasöre kopyalar (`dist/.jpackage-input/`).
3. `jpackage --type app-image` ile `dist/ProjectTracker.app` üretir
   (gömülü JRE + jar). Geçici klasörü siler.

Çıktı: **`dist/ProjectTracker.app`** (`dist/` ve `*.app` `.gitignore`'da — commit'e girmez).

Kullanılan tam `jpackage` komutu:

```
jpackage \
  --type app-image \
  --name ProjectTracker \
  --app-version 1.0.0 \
  --input <geçici klasör: yalnızca jar> \
  --main-jar backend-0.0.1-SNAPSHOT.jar \
  --java-options "-Dprojecttracker.launch.open-browser=true" \
  --dest dist \
  --vendor ProjectTracker \
  --mac-package-identifier dev.projecttracker.app
```

Not: `--main-class` **verilmez**. Spring Boot fat jar'ının manifest'inde
`Main-Class: org.springframework.boot.loader.launch.JarLauncher` zaten var;
jpackage bunu `--main-jar`'dan okur.

---

## 3. Gatekeeper (imzasız uygulama)

`.app` **kod imzalı değil** (SCOPE §14). İlk açılışta macOS
"ProjectTracker geliştiricisi doğrulanamadığı için açılamıyor" benzeri bir
uyarı verebilir. Çözüm (biri yeterli):

- **Finder'da** `ProjectTracker.app`'e **sağ tık → Aç** → çıkan uyarıda tekrar
  **Aç**. Bu yalnızca ilk seferde gerekir; sonra normal çift tıklama çalışır.
- Ya da terminalden karantina işaretini kaldır:

  ```bash
  xattr -dr com.apple.quarantine dist/ProjectTracker.app
  ```

---

## 4. Çalıştırma

`ProjectTracker.app`'e **çift tıkla**. Birkaç saniye içinde:

- Tek bir Java process başlar (`:8420`).
- Varsayılan tarayıcıda `http://localhost:8420` otomatik açılır
  (`open` komutuyla; tarayıcı açılamazsa uygulama çökmez, adresi elle
  açabilirsiniz).

Terminal gerekmez.

### İkinci kez açılırsa

Uygulama zaten çalışırken `.app`'e tekrar çift tıklarsanız: **ikinci sunucu
başlamaz** (port çakışması / H2 dosya kilidi olmaz). Sadece tarayıcı yeniden
açılır ve process hemen çıkar.

---

## 5. Çıkış

Uygulamanın kendi penceresi yoktur (arayüz tarayıcıda). Kapatmak için:

- **Dock**'taki ProjectTracker ikonuna **sağ tık → Çık**, ya da uygulama
  öndeyken **Cmd+Q**.

Çıkışta Spring Boot **graceful shutdown** yapar (`server.shutdown=graceful`,
en fazla 20 sn bekler): açık istekler tamamlanır, H2 veritabanı dosyası
tutarlı kapanır. Tarayıcı sekmesini kapatmak uygulamayı durdurmaz.

---

## 6. Veri nerede duruyor

Paketlenmiş uygulama H2 veritabanını şurada tutar:

```
~/Library/Application Support/ProjectTracker/db/mydb.mv.db
```

(macOS uygulama-verisi konvansiyonu.) Bu klasörü silmek uygulamayı sıfırlar
(kök yol ayarı, taranan projeler, notlar, loglar gider).

> Geliştirme modu (`./mvnw spring-boot:run`) bundan **etkilenmez**; o hâlâ
> `backend/data/mydb` (göreli yol) kullanır. Ayrımı `BackendApplication.main`
> yapar: yalnızca `-Dprojecttracker.launch.open-browser=true` ile başlatıldığında
> (yani paketlenmiş `.app`) mutlak `Application Support` yoluna geçer ve klasörü
> oluşturur.

---

## 7. `/Applications` veya Dock'a yerleştirme

`dist/ProjectTracker.app` taşınabilir bir pakettir. Kalıcı kurulum için:

- **Finder'da** `dist/ProjectTracker.app`'i `/Applications` klasörüne
  **sürükle**, ya da terminalden:

  ```bash
  cp -R dist/ProjectTracker.app /Applications/
  ```

  Ardından Launchpad'de ve Spotlight'ta görünür.

- **Dock'a sabitlemek:** uygulamayı bir kez çalıştırın, Dock'taki ikonuna
  sağ tık → **Seçenekler → Dock'ta Tut**. Ya da `/Applications` içindeki
  `.app`'i doğrudan Dock'a sürükleyin.

Güncelleme: yeni sürüm build edip `/Applications` içindeki eski `.app`'in
üzerine kopyalayın (veri `Application Support`'ta durduğu için korunur).

---

## 8. Geliştirme akışı (paketlemeyle karışmasın)

| | Komut | Port | Tarayıcı | Veri |
|---|---|---|---|---|
| Backend (dev) | `cd backend && ./mvnw spring-boot:run` | 8420 | açılmaz | `backend/data/mydb` |
| Frontend (dev) | `cd frontend && npm run dev` | 5173 (`/api` proxy) | — | — |
| Paketlenmiş | `ProjectTracker.app` | 8420 | otomatik açılır | `~/Library/Application Support/ProjectTracker/db/` |
