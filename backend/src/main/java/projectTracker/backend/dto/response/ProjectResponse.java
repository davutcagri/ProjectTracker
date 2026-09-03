package projectTracker.backend.dto.response;

import projectTracker.backend.model.Project;

import java.time.Instant;

public record ProjectResponse(
        String id,
        String path,
        String displayName,
        boolean pinned,
        String docsStatus,
        Instant lastScanAt
) {

    public static ProjectResponse from(Project p) {
        return new ProjectResponse(
                p.getId(),
                p.getPath(),
                p.getDisplayName(),
                Boolean.TRUE.equals(p.getPinned()),
                p.getDocsStatus() == null ? null : p.getDocsStatus().name(),
                p.getLastScanAt()
        );
    }
}
