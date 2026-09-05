package projectTracker.backend.dto.internal;

public record ProjectDocs(String fileName, String content) {
    public ProjectDocs() {
        this(null, null);
    }
    public boolean exists() {
        return content != null;
    }
}
