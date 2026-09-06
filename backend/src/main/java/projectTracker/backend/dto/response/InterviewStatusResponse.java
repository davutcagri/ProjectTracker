package projectTracker.backend.dto.response;

import projectTracker.backend.dto.internal.Question;

import java.time.Instant;
import java.util.List;

public record InterviewStatusResponse(
        String sessionId,
        String projectId,
        String status,
        List<Question> pendingQuestions,
        Instant startedAt,
        Instant lastActivityAt,
        String doneSummary,
        String errorKind
) {
}
