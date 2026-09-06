package projectTracker.backend.bootstrap;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.awt.Desktop;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.Image;
import java.awt.MenuItem;
import java.awt.PopupMenu;
import java.awt.RenderingHints;
import java.awt.SystemTray;
import java.awt.TrayIcon;
import java.awt.image.BufferedImage;

@Slf4j
@Component
public class TrayLauncher implements ApplicationListener<ApplicationReadyEvent> {

    private static final String APP_URL = "http://localhost:8420";

    private final Environment environment;

    public TrayLauncher(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        boolean packaged = environment.getProperty(
                "projecttracker.launch.open-browser", Boolean.class, false);
        if (!packaged) {
            return;
        }
        installQuitHandler();
        installTrayIcon();
    }

    private void installQuitHandler() {
        try {
            if (Desktop.isDesktopSupported()
                    && Desktop.getDesktop().isSupported(Desktop.Action.APP_QUIT_HANDLER)) {
                Desktop.getDesktop().setQuitHandler((quitEvent, response) -> System.exit(0));
                log.info("macOS Cik isleyicisi kuruldu");
            }
        } catch (Exception e) {
            log.warn("macOS Cik isleyicisi kurulamadi: {}", e.getMessage());
        }
    }

    private void installTrayIcon() {
        if (GraphicsEnvironment.isHeadless() || !SystemTray.isSupported()) {
            log.warn("Menu cubugu ikonu bu ortamda desteklenmiyor, atlaniyor");
            return;
        }
        try {
            PopupMenu menu = new PopupMenu();

            MenuItem openItem = new MenuItem("ProjectTracker'i Ac");
            openItem.addActionListener(e -> BrowserLauncher.open(APP_URL));

            MenuItem quitItem = new MenuItem("Cik");
            quitItem.addActionListener(e -> System.exit(0));

            menu.add(openItem);
            menu.addSeparator();
            menu.add(quitItem);

            TrayIcon trayIcon = new TrayIcon(buildIconImage(), "ProjectTracker", menu);
            trayIcon.setImageAutoSize(true);
            trayIcon.addActionListener(e -> BrowserLauncher.open(APP_URL));

            SystemTray.getSystemTray().add(trayIcon);
            log.info("Menu cubugu ikonu eklendi (toplam {} ikon)",
                    SystemTray.getSystemTray().getTrayIcons().length);
        } catch (Exception e) {
            log.warn("Menu cubugu ikonu eklenemedi: {}", e.getMessage());
        }
    }

    private Image buildIconImage() {
        int size = 18;
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.setColor(new Color(0x2F, 0x81, 0xF7));
        graphics.fillRoundRect(1, 1, size - 2, size - 2, 6, 6);
        graphics.setColor(Color.WHITE);
        graphics.setFont(new Font("SansSerif", Font.BOLD, 12));
        FontMetrics metrics = graphics.getFontMetrics();
        String label = "P";
        int x = (size - metrics.stringWidth(label)) / 2;
        int y = (size - metrics.getHeight()) / 2 + metrics.getAscent();
        graphics.drawString(label, x, y);
        graphics.dispose();
        return image;
    }
}
