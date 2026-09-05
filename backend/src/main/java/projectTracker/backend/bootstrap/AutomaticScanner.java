package projectTracker.backend.bootstrap;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import projectTracker.backend.service.ProjectService;
import projectTracker.backend.service.RootService;

@Slf4j
@Component
@Order(2)
public class AutomaticScanner implements ApplicationRunner {

    private final RootService rootService;
    private final ProjectService projectService;

    public AutomaticScanner(RootService rootService, ProjectService projectService) {
        this.rootService = rootService;
        this.projectService = projectService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        projectService.syncProjects(rootService.scanProjectFolders());
        log.info("Automatic scan completed.");
    }
}
