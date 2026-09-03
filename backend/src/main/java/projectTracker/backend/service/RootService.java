package projectTracker.backend.service;

import org.springframework.stereotype.Service;
import projectTracker.backend.model.AppSettings;
import projectTracker.backend.repository.AppSettingsRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

@Service
public class RootService {

    private final AppSettingsRepository appSettingsRepository;

    public RootService(AppSettingsRepository appSettingsRepository) {
        this.appSettingsRepository = appSettingsRepository;
    }

    public List<Path> scanProjectFolders() throws IOException {
        AppSettings appSettings = appSettingsRepository.findById(1).orElseThrow();
        Path rootPath = Path.of(appSettings.getRootPath());

        try( Stream<Path> files = Files.list(rootPath)) {
            return files
                    .filter(Files::isDirectory)
                    .filter(path -> !path.getFileName().toString().startsWith("."))
                    .toList();
        } catch (IOException e) {
            throw new IOException("Root path not found");
        }
    }

    public String getRootPath() {
        AppSettings appSettings = appSettingsRepository.findById(1).orElseThrow();
        return appSettings.getRootPath();
    }

    public void setRootPath(String rootPath) {
        if (rootPath == null || rootPath.trim().isEmpty()) {
            throw new IllegalArgumentException("Kök yol boş olamaz");
        }

        String trimmed = rootPath.trim();
        if (!Files.isDirectory(Path.of(trimmed))) {
            throw new IllegalArgumentException("Kök yol geçerli bir klasör değil: " + trimmed);
        }

        AppSettings appSettings = appSettingsRepository.findById(1).orElseThrow();
        appSettings.setRootPath(trimmed);
        appSettingsRepository.save(appSettings);
    }

}
