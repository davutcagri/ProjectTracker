package projectTracker.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import projectTracker.backend.bootstrap.BrowserLauncher;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
public class BackendApplication {

    private static final String PACKAGED_PROPERTY = "projecttracker.launch.open-browser";
    private static final String LOCAL_URL = "http://localhost:8420";
    private static final int APP_PORT = 8420;

    public static void main(String[] args) throws IOException {
        boolean packaged = Boolean.getBoolean(PACKAGED_PROPERTY);
        if (packaged) {
            System.setProperty("java.awt.headless", "false");
            configureDataDirectory();
            if (isPortInUse(APP_PORT)) {
                BrowserLauncher.open(LOCAL_URL);
                return;
            }
        }
        SpringApplication.run(BackendApplication.class, args);
    }

    private static void configureDataDirectory() throws IOException {
        Path dbDir = Path.of(System.getProperty("user.home"),
                "Library", "Application Support", "ProjectTracker", "db");
        Files.createDirectories(dbDir);
        System.setProperty("spring.datasource.url",
                "jdbc:h2:file:" + dbDir.resolve("mydb"));
    }

    private static boolean isPortInUse(int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(InetAddress.getLoopbackAddress(), port), 500);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

}
