package projectTracker.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import projectTracker.backend.dto.response.ProjectResponse;
import projectTracker.backend.service.ProjectService;
import projectTracker.backend.service.RootService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final RootService rootService;

    public ProjectController(ProjectService projectService, RootService rootService) {
        this.projectService = projectService;
        this.rootService = rootService;
    }

    @PostMapping("/scan")
    public ResponseEntity<String> scanProjects() throws IOException {
        projectService.syncProjects(rootService.scanProjectFolders());
        return ResponseEntity.ok().body("Project sync completed.");
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok().body(projectService.getAllProjects());
    }
}
