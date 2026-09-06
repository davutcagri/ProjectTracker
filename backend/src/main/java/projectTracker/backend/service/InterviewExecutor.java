package projectTracker.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ClaudeExecution;
import projectTracker.backend.dto.internal.InterviewTurnResult;
import projectTracker.backend.model.entity.InterviewSession;
import projectTracker.backend.model.entity.Project;
import projectTracker.backend.model.enums.InterviewErrorKind;
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
    private final ClaudeRunLogger claudeRunLogger;

    public InterviewExecutor(ClaudeRunner claudeRunner,
                             StreamJsonParser streamJsonParser,
                             InterviewSessionRepository sessionRepository,
                             ProjectRepository projectRepository,
                             ObjectMapper objectMapper,
                             ClaudeRunLogger claudeRunLogger) {
        this.claudeRunner = claudeRunner;
        this.streamJsonParser = streamJsonParser;
        this.sessionRepository = sessionRepository;
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;
        this.claudeRunLogger = claudeRunLogger;
    }

    @Async
    public void runStart(String sessionId, String taskPrompt) {
        InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            log.warn("Interview oturumu bulunamadi: {}", sessionId);
            return;
        }
        Instant startedAt = Instant.now();
        try {
            Path projectDir = resolveProjectDir(session);
            ClaudeExecution execution = claudeRunner.startInterview(projectDir, taskPrompt, session.getClaudeSessionId());
            applyResult(session, execution, startedAt);
        } catch (Exception e) {
            log.error("Interview start async calismasi basarisiz: {}", sessionId, e);
            claudeRunLogger.recordFailure(session, startedAt, e.getMessage());
            markError(session, InterviewErrorClassifier.classifyMessage(e.getMessage()));
        }
    }

    @Async
    public void runResume(String sessionId, String userAnswers) {
        InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            log.warn("Interview oturumu bulunamadi: {}", sessionId);
            return;
        }
        Instant startedAt = Instant.now();
        try {
            Path projectDir = resolveProjectDir(session);
            ClaudeExecution execution = claudeRunner.resumeInterview(projectDir, session.getClaudeSessionId(), userAnswers);
            applyResult(session, execution, startedAt);
        } catch (Exception e) {
            log.error("Interview answers async calismasi basarisiz: {}", sessionId, e);
            claudeRunLogger.recordFailure(session, startedAt, e.getMessage());
            markError(session, InterviewErrorClassifier.classifyMessage(e.getMessage()));
        }
    }

    private Path resolveProjectDir(InterviewSession session) {
        Project project = projectRepository.findById(session.getProjectId())
                .orElseThrow(() -> new IllegalStateException("Proje bulunamadi: " + session.getProjectId()));
        return Path.of(project.getPath());
    }

    private void applyResult(InterviewSession session, ClaudeExecution execution, Instant startedAt) {
        InterviewTurnResult result = streamJsonParser.parse(execution.stdout());

        if (execution.timedOut() || execution.exitCode() != 0 || !result.success()) {
            session.setStatus(InterviewStatus.ERROR);
            session.setErrorKind(InterviewErrorClassifier.classify(execution));
        } else if (result.done()) {
            session.setStatus(InterviewStatus.DONE);
            session.setPendingQuestionsJson(null);
            session.setDoneSummary(result.doneSummary());
            session.setErrorKind(null);
        } else if (result.pendingQuestions() != null && !result.pendingQuestions().isEmpty()) {
            session.setStatus(InterviewStatus.WAITING_INPUT);
            session.setPendingQuestionsJson(serializeQuestions(result));
            session.setErrorKind(null);
        } else {
            session.setStatus(InterviewStatus.ERROR);
            session.setErrorKind(InterviewErrorClassifier.classify(execution));
        }

        session.setLastActivityAt(Instant.now());
        sessionRepository.save(session);

        claudeRunLogger.record(session, startedAt, execution, session.getStatus() != InterviewStatus.ERROR);
    }

    private String serializeQuestions(InterviewTurnResult result) {
        try {
            return objectMapper.writeValueAsString(result.pendingQuestions());
        } catch (Exception e) {
            log.warn("Bekleyen sorular serilestirilinemedi", e);
            return null;
        }
    }

    private void markError(InterviewSession session, InterviewErrorKind errorKind) {
        try {
            session.setStatus(InterviewStatus.ERROR);
            session.setErrorKind(errorKind);
            session.setLastActivityAt(Instant.now());
            sessionRepository.save(session);
        } catch (Exception e) {
            log.error("Interview oturumu ERROR olarak isaretlenemedi: {}", session.getId(), e);
        }
    }
}
