package projectTracker.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RootPathRequest(
        @NotBlank(message = "Kök yol boş olamaz")
        String rootPath
) {
}
