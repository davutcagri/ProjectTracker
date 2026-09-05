package projectTracker.backend.dto.internal;

import java.time.Instant;

public record GitInfo(Instant lastCommitDate, String lastCommitMessage, int branchCount, int commitCount) {
}
