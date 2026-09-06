package projectTracker.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import projectTracker.backend.repository.ClaudeRunRepository;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Component
public class ClaudeRunSweeper {

    private static final Duration RETENTION = Duration.ofDays(30);

    private final ClaudeRunRepository claudeRunRepository;

    public ClaudeRunSweeper(ClaudeRunRepository claudeRunRepository) {
        this.claudeRunRepository = claudeRunRepository;
    }

    @Scheduled(fixedRate = 86_400_000L)
    @Transactional
    public void sweepOldRuns() {
        long removed = claudeRunRepository.deleteByStartedAtBefore(Instant.now().minus(RETENTION));
        if (removed > 0) {
            log.info("{} adet eski claude_run kaydi temizlendi", removed);
        }
    }
}
