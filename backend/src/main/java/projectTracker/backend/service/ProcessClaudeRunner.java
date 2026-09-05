package projectTracker.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ClaudeExecution;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class ProcessClaudeRunner implements ClaudeRunner {

    private static final String AGENT_NAME = "portal-doc-generator";
    private static final String AGENT_DEFINITION_CLASSPATH = "agent/portal-doc-generator.json";
    private static final String WRITE_HOOK_CLASSPATH = "hooks/restrict-writes.py";
    private static final String WRITE_HOOK_MATCHER = "Write|Edit|MultiEdit";
    private static final String PERMISSION_MODE = "acceptEdits";
    private static final long TURN_TIMEOUT_MINUTES = 5;
    private static final int STDERR_TAIL_LINES = 20;

    private final ObjectMapper objectMapper;

    private volatile String cachedExecutable;
    private volatile String cachedAgentDefinition;
    private volatile String cachedHookScriptPath;
    private volatile String cachedSettingsJson;

    public ProcessClaudeRunner(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public ClaudeExecution startInterview(Path projectDir, String taskPrompt, String sessionId) {
        List<String> command = new ArrayList<>();
        command.add(resolveExecutable());
        command.add("-p");
        command.add(taskPrompt);
        command.add("--agents");
        command.add(agentDefinition());
        command.add("--agent");
        command.add(AGENT_NAME);
        command.add("--session-id");
        command.add(sessionId);
        command.addAll(commonArguments());
        return execute(projectDir, command);
    }

    @Override
    public ClaudeExecution resumeInterview(Path projectDir, String sessionId, String userAnswers) {
        List<String> command = new ArrayList<>();
        command.add(resolveExecutable());
        command.add("--resume");
        command.add(sessionId);
        command.add("-p");
        command.add(userAnswers);
        command.add("--agents");
        command.add(agentDefinition());
        command.add("--agent");
        command.add(AGENT_NAME);
        command.addAll(commonArguments());
        return execute(projectDir, command);
    }

    private List<String> commonArguments() {
        return new ArrayList<>(List.of(
                "--output-format", "stream-json",
                "--verbose",
                "--permission-mode", PERMISSION_MODE,
                "--settings", settingsJson()
        ));
    }

    private String settingsJson() {
        if (cachedSettingsJson != null) {
            return cachedSettingsJson;
        }
        Map<String, Object> hook = Map.of(
                "type", "command",
                "command", "python3 " + hookScriptPath()
        );
        Map<String, Object> matcher = Map.of(
                "matcher", WRITE_HOOK_MATCHER,
                "hooks", List.of(hook)
        );
        Map<String, Object> settings = Map.of(
                "hooks", Map.of("PreToolUse", List.of(matcher))
        );
        try {
            cachedSettingsJson = objectMapper.writeValueAsString(settings);
            return cachedSettingsJson;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Yazma kancasi ayarlari serilestirilinemedi", e);
        }
    }

    private String hookScriptPath() {
        if (cachedHookScriptPath != null) {
            return cachedHookScriptPath;
        }
        try (InputStream in = new ClassPathResource(WRITE_HOOK_CLASSPATH).getInputStream()) {
            Path directory = Path.of(System.getProperty("java.io.tmpdir"), "projecttracker-hooks");
            Files.createDirectories(directory);
            Path script = directory.resolve("restrict-writes.py");
            Files.copy(in, script, StandardCopyOption.REPLACE_EXISTING);
            script.toFile().setExecutable(true, true);
            cachedHookScriptPath = script.toAbsolutePath().toString();
            return cachedHookScriptPath;
        } catch (IOException e) {
            throw new UncheckedIOException("Yazma kancasi cikarilamadi: " + WRITE_HOOK_CLASSPATH, e);
        }
    }

    private ClaudeExecution execute(Path projectDir, List<String> command) {
        long startedAt = System.nanoTime();
        Path stdoutFile = null;
        Path stderrFile = null;
        Process process = null;
        try {
            stdoutFile = Files.createTempFile("claude-stdout-", ".jsonl");
            stderrFile = Files.createTempFile("claude-stderr-", ".log");

            ProcessBuilder builder = new ProcessBuilder(command);
            builder.directory(projectDir.toFile());
            builder.redirectErrorStream(false);
            builder.redirectOutput(stdoutFile.toFile());
            builder.redirectError(stderrFile.toFile());

            process = builder.start();
            boolean finished = process.waitFor(TURN_TIMEOUT_MINUTES, TimeUnit.MINUTES);

            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            String stdout = readFileQuietly(stdoutFile);
            String stderrTail = tail(readFileQuietly(stderrFile), STDERR_TAIL_LINES);

            if (!finished) {
                process.destroyForcibly();
                process.waitFor(10, TimeUnit.SECONDS);
                log.warn("claude cagrisi {} dakikada tamamlanmadi, surec sonlandirildi", TURN_TIMEOUT_MINUTES);
                return new ClaudeExecution(stdout, stderrTail, -1, durationMs, true);
            }

            return new ClaudeExecution(stdout, stderrTail, process.exitValue(), durationMs, false);
        } catch (IOException e) {
            throw new UncheckedIOException("claude sureci baslatilamadi", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (process != null) {
                process.destroyForcibly();
            }
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            return new ClaudeExecution("", "", -1, durationMs, true);
        } finally {
            deleteQuietly(stdoutFile);
            deleteQuietly(stderrFile);
        }
    }

    private String resolveExecutable() {
        if (cachedExecutable != null) {
            return cachedExecutable;
        }
        String override = System.getProperty("claude.cli.path");
        if (override == null || override.isBlank()) {
            override = System.getenv("CLAUDE_CLI_PATH");
        }
        if (override != null && !override.isBlank()) {
            cachedExecutable = override.trim();
            return cachedExecutable;
        }
        String discovered = which();
        cachedExecutable = discovered != null ? discovered : "claude";
        return cachedExecutable;
    }

    private String which() {
        try {
            Process probe = new ProcessBuilder("which", "claude").redirectErrorStream(true).start();
            String output = new String(probe.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = probe.waitFor(5, TimeUnit.SECONDS);
            if (finished && probe.exitValue() == 0) {
                return output.lines().map(String::trim).filter(line -> !line.isBlank()).findFirst().orElse(null);
            }
        } catch (IOException e) {
            log.warn("claude yolu 'which' ile bulunamadi", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return null;
    }

    private String agentDefinition() {
        if (cachedAgentDefinition != null) {
            return cachedAgentDefinition;
        }
        try (InputStream in = new ClassPathResource(AGENT_DEFINITION_CLASSPATH).getInputStream()) {
            cachedAgentDefinition = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            return cachedAgentDefinition;
        } catch (IOException e) {
            throw new UncheckedIOException("Agent tanimi okunamadi: " + AGENT_DEFINITION_CLASSPATH, e);
        }
    }

    private String readFileQuietly(Path file) {
        if (file == null) {
            return "";
        }
        try {
            return Files.readString(file, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.warn("Gecici cikti dosyasi okunamadi: {}", file, e);
            return "";
        }
    }

    private String tail(String text, int maxLines) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        String[] lines = text.split("\n", -1);
        if (lines.length <= maxLines) {
            return text;
        }
        StringBuilder builder = new StringBuilder();
        for (int i = lines.length - maxLines; i < lines.length; i++) {
            builder.append(lines[i]);
            if (i < lines.length - 1) {
                builder.append('\n');
            }
        }
        return builder.toString();
    }

    private void deleteQuietly(Path file) {
        if (file == null) {
            return;
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Gecici dosya silinemedi: {}", file);
        }
    }
}
