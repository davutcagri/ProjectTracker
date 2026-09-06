package projectTracker.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import projectTracker.backend.model.enums.ClaudeRunOutcome;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaudeRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String projectId;
    private String sessionId;
    private Instant startedAt;
    private Long durationMs;
    private Integer exitCode;
    @Column(columnDefinition = "TEXT")
    private String stderrTail;
    @Enumerated(EnumType.STRING)
    private ClaudeRunOutcome outcome;

}
