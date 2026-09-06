#!/usr/bin/env bash
#
# ProjectTracker — macOS paketleme scripti (ROADMAP M7, SCOPE §10)
#
# Ne yapar:
#   1. backend/ içinde fat jar üretir (gömülü derlenmiş React SPA dahil).
#   2. jpackage ile "Project Tracker.app" (app-image) üretir: gömülü JRE + jar + ikon.
#
# Çıktı: <proje kökü>/dist/Project Tracker.app  (dist/ .gitignore'da)
# İkon:  scripts/appicon.icns  (kaynak: scripts/make-icon.py, Pillow gerektirir)
#
# Ön koşul: jpackage içeren JDK 17. Script öncelikle
#   /opt/homebrew/opt/openjdk@17/bin/jpackage yolunu dener, yoksa PATH'e bakar.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
DIST_DIR="${PROJECT_ROOT}/dist"

APP_NAME="Project Tracker"
APP_VERSION="1.0.0"
APP_ICON="${SCRIPT_DIR}/appicon.icns"

JPACKAGE="/opt/homebrew/opt/openjdk@17/bin/jpackage"
if [ ! -x "${JPACKAGE}" ]; then
  JPACKAGE="$(command -v jpackage || true)"
fi
if [ -z "${JPACKAGE}" ] || [ ! -x "${JPACKAGE}" ]; then
  echo "HATA: jpackage bulunamadi. jpackage iceren bir JDK 17 kurulu olmali." >&2
  echo "      Beklenen konum: /opt/homebrew/opt/openjdk@17/bin/jpackage" >&2
  echo "      Kurulum: brew install openjdk@17" >&2
  exit 1
fi

JPACKAGE_VERSION="$("${JPACKAGE}" --version 2>&1 | head -n 1)"
case "${JPACKAGE_VERSION}" in
  17.*) ;;
  *)
    echo "HATA: jpackage surumu 17 degil (bulunan: ${JPACKAGE_VERSION})." >&2
    echo "      Yol: ${JPACKAGE}" >&2
    exit 1
    ;;
esac

echo "==> jpackage: ${JPACKAGE} (surum ${JPACKAGE_VERSION})"

echo "==> [1/3] Backend paketleniyor: ./mvnw clean package -DskipTests"
echo "         (ilk calistirmada npm indirilir, birkac dakika surebilir)"
(
  cd "${BACKEND_DIR}"
  ./mvnw -q clean package -DskipTests
)

JAR_PATH="$(find "${BACKEND_DIR}/target" -maxdepth 1 -type f -name '*.jar' \
  ! -name '*-sources.jar' ! -name '*-javadoc.jar' ! -name '*-plain.jar' \
  | head -n 1)"

if [ -z "${JAR_PATH}" ] || [ ! -f "${JAR_PATH}" ]; then
  echo "HATA: Paketlenmis jar bulunamadi (${BACKEND_DIR}/target/*.jar)." >&2
  exit 1
fi

JAR_NAME="$(basename "${JAR_PATH}")"
echo "==> Jar: ${JAR_PATH}"

echo "==> [2/3] Eski cikti temizleniyor: ${DIST_DIR}/${APP_NAME}.app"
rm -rf "${DIST_DIR:?}/${APP_NAME}.app"
INPUT_DIR="${DIST_DIR}/.jpackage-input"
rm -rf "${INPUT_DIR}"
mkdir -p "${INPUT_DIR}"
cp "${JAR_PATH}" "${INPUT_DIR}/"

ICON_ARGS=()
if [ -f "${APP_ICON}" ]; then
  ICON_ARGS=(--icon "${APP_ICON}")
  echo "==> Ikon: ${APP_ICON}"
else
  echo "==> Ikon bulunamadi (${APP_ICON}) — varsayilan jpackage ikonu kullanilacak"
fi

echo "==> [3/3] jpackage calisiyor..."
"${JPACKAGE}" \
  --type app-image \
  --name "${APP_NAME}" \
  --app-version "${APP_VERSION}" \
  --input "${INPUT_DIR}" \
  --main-jar "${JAR_NAME}" \
  ${ICON_ARGS[@]+"${ICON_ARGS[@]}"} \
  --java-options "-Dprojecttracker.launch.open-browser=true" \
  --dest "${DIST_DIR}" \
  --vendor "ProjectTracker" \
  --mac-package-identifier "dev.projecttracker.app"

rm -rf "${INPUT_DIR}"

echo ""
echo "TAMAM: ${DIST_DIR}/${APP_NAME}.app"
echo ""
echo "Calistir:"
echo "  open \"${DIST_DIR}/${APP_NAME}.app\""
echo ""
echo "Ilk acilista Gatekeeper uyarisi cikarsa (imzasiz .app):"
echo "  Finder'da sag tik -> Ac,  ya da:"
echo "  xattr -dr com.apple.quarantine \"${DIST_DIR}/${APP_NAME}.app\""
echo ""
echo "Ayrinti: ${PROJECT_ROOT}/PACKAGING.md"
