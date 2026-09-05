package projectTracker.backend.dto.request;

public record AnswerItem(String questionId, String answer, boolean skipped) {
}
