package projectTracker.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import projectTracker.backend.dto.response.ClaudeRunResponse;
import projectTracker.backend.service.LogService;

import java.util.List;

@RestController
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping("/api/logs")
    public List<ClaudeRunResponse> getLogs(@RequestParam(defaultValue = "100") int limit) {
        return logService.getRecentRuns(limit);
    }
}
