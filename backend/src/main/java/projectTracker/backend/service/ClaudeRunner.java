package projectTracker.backend.service;

import projectTracker.backend.dto.internal.ClaudeExecution;

import java.nio.file.Path;

public interface ClaudeRunner {

    ClaudeExecution startInterview(Path projectDir, String taskPrompt, String sessionId);

    ClaudeExecution resumeInterview(Path projectDir, String sessionId, String userAnswers);

    /**
     * Tek turlu, oturumsuz bir görevi çalıştırır: --agent/--session-id/--resume yok.
     * portal-doc-generator agent'ı var olan dosyaları değiştirmeyi reddettiği için
     * (bkz. agent tanımı kural 1) bu metot onun yerine varsayılan tool setiyle çalışır.
     */
    ClaudeExecution runTask(Path projectDir, String taskPrompt);
}
