package projectTracker.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ClaudeExecution;
import projectTracker.backend.dto.internal.InterviewTurnResult;
import projectTracker.backend.model.entity.Project;
import projectTracker.backend.repository.ProjectRepository;

import java.nio.file.Path;
import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.UUID;

@Slf4j
@Service
public class RoadmapFixService {

    private static final String TASK_PROMPT =
            "ROADMAP.md dosyasını oku, içeriğini koruyarak şu formata dönüştür: her milestone \"## \" ile başlayan "
                    + "bir başlık satırı olsun; görevler kendi satırında \"- [x] \" (tamamlanmış) veya \"- [ ] \" "
                    + "(bekleyen) ile başlasın. Dosyanın anlamını ve mevcut bilgisini koru, yalnızca formatını düzelt. "
                    + "ROADMAP.md dosyasını bu haliyle güncelle.";

    private final ProjectRepository projectRepository;
    private final ClaudeRunner claudeRunner;
    private final StreamJsonParser streamJsonParser;
    private final ClaudeRunLogger claudeRunLogger;

    public RoadmapFixService(ProjectRepository projectRepository,
                              ClaudeRunner claudeRunner,
                              StreamJsonParser streamJsonParser,
                              ClaudeRunLogger claudeRunLogger) {
        this.projectRepository = projectRepository;
        this.claudeRunner = claudeRunner;
        this.streamJsonParser = streamJsonParser;
        this.claudeRunLogger = claudeRunLogger;
    }

    public void fixRoadmap(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Proje bulunamadı"));
        Path projectDir = Path.of(project.getPath());
        String fallbackSessionId = UUID.randomUUID().toString();
        Instant startedAt = Instant.now();

        try {
            ClaudeExecution execution = claudeRunner.runTask(projectDir, TASK_PROMPT);
            InterviewTurnResult result = streamJsonParser.parse(execution.stdout());
            boolean success = !execution.timedOut() && execution.exitCode() == 0 && result.success();
            String sessionId = result.sessionId() != null ? result.sessionId() : fallbackSessionId;

            claudeRunLogger.record(projectId, sessionId, startedAt, execution, success);

            if (!success) {
                throw new IllegalStateException("ROADMAP.md düzeltilemedi");
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Roadmap duzeltme calismasi basarisiz: proje {}", projectId, e);
            claudeRunLogger.recordFailure(projectId, fallbackSessionId, startedAt, e.getMessage());
            throw new IllegalStateException("ROADMAP.md düzeltilemedi");
        }
    }
}
