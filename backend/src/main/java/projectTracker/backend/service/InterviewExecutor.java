package projectTracker.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ClaudeExecution;
import projectTracker.backend.dto.internal.InterviewTurnResult;
import projectTracker.backend.model.entity.InterviewSession;
import projectTracker.backend.model.entity.Project;
import projectTracker.backend.model.enums.InterviewStatus;
import projectTracker.backend.repository.InterviewSessionRepository;
import projectTracker.backend.repository.ProjectRepository;

import java.nio.file.Path;
import java.time.Instant;

@Slf4j
@Service
public class InterviewExecutor {

    private final ClaudeRunner claudeRunner;
    private final StreamJsonParser streamJsonParser;
    private final InterviewSessionRepository sessionRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    public InterviewExecutor(ClaudeRunner claudeRunner,
                             StreamJsonParser streamJsonParser,
                             InterviewSessionRepository sessionRepository,
                             ProjectRepository projectRepository,
                             ObjectMapper objectMapper) {
        this.claudeRunner = claudeRunner;
        this.streamJsonParser = streamJsonParser;
        this.sessionRepository = sessionRepository;
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;
    }

    @Async
    public void runStart(String sessionId, String taskPrompt) {
        InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            log.warn("Interview oturumu bulunamadi: {}", sessionId);
            return;
        }
        try {
            Path projectDir = resolveProjectDir(session);
            ClaudeExecution execution = claudeRunner.startInterview(projectDir, taskPrompt, session.getClaudeSessionId());
            applyResult(session, execution);
        } catch (Exception e) {
            log.error("Interview start async calismasi basarisiz: {}", sessionId, e);
            markError(session);
        }
    }

    @Async
    public void runResume(String sessionId, String userAnswers) {
        InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            log.warn("Interview oturumu bulunamadi: {}", sessionId);
            return;
        }
        try {
            Path projectDir = resolveProjectDir(session);
            ClaudeExecution execution = claudeRunner.resumeInterview(projectDir, session.getClaudeSessionId(), userAnswers);
            applyResult(session, execution);
        } catch (Exception e) {
            log.error("Interview answers async calismasi basarisiz: {}", sessionId, e);
            markError(session);
        }
    }

    private Path resolveProjectDir(InterviewSession session) {
        Project project = projectRepository.findById(session.getProjectId())
                .orElseThrow(() -> new IllegalStateException("Proje bulunamadi: " + session.getProjectId()));
        return Path.of(project.getPath());
    }

    private void applyResult(InterviewSession session, ClaudeExecution execution) {
        InterviewTurnResult result = streamJsonParser.parse(execution.stdout());

        if (execution.timedOut() || !result.success()) {
            session.setStatus(InterviewStatus.ERROR);
        } else if (result.done()) {
            session.setStatus(InterviewStatus.DONE);
            session.setPendingQuestionsJson(null);
        } else if (result.pendingQuestions() != null && !result.pendingQuestions().isEmpty()) {
            session.setStatus(InterviewStatus.WAITING_INPUT);
            session.setPendingQuestionsJson(serializeQuestions(result));
        } else {
            session.setStatus(InterviewStatus.ERROR);
        }

        session.setLastActivityAt(Instant.now());
        sessionRepository.save(session);
    }

    private String serializeQuestions(InterviewTurnResult result) {
        try {
            return objectMapper.writeValueAsString(result.pendingQuestions());
        } catch (Exception e) {
            log.warn("Bekleyen sorular serilestirilinemedi", e);
            return null;
        }
    }

    private void markError(InterviewSession session) {
        try {
            session.setStatus(InterviewStatus.ERROR);
            session.setLastActivityAt(Instant.now());
            sessionRepository.save(session);
        } catch (Exception e) {
            log.error("Interview oturumu ERROR olarak isaretlenemedi: {}", session.getId(), e);
        }
    }
}
