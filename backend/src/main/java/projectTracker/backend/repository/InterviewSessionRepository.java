package projectTracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import projectTracker.backend.model.entity.InterviewSession;
import projectTracker.backend.model.enums.InterviewStatus;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, String> {

    Optional<InterviewSession> findByProjectId(String projectId);

    boolean existsByStatusIn(Collection<InterviewStatus> statuses);

    Optional<InterviewSession> findFirstByStatusIn(Collection<InterviewStatus> statuses);

    List<InterviewSession> findByStatusInAndLastActivityAtBefore(Collection<InterviewStatus> statuses, Instant cutoff);
}
