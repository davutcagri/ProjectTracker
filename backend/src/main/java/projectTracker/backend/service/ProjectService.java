package projectTracker.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projectTracker.backend.dto.response.ProjectResponse;
import projectTracker.backend.model.Project;
import projectTracker.backend.repository.ProjectRepository;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional
    public void syncProjects(List<Path> localFilePaths) {
        Instant now = Instant.now();

        List<Project> projects = projectRepository.findAll();
        projects.forEach(project -> {
            if (!localFilePaths.contains(Path.of(project.getPath()))) {
                projectRepository.delete(project);
            }
        });

        localFilePaths.forEach(path -> {
            Project project = projectRepository.findByPath(path.toString());
            if (project == null) {
                project = new Project();
                project.setDisplayName(path.getFileName().toString());
                project.setNotes(null);
                project.setPinned(false);
                project.setPath(path.toString());
            }
            project.setLastScanAt(now);
            projectRepository.save(project);
        });
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(ProjectResponse::from)
                .toList();
    }
}
