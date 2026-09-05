package projectTracker.backend.dto.response;

import projectTracker.backend.dto.internal.Milestone;
import projectTracker.backend.dto.internal.ProjectDocs;

import java.time.Instant;
import java.util.List;


public record ProjectDetailedResponse(String id, String path, String displayName, String notes, List<ProjectDocs> docs, Integer progress, List<Milestone> milestones, Instant lastScanAt) {
}
