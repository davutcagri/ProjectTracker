package projectTracker.backend.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import projectTracker.backend.model.entity.ClaudeRun;

import java.time.Instant;
import java.util.List;

@Repository
public interface ClaudeRunRepository extends JpaRepository<ClaudeRun, String> {

    List<ClaudeRun> findAllByOrderByStartedAtDesc(Pageable pageable);

    long deleteByStartedAtBefore(Instant cutoff);
}
