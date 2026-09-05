package projectTracker.backend.dto.internal;

import java.util.List;

public record Question(String id, String text, String type, List<String> choices, String placeholder) {
}
