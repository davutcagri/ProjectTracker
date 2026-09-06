package projectTracker.backend.service;

import projectTracker.backend.dto.internal.ClaudeExecution;
import projectTracker.backend.model.enums.InterviewErrorKind;

import java.util.List;
import java.util.Locale;

public final class InterviewErrorClassifier {

    private static final List<String> STRONG_MARKERS = List.of(
            "invalid api key",
            "api key is invalid",
            "please run /login",
            "run /login",
            "run `claude login`",
            "claude login",
            "not logged in",
            "not authenticated",
            "no credentials",
            "credentials not found",
            "invalid credentials",
            "oauth token has expired",
            "oauth token expired",
            "login required",
            "please log in",
            "please sign in",
            "authentication_error",
            "authentication failed",
            "your session has expired",
            "session expired",
            "token has expired"
    );

    private static final List<String> WEAK_MARKERS = List.of(
            "authentication",
            "unauthorized",
            "api key",
            "oauth",
            "401"
    );

    private InterviewErrorClassifier() {
    }

    public static InterviewErrorKind classify(ClaudeExecution execution) {
        if (execution == null) {
            return InterviewErrorKind.GENERIC;
        }
        if (execution.timedOut()) {
            return InterviewErrorKind.TIMEOUT;
        }
        if (containsAny(execution.stderrTail(), STRONG_MARKERS)
                || containsAny(execution.stderrTail(), WEAK_MARKERS)
                || containsAny(execution.stdout(), STRONG_MARKERS)) {
            return InterviewErrorKind.NOT_AUTHENTICATED;
        }
        return InterviewErrorKind.GENERIC;
    }

    public static InterviewErrorKind classifyMessage(String message) {
        if (containsAny(message, STRONG_MARKERS) || containsAny(message, WEAK_MARKERS)) {
            return InterviewErrorKind.NOT_AUTHENTICATED;
        }
        return InterviewErrorKind.GENERIC;
    }

    private static boolean containsAny(String text, List<String> markers) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        for (String marker : markers) {
            if (lower.contains(marker)) {
                return true;
            }
        }
        return false;
    }
}
