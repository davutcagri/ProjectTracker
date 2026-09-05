package projectTracker.backend.service;

import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.GitInfo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

@Service
public class LastActivityService {

    private static final String[] DOC_FILE_NAMES = {"README.md", "SCOPE.md", "ROADMAP.md"};

    private final GitService gitService;

    public LastActivityService(GitService gitService) {
        this.gitService = gitService;
    }

    public Instant resolveLastActivity(Path projectPath) {
        if (projectPath == null) {
            return null;
        }

        if (gitService.isGitRepository(projectPath)) {
            GitInfo gitInfo = gitService.readGitInfo(projectPath);
            if (gitInfo.lastCommitDate() != null) {
                return gitInfo.lastCommitDate();
            }
        }

        return newestDocModifiedTime(projectPath);
    }

    private Instant newestDocModifiedTime(Path projectPath) {
        Instant newest = null;
        for (String fileName : DOC_FILE_NAMES) {
            Path docPath = projectPath.resolve(fileName);
            if (!Files.isRegularFile(docPath)) {
                continue;
            }
            try {
                Instant modifiedAt = Files.getLastModifiedTime(docPath).toInstant();
                if (newest == null || modifiedAt.isAfter(newest)) {
                    newest = modifiedAt;
                }
            } catch (IOException e) {
                continue;
            }
        }
        return newest;
    }
}
