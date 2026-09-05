package projectTracker.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

@Service
public class RootService {

    private final AppSettingsService appSettingsService;

    public RootService(AppSettingsService appSettingsService) {
        this.appSettingsService = appSettingsService;
    }

    public List<Path> scanProjectFolders() throws IOException {
        Path rootPath = Path.of(appSettingsService.getRootPath());

        try (Stream<Path> files = Files.list(rootPath)) {
            return files
                    .filter(Files::isDirectory)
                    .filter(path -> !path.getFileName().toString().startsWith("."))
                    .toList();
        } catch (IOException e) {
            throw new IOException("Root path not found");
        }
    }

}
