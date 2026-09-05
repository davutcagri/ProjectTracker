package projectTracker.backend.service;

import org.springframework.stereotype.Service;
import projectTracker.backend.model.entity.AppSettings;
import projectTracker.backend.repository.AppSettingsRepository;

import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class AppSettingsService {

    private final AppSettingsRepository appSettingsRepository;

    public AppSettingsService(AppSettingsRepository appSettingsRepository) {
        this.appSettingsRepository = appSettingsRepository;
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
