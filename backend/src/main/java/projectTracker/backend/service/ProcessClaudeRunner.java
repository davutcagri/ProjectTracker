package projectTracker.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ClaudeExecution;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

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
                "command", python3Executable() + " " + hookScriptPath()
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
            enrichPath(builder, command.get(0));
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
            log.info("claude yolu override ile belirlendi: {}", cachedExecutable);
            return cachedExecutable;
        }

        String viaShell = resolveViaLoginShell();
        if (viaShell != null) {
            log.info("claude yolu login shell ile bulundu: {}", viaShell);
            cachedExecutable = viaShell;
            return cachedExecutable;
        }

        String viaScan = scanKnownPaths();
        if (viaScan != null) {
            log.info("claude yolu bilinen dizin taramasiyla bulundu: {}", viaScan);
            cachedExecutable = viaScan;
            return cachedExecutable;
        }

        log.warn("claude CLI bulunamadi. PATH={} ; login shell ve bilinen yollar tarandi, calistirilabilir 'claude' yok. Duz 'claude' denenecek.",
                System.getenv("PATH"));
        cachedExecutable = "claude";
        return cachedExecutable;
    }

    private String resolveViaLoginShell() {
        String shell = System.getenv("SHELL");
        if (shell == null || shell.isBlank()) {
            shell = "/bin/zsh";
        }
        List<List<String>> flagSets = List.of(
                List.of("-l", "-c"),
                List.of("-l", "-i", "-c")
        );
        for (List<String> flags : flagSets) {
            String candidate = runShellLookup(shell, flags);
            if (candidate != null && isExecutableFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private String runShellLookup(String shell, List<String> flags) {
        Process probe = null;
        try {
            List<String> command = new ArrayList<>();
            command.add(shell);
            command.addAll(flags);
            command.add("command -v claude");
            probe = new ProcessBuilder(command).redirectErrorStream(false).start();
            String output = new String(probe.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = probe.waitFor(5, TimeUnit.SECONDS);
            if (!finished) {
                probe.destroyForcibly();
                return null;
            }
            if (probe.exitValue() != 0) {
                return null;
            }
            return output.lines().map(String::trim).filter(line -> !line.isBlank()).findFirst().orElse(null);
        } catch (IOException e) {
            log.warn("claude login shell aramasi basarisiz ({} {})", shell, flags, e);
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (probe != null) {
                probe.destroyForcibly();
            }
            return null;
        }
    }

    private String scanKnownPaths() {
        String home = System.getProperty("user.home");
        List<String> candidates = List.of(
                "/opt/homebrew/bin/claude",
                "/usr/local/bin/claude",
                home + "/.claude/local/claude",
                home + "/.local/bin/claude",
                home + "/.npm-global/bin/claude"
        );
        for (String candidate : candidates) {
            if (isExecutableFile(candidate)) {
                return candidate;
            }
        }
        return newestCaskroomClaude();
    }

    private String newestCaskroomClaude() {
        Path base = Path.of("/opt/homebrew/Caskroom/claude-code");
        if (!Files.isDirectory(base)) {
            return null;
        }
        try (Stream<Path> versions = Files.list(base)) {
            return versions
                    .filter(Files::isDirectory)
                    .map(dir -> dir.resolve("claude"))
                    .filter(path -> isExecutableFile(path.toString()))
                    .max((a, b) -> compareVersions(
                            a.getParent().getFileName().toString(),
                            b.getParent().getFileName().toString()))
                    .map(Path::toString)
                    .orElse(null);
        } catch (IOException e) {
            return null;
        }
    }

    private int compareVersions(String a, String b) {
        String[] left = a.split("\\.");
        String[] right = b.split("\\.");
        int length = Math.max(left.length, right.length);
        for (int i = 0; i < length; i++) {
            int x = i < left.length ? parseVersionPart(left[i]) : 0;
            int y = i < right.length ? parseVersionPart(right[i]) : 0;
            if (x != y) {
                return Integer.compare(x, y);
            }
        }
        return 0;
    }

    private int parseVersionPart(String part) {
        StringBuilder digits = new StringBuilder();
        for (char c : part.toCharArray()) {
            if (Character.isDigit(c)) {
                digits.append(c);
            } else {
                break;
            }
        }
        return digits.isEmpty() ? 0 : Integer.parseInt(digits.toString());
    }

    private boolean isExecutableFile(String path) {
        if (path == null || path.isBlank()) {
            return false;
        }
        File file = new File(path);
        return file.isFile() && file.canExecute();
    }

    private String python3Executable() {
        return isExecutableFile("/usr/bin/python3") ? "/usr/bin/python3" : "python3";
    }

    private void enrichPath(ProcessBuilder builder, String executable) {
        Map<String, String> environment = builder.environment();
        String currentPath = environment.getOrDefault("PATH", "");
        LinkedHashSet<String> entries = new LinkedHashSet<>();
        File executableFile = new File(executable);
        if (executableFile.isAbsolute() && executableFile.getParentFile() != null) {
            entries.add(executableFile.getParentFile().getAbsolutePath());
        }
        entries.add("/opt/homebrew/bin");
        entries.add("/usr/local/bin");
        if (!currentPath.isBlank()) {
            entries.addAll(Arrays.asList(currentPath.split(File.pathSeparator)));
        }
        environment.put("PATH", String.join(File.pathSeparator, entries));
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
