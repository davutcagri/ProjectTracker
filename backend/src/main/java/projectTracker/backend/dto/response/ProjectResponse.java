package projectTracker.backend.dto.response;

import projectTracker.backend.model.entity.Project;

import java.time.Instant;

public record ProjectResponse(
        String id,
        String path,
        String displayName,
        boolean pinned,
        String docsStatus,
        Instant lastScanAt,
        Integer progress,
        Instant lastActivity
) {

    public static ProjectResponse from(Project p, Integer progress, Instant lastActivity) {
        return new ProjectResponse(
                p.getId(),
                p.getPath(),
                p.getDisplayName(),
                Boolean.TRUE.equals(p.getPinned()),
                p.getDocsStatus() == null ? null : p.getDocsStatus().name(),
                p.getLastScanAt(),
                progress,
                lastActivity
        );
    }
}
