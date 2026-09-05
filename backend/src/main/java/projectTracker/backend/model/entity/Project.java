package projectTracker.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import projectTracker.backend.model.enums.DocsStatus;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String path;
    private String displayName;
    private String notes;
    private Boolean pinned;
    private Instant lastScanAt;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DocsStatus docsStatus = DocsStatus.UNKNOWN;

}
