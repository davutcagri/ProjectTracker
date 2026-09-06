package projectTracker.backend.bootstrap;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class BrowserLauncher {

    private BrowserLauncher() {
    }

    public static void open(String url) {
        try {
            new ProcessBuilder("open", url).start();
            log.info("Tarayıcı açılıyor: {}", url);
        } catch (Exception e) {
            log.warn("Tarayıcı otomatik açılamadı ({}). Elle açın: {}", e.getMessage(), url);
        }
    }
}
