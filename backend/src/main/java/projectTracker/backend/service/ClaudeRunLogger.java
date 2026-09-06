package projectTracker.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ClaudeExecution;
import projectTracker.backend.model.entity.ClaudeRun;
import projectTracker.backend.model.entity.InterviewSession;
import projectTracker.backend.model.enums.ClaudeRunOutcome;
import projectTracker.backend.repository.ClaudeRunRepository;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
public class ClaudeRunLogger {

    private final ClaudeRunRepository claudeRunRepository;

    public ClaudeRunLogger(ClaudeRunRepository claudeRunRepository) {
        this.claudeRunRepository = claudeRunRepository;
    }

    public void record(InterviewSession session, Instant startedAt, ClaudeExecution execution, boolean success) {
        try {
            ClaudeRun run = ClaudeRun.builder()
                    .projectId(session.getProjectId())
                    .sessionId(session.getClaudeSessionId())
                    .startedAt(startedAt)
                    .durationMs(execution.durationMs())
                    .exitCode(execution.exitCode())
                    .stderrTail(execution.stderrTail())
                    .outcome(success ? ClaudeRunOutcome.SUCCESS : ClaudeRunOutcome.FAILED)
                    .build();
            claudeRunRepository.save(run);
        } catch (Exception e) {
            log.error("claude_run kaydi yazilamadi: session {}", session.getId(), e);
        }
    }

    public void recordFailure(InterviewSession session, Instant startedAt, String message) {
        try {
            ClaudeRun run = ClaudeRun.builder()
                    .projectId(session.getProjectId())
                    .sessionId(session.getClaudeSessionId())
                    .startedAt(startedAt)
                    .durationMs(Duration.between(startedAt, Instant.now()).toMillis())
                    .exitCode(-1)
                    .stderrTail(message)
                    .outcome(ClaudeRunOutcome.FAILED)
                    .build();
            claudeRunRepository.save(run);
        } catch (Exception e) {
            log.error("claude_run hata kaydi yazilamadi: session {}", session.getId(), e);
        }
    }
}
