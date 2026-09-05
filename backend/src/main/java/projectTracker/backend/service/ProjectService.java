package projectTracker.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projectTracker.backend.dto.internal.GitInfo;
import projectTracker.backend.dto.internal.Milestone;
import projectTracker.backend.dto.internal.ProjectDocs;
import projectTracker.backend.dto.request.NotesRequest;
import projectTracker.backend.dto.response.ProjectDetailedResponse;
import projectTracker.backend.dto.response.ProjectResponse;
import projectTracker.backend.model.entity.Project;
import projectTracker.backend.model.enums.DocsStatus;
import projectTracker.backend.repository.ProjectRepository;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectDocsReader projectDocsReader;
    private final RoadmapParser roadmapParser;
    private final GitService gitService;
    private final LastActivityService lastActivityService;

    public ProjectService(ProjectRepository projectRepository, ProjectDocsReader projectDocsReader, RoadmapParser roadmapParser, GitService gitService, LastActivityService lastActivityService) {
        this.projectRepository = projectRepository;
        this.projectDocsReader = projectDocsReader;
        this.roadmapParser = roadmapParser;
        this.gitService = gitService;
        this.lastActivityService = lastActivityService;
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
    public List<ProjectResponse> getAllProjects() throws IOException {
        List<Project> projects = projectRepository.findAll();
        List<ProjectResponse> responses = new ArrayList<>();
        for (Project project : projects) {
            List<ProjectDocs> docs = projectDocsReader.readInnerFiles(Path.of(project.getPath()));
            ProjectDocs roadmap = docs.stream().filter(d -> d.fileName().equals("ROADMAP.md")).findFirst().orElse(null);
            Integer progress = roadmapParser.calculateProgress(roadmap == null ? null : roadmap.content());
            Instant lastActivity = lastActivityService.resolveLastActivity(Path.of(project.getPath()));
            responses.add(ProjectResponse.from(project, progress, lastActivity));
        }
        return responses;
    }

    public ProjectDetailedResponse getProjectById(String id) throws IOException {
        Project project = projectRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Project not found"));
        Path projectPath = Path.of(project.getPath());
        List<ProjectDocs> docs = projectDocsReader.readInnerFiles(projectPath);

        ProjectDocs roadmap = docs.stream().filter(d -> d.fileName().equals("ROADMAP.md")).findFirst().orElseThrow();
        List<Milestone> milestones = roadmapParser.extractMilestones(roadmap.content());
        int progress = roadmapParser.calculateProgress(roadmap.content());

        boolean gitRepo = gitService.isGitRepository(projectPath);
        GitInfo gitInfo = gitRepo ? gitService.readGitInfo(projectPath) : null;
        Instant lastActivity = lastActivityService.resolveLastActivity(projectPath);

        return new ProjectDetailedResponse(
                project.getId(),
                project.getPath(),
                project.getDisplayName(),
                project.getNotes(),
                docs,
                progress,
                milestones,
                project.getLastScanAt(),
                gitRepo,
                gitInfo == null ? null : gitInfo.lastCommitDate(),
                gitInfo == null ? null : gitInfo.lastCommitMessage(),
                gitInfo == null ? null : gitInfo.branchCount(),
                gitInfo == null ? null : gitInfo.commitCount(),
                lastActivity
        );
    }

    @Transactional
    public ProjectDetailedResponse syncProjectById(String id) throws IOException {
        Project project = projectRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Project not found"));
        Path projectPath = Path.of(project.getPath());
        List<ProjectDocs> docs = projectDocsReader.readInnerFiles(projectPath);

        DocsStatus docsStatus = docs.stream().allMatch(ProjectDocs::exists) ? DocsStatus.COMPLETE : DocsStatus.INCOMPLETE;
        project.setDocsStatus(docsStatus);
        projectRepository.save(project);

        ProjectDocs roadmap = docs.stream().filter(d -> d.fileName().equals("ROADMAP.md")).findFirst().orElseThrow();
        List<Milestone> milestones = roadmapParser.extractMilestones(roadmap.content());
        int progress = roadmapParser.calculateProgress(roadmap.content());

        boolean gitRepo = gitService.isGitRepository(projectPath);
        GitInfo gitInfo = gitRepo ? gitService.readGitInfo(projectPath) : null;
        Instant lastActivity = lastActivityService.resolveLastActivity(projectPath);

        return new ProjectDetailedResponse(
                project.getId(),
                project.getPath(),
                project.getDisplayName(),
                project.getNotes(),
                docs,
                progress,
                milestones,
                project.getLastScanAt(),
                gitRepo,
                gitInfo == null ? null : gitInfo.lastCommitDate(),
                gitInfo == null ? null : gitInfo.lastCommitMessage(),
                gitInfo == null ? null : gitInfo.branchCount(),
                gitInfo == null ? null : gitInfo.commitCount(),
                lastActivity
        );
    }

    @Transactional
    public void updateNotes(String projectId, NotesRequest request) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new NoSuchElementException("Project not found"));
        project.setNotes(request.notes());
        projectRepository.save(project);
    }
}

