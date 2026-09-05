package projectTracker.backend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.NoHeadException;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.GitInfo;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;

@Service
public class GitService {

    public boolean isGitRepository(Path projectPath) {
        if (projectPath == null) {
            return false;
        }

        Path gitDir = projectPath.resolve(".git");

        FileRepositoryBuilder builder = new FileRepositoryBuilder()
                .setGitDir(gitDir.toFile())
                .setMustExist(true);

        try (Repository repository = builder.build()) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public GitInfo readGitInfo(Path projectPath) {
        if (!isGitRepository(projectPath)) {
            throw new IllegalStateException("Git deposu bulunamadı: " + projectPath);
        }

        Path gitDir = projectPath.resolve(".git");

        FileRepositoryBuilder builder = new FileRepositoryBuilder()
                .setGitDir(gitDir.toFile())
                .setMustExist(true);

        try (Repository repository = builder.build();
             Git git = new Git(repository)) {

            int branchCount = git.branchList().call().size();

            Instant lastCommitDate = null;
            String lastCommitMessage = null;
            int commitCount = 0;

            try {
                for (RevCommit commit : git.log().call()) {
                    if (commitCount == 0) {
                        lastCommitDate = Instant.ofEpochSecond(commit.getCommitTime());
                        lastCommitMessage = commit.getShortMessage();
                    }
                    commitCount++;
                }
            } catch (NoHeadException e) {
                lastCommitDate = null;
                lastCommitMessage = null;
                commitCount = 0;
            }

            return new GitInfo(lastCommitDate, lastCommitMessage, branchCount, commitCount);
        } catch (IOException | GitAPIException e) {
            throw new IllegalStateException("Git bilgisi okunamadı: " + projectPath, e);
        }
    }
}
