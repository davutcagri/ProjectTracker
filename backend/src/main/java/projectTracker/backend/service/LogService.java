package projectTracker.backend.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.response.ClaudeRunResponse;
import projectTracker.backend.model.entity.ClaudeRun;
import projectTracker.backend.model.entity.Project;
import projectTracker.backend.repository.ClaudeRunRepository;
import projectTracker.backend.repository.ProjectRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LogService {

    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 1000;
    private static final String DELETED_PROJECT_LABEL = "(silinmiş proje)";

    private final ClaudeRunRepository claudeRunRepository;
    private final ProjectRepository projectRepository;

    public LogService(ClaudeRunRepository claudeRunRepository, ProjectRepository projectRepository) {
        this.claudeRunRepository = claudeRunRepository;
        this.projectRepository = projectRepository;
    }

    public List<ClaudeRunResponse> getRecentRuns(int limit) {
        int safeLimit = limit <= 0 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

        Map<String, String> displayNameById = new HashMap<>();
        for (Project project : projectRepository.findAll()) {
            displayNameById.put(project.getId(), project.getDisplayName());
        }

        return claudeRunRepository.findAllByOrderByStartedAtDesc(PageRequest.of(0, safeLimit)).stream()
                .map(run -> toResponse(run, displayNameById))
                .toList();
    }

    private ClaudeRunResponse toResponse(ClaudeRun run, Map<String, String> displayNameById) {
        String displayName = displayNameById.getOrDefault(run.getProjectId(), DELETED_PROJECT_LABEL);
        return new ClaudeRunResponse(
                run.getId(),
                run.getProjectId(),
                displayName,
                run.getSessionId(),
                run.getStartedAt(),
                run.getDurationMs(),
                run.getExitCode(),
                run.getOutcome() == null ? null : run.getOutcome().name(),
                run.getStderrTail()
        );
    }
}
