package projectTracker.backend.dto.internal;

public record ClaudeExecution(String stdout, String stderrTail, int exitCode, long durationMs, boolean timedOut) {
}
