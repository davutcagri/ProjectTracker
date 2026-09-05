package projectTracker.backend.service;

import projectTracker.backend.dto.internal.ClaudeExecution;

import java.nio.file.Path;

public interface ClaudeRunner {

    ClaudeExecution startInterview(Path projectDir, String taskPrompt, String sessionId);

    ClaudeExecution resumeInterview(Path projectDir, String sessionId, String userAnswers);
}
