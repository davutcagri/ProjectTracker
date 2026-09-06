package projectTracker.backend.dto.response;

import java.time.Instant;

public record ClaudeRunResponse(
        String id,
        String projectId,
        String projectDisplayName,
        String sessionId,
        Instant startedAt,
        Long durationMs,
        Integer exitCode,
        String outcome,
        String stderrTail
) {
}
