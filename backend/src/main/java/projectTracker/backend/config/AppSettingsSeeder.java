package projectTracker.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import projectTracker.backend.model.AppSettings;
import projectTracker.backend.repository.AppSettingsRepository;

@Component
@Order(1)
public class AppSettingsSeeder implements ApplicationRunner {

    private final AppSettingsRepository appSettingsRepository;

    public AppSettingsSeeder(AppSettingsRepository appSettingsRepository) {
        this.appSettingsRepository = appSettingsRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (appSettingsRepository.count() == 0) {
            AppSettings appSettings = new AppSettings();
            appSettings.setId(1);
            appSettings.setRootPath(System.getProperty("user.home") + "/Documents/Projects");

            appSettingsRepository.save(appSettings);
        }
    }
}
