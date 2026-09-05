package projectTracker.backend.dto.internal;

import java.util.List;

public record InterviewTurnResult(
        String sessionId,
        String finalText,
        boolean success,
        List<Question> pendingQuestions,
        boolean done,
        String doneSummary,
        boolean questionsMalformed
) {
}
