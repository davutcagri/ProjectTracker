package projectTracker.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projectTracker.backend.dto.request.NotesRequest;
import projectTracker.backend.dto.response.ProjectDetailedResponse;
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
    public ResponseEntity<List<ProjectResponse>> getAllProjects() throws IOException {
        return ResponseEntity.ok().body(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDetailedResponse> getProjectById(@PathVariable String id) throws IOException {
        return ResponseEntity.ok().body(projectService.getProjectById(id));
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<ProjectDetailedResponse> syncProjectById(@PathVariable String id) throws IOException {
        return ResponseEntity.ok().body(projectService.syncProjectById(id));
    }

    @PutMapping("/{id}/note")
    public ResponseEntity<String> updateNotes(@PathVariable String id, @RequestBody NotesRequest request) {
        projectService.updateNotes(id, request);
        return ResponseEntity.ok().body("Note updated successfully.");
    }
}
