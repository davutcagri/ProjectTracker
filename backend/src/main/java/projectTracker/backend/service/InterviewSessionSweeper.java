package projectTracker.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import projectTracker.backend.model.entity.InterviewSession;
import projectTracker.backend.model.enums.InterviewStatus;
import projectTracker.backend.repository.InterviewSessionRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
public class InterviewSessionSweeper {

    private static final Duration STALE_TTL = Duration.ofHours(24);
    private static final Duration ERROR_TTL = Duration.ofHours(1);
    private static final Duration DONE_GRACE = Duration.ofMinutes(2);

    private final InterviewSessionRepository sessionRepository;

    public InterviewSessionSweeper(InterviewSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Scheduled(fixedRate = 3_600_000L)
    public void sweepStaleAndErroredSessions() {
        Instant now = Instant.now();
        deleteSessions(
                List.of(InterviewStatus.RUNNING, InterviewStatus.WAITING_INPUT),
                now.minus(STALE_TTL),
                "terk edilmiş");
        deleteSessions(
                List.of(InterviewStatus.ERROR),
                now.minus(ERROR_TTL),
                "hatalı");
    }

    @Scheduled(fixedRate = 60_000L)
    public void sweepCompletedSessions() {
        deleteSessions(
                List.of(InterviewStatus.DONE),
                Instant.now().minus(DONE_GRACE),
                "tamamlanmış");
    }

    private void deleteSessions(List<InterviewStatus> statuses, Instant cutoff, String label) {
        List<InterviewSession> expired = sessionRepository.findByStatusInAndLastActivityAtBefore(statuses, cutoff);
        if (!expired.isEmpty()) {
            sessionRepository.deleteAll(expired);
            log.info("{} adet {} interview oturumu temizlendi", expired.size(), label);
        }
    }
}
