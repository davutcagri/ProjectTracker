package projectTracker.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import projectTracker.backend.model.enums.InterviewErrorKind;
import projectTracker.backend.model.enums.InterviewStatus;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String projectId;
    private String claudeSessionId;
    @Enumerated(EnumType.STRING)
    private InterviewStatus status;
    @Enumerated(EnumType.STRING)
    private InterviewErrorKind errorKind;
    private Instant startedAt;
    private Instant lastActivityAt;
    @Column(columnDefinition = "TEXT")
    private String pendingQuestionsJson;
    @Column(columnDefinition = "TEXT")
    private String doneSummary;

}
